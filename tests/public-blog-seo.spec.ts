import { afterEach, describe, expect, test } from "bun:test";

const root = new URL("../", import.meta.url);

async function source(path: string) {
  return Bun.file(new URL(path, root)).text();
}

afterEach(() => {
  delete process.env.NEXT_PUBLIC_BASE_URL;
});

describe("Semsei SEO ownership", () => {
  test("delegates the Semsei child sitemap to the package without rebuilding URLs", async () => {
    const route = await source("src/app/sitemap-semsei-blog.xml/route.ts");

    expect(route.trim()).toBe(
      'export { GET } from "@semsei/next-blog/sitemap";',
    );
    expect(route).not.toContain("entry.slug");
    expect(route).not.toContain("blog.ethicvoice.co");
  });

  test("preserves every existing sitemap index child", async () => {
    const route = await source("src/app/sitemap.xml/route.ts");

    expect(route).toContain("`${base}/sitemap-main.xml`");
    expect(route).toContain("`${base}/sitemap-blog.xml`");
    expect(route).toContain("`${base}/sitemap-semsei-blog.xml`");
    expect(route.match(/sitemap-semsei-blog\.xml/g)).toHaveLength(1);
    expect(route).not.toContain("blog.ethicvoice.co");
  });

  test("keeps robots public and points at the canonical sitemap index", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://wrong-host.example/";
    const { default: robots } = await import("../src/app/robots");
    const shadowingStaticRobots = Bun.file(new URL("public/robots.txt", root));

    expect(await shadowingStaticRobots.exists()).toBe(false);
    expect(robots()).toEqual({
      rules: [{ userAgent: "*", allow: "/" }],
      sitemap: "https://ethicvoice.co/sitemap.xml",
      host: "https://ethicvoice.co",
    });
  });

  test("exposes only the signed Semsei revalidation endpoint before Clerk", async () => {
    const route = await source("src/app/api/semsei/revalidate/route.ts");
    const proxy = await source("src/proxy.ts");

    expect(route.trim()).toBe(
      'export { POST } from "@semsei/next-blog/revalidate";',
    );
    expect(proxy).toContain('"/api/semsei/revalidate"');
    expect(proxy).not.toContain('"/api/semsei(.*)"');
    expect(proxy.indexOf('"/api/semsei/revalidate"')).toBeLessThan(
      proxy.indexOf("const clerkHandler = clerkMiddleware("),
    );
  });
});
