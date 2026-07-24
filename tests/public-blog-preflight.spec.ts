import { describe, expect, mock, test } from "bun:test";
import type { PublicBlogPreflightFetch } from "../src/lib/public-blog-preflight";

mock.module("server-only", () => ({}));

const root = new URL("../", import.meta.url);

test("provides a dedicated server-only Semsei CODE preflight", async () => {
  const helper = Bun.file(
    new URL("src/lib/public-blog-preflight.ts", root),
  );

  expect(await helper.exists()).toBe(true);
});

describe("public blog preflight", () => {
  test("runs before marker signing and Clerk with generic failure responses", async () => {
    const proxy = await Bun.file(new URL("src/proxy.ts", root)).text();
    const preflight = proxy.indexOf("await preflightPublicBlog(");
    const markerSign = proxy.indexOf("await signPublicBlogMarker(");
    const clerkDelegation = proxy.indexOf("clerkHandler(sanitizedRequest, event)");

    expect(proxy).toContain('from "@/lib/public-blog-preflight"');
    expect(proxy).toContain("process.env.SEMSEI_API_KEY");
    expect(proxy).toContain('preflight.status === "not-found"');
    expect(proxy).toContain('preflight.status === "bad-gateway"');
    expect(proxy).toContain('new NextResponse("Not Found", {');
    expect(proxy).toContain('new NextResponse("Bad Gateway", {');
    expect(proxy).toContain('"Cache-Control": "private, no-store, max-age=0"');
    expect(preflight).toBeGreaterThan(-1);
    expect(markerSign).toBeGreaterThan(preflight);
    expect(clerkDelegation).toBeGreaterThan(markerSign);
  });

  test("validates and forwards a nested static-looking slug to CODE only", async () => {
    const { preflightPublicBlog } = await import(
      "../src/lib/public-blog-preflight"
    );
    let requestedUrl = "";
    let requestedInit: RequestInit | undefined;
    const fetcher: PublicBlogPreflightFetch = async (input, init) => {
      requestedUrl = String(input);
      requestedInit = init;
      return new Response(null, { status: 200 });
    };

    const result = await preflightPublicBlog(
      "/es/blogs/archive/article.html",
      "ETHICVOICE.co",
      {
        apiKey: "server-only-key",
        apiUrl: "https://app.semsei.example/",
        fetch: fetcher,
        timeoutMs: 2500,
      },
    );

    expect(result).toEqual({
      status: "ok",
      context: {
        host: "ethicvoice.co",
        locale: "es",
        pathname: "/es/blogs/archive/article.html",
      },
    });
    expect(requestedUrl).toBe(
      "https://app.semsei.example/api/public/code/page?host=ethicvoice.co&slug=archive%2Farticle.html&locale=es",
    );
    expect(new Headers(requestedInit?.headers).get("authorization")).toBe(
      "Bearer server-only-key",
    );
    expect(requestedInit?.cache).toBe("no-store");
    expect(requestedInit?.signal).toBeInstanceOf(AbortSignal);
  });

  test("maps only a definitive CODE 404 to not-found", async () => {
    const { preflightPublicBlog } = await import(
      "../src/lib/public-blog-preflight"
    );

    const result = await preflightPublicBlog(
      "/en/blogs/guides/missing",
      "ethicvoice.co",
      {
        apiKey: "server-only-key",
        apiUrl: "https://app.semsei.example",
        fetch: async () => new Response(null, { status: 404 }),
        timeoutMs: 2500,
      },
    );

    expect(result).toEqual({ status: "not-found" });
  });

  test.each([401, 409, 429, 500, 503])(
    "maps CODE HTTP %s to a generic bad gateway",
    async (status) => {
      const { preflightPublicBlog } = await import(
        "../src/lib/public-blog-preflight"
      );
      const result = await preflightPublicBlog(
        "/es/blogs/article",
        "ethicvoice.co",
        {
          apiKey: "server-only-key",
          apiUrl: "https://app.semsei.example",
          fetch: async () => new Response(null, { status }),
          timeoutMs: 2500,
        },
      );

      expect(result).toEqual({ status: "bad-gateway" });
    },
  );

  test("fails closed on timeout, network, configuration, and invalid context", async () => {
    const { preflightPublicBlog } = await import(
      "../src/lib/public-blog-preflight"
    );
    let requests = 0;
    const fetcher: PublicBlogPreflightFetch = async () => {
      requests += 1;
      throw new DOMException("timed out", "AbortError");
    };
    const baseDependencies = {
      apiKey: "server-only-key",
      apiUrl: "https://app.semsei.example",
      fetch: fetcher,
      timeoutMs: 2500,
    };

    expect(
      await preflightPublicBlog(
        "/es/blogs/article",
        "ethicvoice.co",
        baseDependencies,
      ),
    ).toEqual({ status: "bad-gateway" });
    expect(
      await preflightPublicBlog("/fr/blogs/article", "ethicvoice.co", {
        ...baseDependencies,
        fetch: (() => {
          throw new Error("must not fetch");
        }),
      }),
    ).toEqual({ status: "bad-gateway" });
    expect(
      await preflightPublicBlog("/es/blogs/../admin", "ethicvoice.co", {
        ...baseDependencies,
        fetch: (() => {
          throw new Error("must not fetch");
        }),
      }),
    ).toEqual({ status: "bad-gateway" });
    expect(
      await preflightPublicBlog("/es/blogs/article", "bad host", {
        ...baseDependencies,
        fetch: (() => {
          throw new Error("must not fetch");
        }),
      }),
    ).toEqual({ status: "bad-gateway" });
    expect(
      await preflightPublicBlog("/es/blogs/article", "ethicvoice.co", {
        ...baseDependencies,
        apiKey: undefined,
        fetch: (() => {
          throw new Error("must not fetch");
        }),
      }),
    ).toEqual({ status: "bad-gateway" });
    expect(requests).toBe(1);
  });
});
