import { describe, expect, test } from "bun:test";

const root = new URL("../", import.meta.url);

async function source(path: string) {
  return Bun.file(new URL(path, root)).text();
}

describe("public localized Semsei blog boundary", () => {
  test("signs blog context and rejects forged, tampered, or replayed markers", async () => {
    const markerModule = await import("../src/lib/public-blog");

    expect(typeof markerModule.createPublicBlogContext).toBe("function");
    expect(typeof markerModule.signPublicBlogMarker).toBe("function");
    expect(typeof markerModule.verifyPublicBlogMarker).toBe("function");
    if (
      typeof markerModule.createPublicBlogContext !== "function" ||
      typeof markerModule.signPublicBlogMarker !== "function" ||
      typeof markerModule.verifyPublicBlogMarker !== "function"
    ) {
      return;
    }

    const secret = "test-secret-at-least-32-characters-long";
    const context = markerModule.createPublicBlogContext(
      "/es/blogs/guides/nested-article",
      "EthicVoice.CO",
    );
    expect(context).toEqual({
      host: "ethicvoice.co",
      locale: "es",
      pathname: "/es/blogs/guides/nested-article",
    });

    const marker = await markerModule.signPublicBlogMarker(context!, secret);
    expect(marker).not.toBeNull();
    if (!marker) return;

    expect(
      await markerModule.verifyPublicBlogMarker(
        marker,
        "/es/blogs/guides/nested-article",
        "ethicvoice.co",
        secret,
      ),
    ).toEqual(context);
    expect(
      await markerModule.verifyPublicBlogMarker(
        "forged",
        "/es/blogs/guides/nested-article",
        "ethicvoice.co",
        secret,
      ),
    ).toBeNull();
    expect(
      await markerModule.verifyPublicBlogMarker(
        `${marker.slice(0, -1)}${marker.endsWith("a") ? "b" : "a"}`,
        "/es/blogs/guides/nested-article",
        "ethicvoice.co",
        secret,
      ),
    ).toBeNull();
    expect(
      await markerModule.verifyPublicBlogMarker(
        marker,
        "/es/blogs/guides/nested-article",
        "attacker.test",
        secret,
      ),
    ).toBeNull();
    expect(
      await markerModule.verifyPublicBlogMarker(
        marker,
        "/es/blogs/different-article",
        "ethicvoice.co",
        secret,
      ),
    ).toBeNull();
    expect(
      await markerModule.verifyPublicBlogMarker(
        marker,
        "/es/blogs/guides/nested-article",
        "ethicvoice.co",
        "",
      ),
    ).toBeNull();
  });

  test("matches both localized blog routes before invoking Clerk auth", async () => {
    const proxy = await source("src/proxy.ts");
    const publicCheck = proxy.indexOf("export default async function proxy");
    const blogCheck = proxy.indexOf(
      "if (isPublicBlogRoute(sanitizedRequest))",
      publicCheck,
    );
    const preflight = proxy.indexOf("await preflightPublicBlog(", blogCheck);
    const clerkDelegation = proxy.indexOf(
      "clerkHandler(sanitizedRequest, event)",
    );
    const authCall = proxy.indexOf("await auth()");

    expect(proxy).toContain('"/en/blogs/(.*)"');
    expect(proxy).toContain('"/es/blogs/(.*)"');
    expect(publicCheck).toBeGreaterThan(-1);
    expect(blogCheck).toBeGreaterThan(publicCheck);
    expect(preflight).toBeGreaterThan(blogCheck);
    expect(clerkDelegation).toBeGreaterThan(blogCheck);
    expect(proxy).toContain("const clerkHandler = clerkMiddleware(");
    expect(authCall).toBeGreaterThan(proxy.indexOf("if (isPublicRoute(req))"));
    expect(proxy.match(/"\/app\(\.\*\)"/g)?.length).toBe(2);
    expect(proxy).toContain('"/en/blogs/:path*"');
    expect(proxy).toContain('"/es/blogs/:path*"');
  });

  test("removes incoming markers and signs only matched blog requests", async () => {
    const proxy = await source("src/proxy.ts");

    const markerDelete = proxy.indexOf(
      "requestHeaders.delete(PUBLIC_BLOG_REQUEST_HEADER)",
    );
    const pathDelete = proxy.indexOf(
      "requestHeaders.delete(PUBLIC_BLOG_PATH_HEADER)",
    );
    const blogCheck = proxy.indexOf(
      "if (isPublicBlogRoute(sanitizedRequest))",
    );
    const preflight = proxy.indexOf("await preflightPublicBlog(", blogCheck);
    const markerSign = proxy.indexOf("await signPublicBlogMarker(");
    const clerkDelegation = proxy.indexOf("clerkHandler(sanitizedRequest, event)");

    expect(markerDelete).toBeGreaterThan(-1);
    expect(pathDelete).toBeGreaterThan(markerDelete);
    expect(proxy).toContain(
      "requestHeaders.set(PUBLIC_BLOG_PATH_HEADER, pathname)",
    );
    expect(blogCheck).toBeGreaterThan(markerDelete);
    expect(preflight).toBeGreaterThan(blogCheck);
    expect(markerSign).toBeGreaterThan(preflight);
    expect(clerkDelegation).toBeGreaterThan(markerSign);
    expect(proxy).not.toContain('isPublicBlog ? "1" : "0"');
  });

  test("skips Clerk server auth and ClientProvider for trusted blog requests", async () => {
    const layout = await source("src/app/layout.tsx");
    const defaultProvidersFile = Bun.file(
      new URL("src/app/default-root-providers.tsx", root),
    );

    expect(await defaultProvidersFile.exists()).toBe(true);
    if (!(await defaultProvidersFile.exists())) return;

    const defaultProviders = await defaultProvidersFile.text();
    const markerRead = layout.indexOf(
      ".get(PUBLIC_BLOG_REQUEST_HEADER)",
    );
    const pathRead = layout.indexOf(".get(PUBLIC_BLOG_PATH_HEADER)");
    const guardedBranch = layout.indexOf("if (!publicBlogContext)");
    const providerImport = layout.search(
      /await import\(\s*"\.\/default-root-providers"\s*\)/,
    );
    const markerVerification = layout.indexOf("await verifyPublicBlogMarker(");

    expect(markerRead).toBeGreaterThan(-1);
    expect(pathRead).toBeGreaterThan(markerRead);
    expect(markerVerification).toBeGreaterThan(markerRead);
    expect(layout).not.toContain("@clerk/nextjs");
    expect(layout).not.toContain("ClientProvider");
    expect(providerImport).toBeGreaterThan(guardedBranch);
    expect(layout).toContain("let content = children");
    expect(layout).toContain("{content}");
    expect(defaultProviders).toContain("await auth()");
    expect(defaultProviders).toContain("await currentUser()");
    expect(defaultProviders).toContain("<ClientProvider");
    expect(layout).toContain('lang={publicBlogContext?.locale ?? "en"}');
  });

  test("localized route delegates page and metadata to the package", async () => {
    const routeFile = Bun.file(
      new URL("src/app/[locale]/blogs/[...slug]/page.tsx", root),
    );

    expect(await routeFile.exists()).toBe(true);
    if (!(await routeFile.exists())) return;

    const route = await routeFile.text();

    expect(route.trim()).toBe(
      'export { generateMetadata, default } from "@semsei/next-blog/page";',
    );
  });

  test("keeps the package registry-deployable", async () => {
    const packageJson = await source("package.json");
    const manifest = JSON.parse(packageJson) as {
      dependencies: Record<string, string>;
    };
    const dependency = manifest.dependencies["@semsei/next-blog"];

    expect(dependency).toBeTruthy();
    expect(dependency).not.toMatch(/^(file:|link:|workspace:|\/|\.\.?\/)/);
  });

  test("linked verification authenticates the artifact and restores registry state", async () => {
    const verifierFile = Bun.file(
      new URL("scripts/verify-public-blog-linked.ts", root),
    );

    expect(await verifierFile.exists()).toBe(true);
    if (!(await verifierFile.exists())) return;

    const verifier = await verifierFile.text();
    expect(verifier).toContain("realpath");
    expect(verifier).toContain("artifactSha256");
    expect(verifier).toContain("bun link --no-save @semsei/next-blog");
    expect(verifier).toContain("bun install --frozen-lockfile --force");
    expect(verifier).toContain("PUBLIC_BLOG_ARTIFACT_IDENTITY");
    expect(verifier).toContain("PUBLIC_BLOG_RESTORE_IDENTITY");
    expect(verifier).toContain("MOCK_SEMSEI_PORT");
    expect(verifier).toContain('["bunx", "next", "build", "--webpack"]');
    expect(verifier).toContain('["bun", "run", "start"]');
    expect(verifier).toContain('NEXT_PUBLIC_BASE_URL: "https://ethicvoice.co"');
  });
});
