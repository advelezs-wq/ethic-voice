import {
  lstatSync,
  realpathSync,
} from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";

const appRoot = resolve(import.meta.dir, "..");
const packageRoot = resolve(
  process.argv[2] || process.env.SEMSEI_BLOG_PACKAGE_DIR || "",
);

if (!process.argv[2] && !process.env.SEMSEI_BLOG_PACKAGE_DIR) {
  console.error(
    "Usage: bun run verify:public-blog -- /absolute/path/to/semsei-blog-dep",
  );
  process.exit(2);
}

const linkedPackagePath = resolve(
  appRoot,
  "node_modules/@semsei/next-blog",
);
const appUrl = "http://127.0.0.1:3000";

async function getAvailablePort() {
  return new Promise<number>((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not allocate a mock API port"));
        return;
      }
      server.close((error) => {
        if (error) reject(error);
        else resolvePort(address.port);
      });
    });
  });
}

async function sha256(path: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await Bun.file(path).arrayBuffer(),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function run(command: string[], cwd: string, env?: Record<string, string>) {
  console.log(`$ (${cwd}) ${command.join(" ")}`);
  const result = Bun.spawnSync(command, {
    cwd,
    env: { ...process.env, ...env },
    stdout: "inherit",
    stderr: "inherit",
  });
  if (result.exitCode !== 0) {
    throw new Error(`Command failed (${result.exitCode}): ${command.join(" ")}`);
  }
}

async function waitFor(url: string) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await Bun.sleep(250);
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

const packageJsonBefore = await sha256(resolve(appRoot, "package.json"));
const lockfileBefore = await sha256(resolve(appRoot, "bun.lock"));
const sourceManifest = await Bun.file(resolve(packageRoot, "package.json")).json();
const appManifest = await Bun.file(resolve(appRoot, "package.json")).json();
const mockPort = await getAvailablePort();
const mockApiUrl = `http://127.0.0.1:${mockPort}`;
const appFixtureEnv = {
  SEMSEI_API_URL: mockApiUrl,
  NEXT_PUBLIC_BASE_URL: "https://ethicvoice.co",
};
let mockProcess: ReturnType<typeof Bun.spawn> | undefined;
let appProcess: ReturnType<typeof Bun.spawn> | undefined;

try {
  run(["bun", "test"], packageRoot);
  run(["bunx", "tsc", "--noEmit"], packageRoot);
  run(["bun", "run", "build"], packageRoot);
  run(["bun", "link"], packageRoot);

  // Equivalent CLI: bun link --no-save @semsei/next-blog
  run(["bun", "link", "--no-save", "@semsei/next-blog"], appRoot);

  const resolvedPackage = realpathSync(linkedPackagePath);
  const linkedManifest = await Bun.file(
    resolve(linkedPackagePath, "package.json"),
  ).json();
  const artifactSha256 = await sha256(
    resolve(linkedPackagePath, "dist/page.js"),
  );
  const sourceArtifactSha256 = await sha256(
    resolve(packageRoot, "dist/page.js"),
  );

  if (resolvedPackage !== realpathSync(packageRoot)) {
    throw new Error(`Linked package resolved to unexpected path: ${resolvedPackage}`);
  }
  if (linkedManifest.version !== sourceManifest.version) {
    throw new Error("Linked package version does not match source package version");
  }
  if (artifactSha256 !== sourceArtifactSha256) {
    throw new Error("Linked package artifact hash does not match source dist");
  }

  console.log("PUBLIC_BLOG_ARTIFACT_IDENTITY", {
    resolvedPackage,
    version: linkedManifest.version,
    artifactSha256,
  });

  mockProcess = Bun.spawn(["python3", "tests/mock_semsei_api.py"], {
    cwd: appRoot,
    env: { ...process.env, MOCK_SEMSEI_PORT: String(mockPort) },
    stdout: "inherit",
    stderr: "inherit",
  });
  await waitFor(`${mockApiUrl}/api/public/code/pages`);

  run(["bunx", "next", "build", "--webpack"], appRoot, appFixtureEnv);

  appProcess = Bun.spawn(["bun", "run", "start"], {
    cwd: appRoot,
    env: { ...process.env, ...appFixtureEnv },
    stdout: "inherit",
    stderr: "inherit",
  });
  await waitFor(`${appUrl}/pricing`);

  run(["bun", "run", "test:public-blog"], appRoot);
  run(["bun", "run", "test:public-blog:runtime"], appRoot);
} finally {
  appProcess?.kill();
  mockProcess?.kill();
  await appProcess?.exited;
  await mockProcess?.exited;

  // Equivalent CLI: bun install --frozen-lockfile --force
  run(["bun", "install", "--frozen-lockfile", "--force"], appRoot);
  run(["bun", "unlink"], packageRoot);

  const packageJsonAfter = await sha256(resolve(appRoot, "package.json"));
  const lockfileAfter = await sha256(resolve(appRoot, "bun.lock"));
  const restoredManifest = await Bun.file(
    resolve(linkedPackagePath, "package.json"),
  ).json();
  const restoredPath = realpathSync(linkedPackagePath);
  const restoredIsLink = lstatSync(linkedPackagePath).isSymbolicLink();

  if (
    packageJsonAfter !== packageJsonBefore ||
    lockfileAfter !== lockfileBefore ||
    restoredIsLink ||
    restoredManifest.version !== appManifest.dependencies["@semsei/next-blog"]
  ) {
    throw new Error("Registry dependency state was not restored exactly");
  }

  console.log("PUBLIC_BLOG_RESTORE_IDENTITY", {
    resolvedPackage: restoredPath,
    version: restoredManifest.version,
    packageJsonSha256: packageJsonAfter,
    lockfileSha256: lockfileAfter,
  });
}
