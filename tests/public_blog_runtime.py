import json
import os
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


URL = os.environ.get(
    "PUBLIC_BLOG_TEST_URL",
    "http://localhost:3000/es/blogs/mundial-2026-tu-guia-de-compliance",
)
AUTH_STATE = os.environ.get("PUBLIC_BLOG_AUTH_STATE")
BASE_URL = "http://localhost:3000/es/blogs"
BASE_SLUG = "mundial-2026-tu-guia-de-compliance"
GOOGLEBOT_USER_AGENT = (
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
)


def inspect_page(
    browser,
    slug=BASE_SLUG,
    expected_h1="Mundial 2026: Tu guia de compliance",
    storage_state=None,
    cookies=None,
    user_agent=None,
):
    context = browser.new_context(
        storage_state=storage_state,
        user_agent=user_agent,
        extra_http_headers={
            "x-forwarded-host": "ethicvoice.co",
            "x-ethicvoice-public-blog": "forged-client-marker",
            "x-ethicvoice-public-blog-path": "/es/blogs/replayed-path",
        },
    )
    if cookies:
        context.add_cookies(cookies)
    page = context.new_page()
    clerk_requests = []

    def record_request(request):
        request_url = request.url.lower()
        if (
            "/v1/client/handshake" in request_url
            or "clerk.browser.js" in request_url
        ):
            clerk_requests.append(request.url)

    page.on("request", record_request)
    url = f"{BASE_URL}/{slug}"
    response = page.goto(url, wait_until="networkidle")

    assert response is not None
    assert response.status == 200, f"Expected HTTP 200, got {response.status}"
    assert urlparse(page.url).netloc == urlparse(url).netloc, (
        f"Unexpected navigation away from blog: {page.url}"
    )
    assert not clerk_requests, f"Observed Clerk browser requests: {clerk_requests}"
    assert "clerk.browser.js" not in page.content().lower(), (
        "Rendered HTML contains clerk.browser.js"
    )
    assert page.locator("html").get_attribute("lang") == "es", (
        "Expected localized document language"
    )

    heading = page.locator("h1").first
    assert heading.is_visible(), "Expected a visible article H1"
    h1 = heading.inner_text().strip()
    assert h1 == expected_h1, f"Unexpected article H1: {h1!r}"

    canonical_locator = page.locator('link[rel="canonical"]')
    canonical = (
        canonical_locator.get_attribute("href")
        if canonical_locator.count()
        else None
    )
    expected_canonical = f"https://ethicvoice.co/es/blogs/{slug}"
    assert canonical == expected_canonical, (
        f"Expected exact article canonical {expected_canonical!r}, got {canonical!r}"
    )
    open_graph_url = page.locator('meta[property="og:url"]').get_attribute("content")
    assert open_graph_url == expected_canonical, (
        f"Expected Open Graph URL {expected_canonical!r}, got {open_graph_url!r}"
    )
    hreflang = sorted(
        page.locator('link[rel="alternate"][hreflang]').evaluate_all(
            "els => els.map(el => [el.hreflang, el.href])"
        )
    )
    assert hreflang == sorted(
        [["es", expected_canonical], ["x-default", expected_canonical]]
    )
    json_ld = json.loads(
        page.locator('script[type="application/ld+json"]').last.text_content()
    )
    assert json_ld["url"] == expected_canonical
    result = {
        "status": response.status,
        "h1": h1,
        "canonical": canonical,
        "openGraphUrl": open_graph_url,
        "robots": page.locator('meta[name="robots"]').get_attribute("content"),
        "hreflang": hreflang,
        "jsonLdUrl": json_ld["url"],
    }
    context.close()
    return result


def assert_not_found_without_clerk(browser, slug):
    context = browser.new_context(
        extra_http_headers={"x-forwarded-host": "ethicvoice.co"},
        user_agent=GOOGLEBOT_USER_AGENT,
    )
    page = context.new_page()
    clerk_requests = []
    page.on(
        "request",
        lambda request: clerk_requests.append(request.url)
        if (
            "/v1/client/handshake" in request.url.lower()
            or "clerk.browser.js" in request.url.lower()
        )
        else None,
    )
    response = page.goto(f"{BASE_URL}/{slug}", wait_until="networkidle")
    robots = page.locator('meta[name="robots"]').evaluate_all(
        "els => els.map(el => el.content)"
    )
    assert response is not None and response.status == 404, (
        f"Expected HTTP 404 for {slug}, got "
        f"{response.status if response else None}; title={page.title()!r}; "
        f"robots={robots!r}"
    )
    assert not clerk_requests, f"Observed Clerk requests on 404: {clerk_requests}"
    context.close()


def assert_bad_gateway_without_clerk(browser, slug):
    context = browser.new_context(
        extra_http_headers={"x-forwarded-host": "ethicvoice.co"}
    )
    page = context.new_page()
    clerk_requests = []
    page.on(
        "request",
        lambda request: clerk_requests.append(request.url)
        if (
            "/v1/client/handshake" in request.url.lower()
            or "clerk.browser.js" in request.url.lower()
        )
        else None,
    )
    response = page.goto(f"{BASE_URL}/{slug}", wait_until="networkidle")
    assert response is not None and response.status == 502
    assert page.locator("body").inner_text().strip() == "Bad Gateway"
    assert not clerk_requests, f"Observed Clerk requests on 502: {clerk_requests}"
    context.close()


def assert_seo_routes(browser):
    context = browser.new_context(
        extra_http_headers={"x-forwarded-host": "ethicvoice.co"}
    )
    index_response = context.request.get("http://localhost:3000/sitemap.xml")
    assert index_response.status == 200
    index_xml = index_response.text()
    expected_children = [
        "https://ethicvoice.co/sitemap-main.xml",
        "https://ethicvoice.co/sitemap-blog.xml",
        "https://ethicvoice.co/sitemap-semsei-blog.xml",
    ]
    for child in expected_children:
        assert index_xml.count(f"<loc>{child}</loc>") == 1

    sitemap_response = context.request.get(
        "http://localhost:3000/sitemap-semsei-blog.xml"
    )
    assert sitemap_response.status == 200
    assert "application/xml" in sitemap_response.headers["content-type"]
    sitemap_xml = sitemap_response.text()
    canonical = "https://ethicvoice.co/es/blogs/mundial-2026-tu-guia-de-compliance"
    english = "https://ethicvoice.co/en/blogs/world-cup-2026-compliance-guide"
    assert sitemap_xml.count(f"<loc>{canonical}</loc>") == 1
    assert sitemap_xml.count(f"<loc>{english}</loc>") == 1
    assert "draft-article" not in sitemap_xml
    assert "blog.ethicvoice.co" not in sitemap_xml

    robots_response = context.request.get("http://localhost:3000/robots.txt")
    assert robots_response.status == 200
    robots_text = robots_response.text()
    assert "Allow: /" in robots_text
    assert "Sitemap: https://ethicvoice.co/sitemap.xml" in robots_text, repr(
        robots_text
    )

    webhook_response = context.request.post(
        "http://localhost:3000/api/semsei/revalidate",
        headers={"authorization": "Bearer invalid-signature"},
        data={
            "action": "update",
            "pageId": "page_123",
            "locale": "es",
            "slug": BASE_SLUG,
            "previousSlug": BASE_SLUG,
            "updatedAt": "2026-07-23T12:34:56.000Z",
        },
    )
    assert webhook_response.status == 401
    assert webhook_response.text() == "Unauthorized"
    context.close()


def assert_forged_marker_fails_closed(browser, url):
    context = browser.new_context(
        extra_http_headers={"x-ethicvoice-public-blog": "forged-client-marker"}
    )
    page = context.new_page()
    clerk_requests = []

    page.on(
        "request",
        lambda request: clerk_requests.append(request.url)
        if (
            "/v1/client/handshake" in request.url.lower()
            or "clerk.browser.js" in request.url.lower()
        )
        else None,
    )
    page.goto(url, wait_until="networkidle")

    assert clerk_requests, (
        f"Forged marker unexpectedly skipped Clerk handling for {url}"
    )
    context.close()


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    assert_forged_marker_fails_closed(browser, "http://localhost:3000/pricing")
    assert_forged_marker_fails_closed(
        browser,
        "http://localhost:3000/app/organization/settings.json",
    )
    anonymous = inspect_page(browser)
    googlebot = inspect_page(
        browser,
        user_agent=GOOGLEBOT_USER_AGENT,
    )
    assert googlebot == anonymous
    cookie_context = inspect_page(
        browser,
        cookies=[
            {
                "name": "viewer-parity",
                "value": "cookie-context",
                "domain": "localhost",
                "path": "/",
            }
        ],
    )
    assert cookie_context == anonymous, (
        "Cookie-carrying viewer context differs from anonymous response"
    )
    inspect_page(
        browser,
        slug="archive/article.html",
        expected_h1="Fixture article: archive/article.html",
    )
    inspect_page(
        browser,
        slug="feeds/article.json",
        expected_h1="Fixture article: feeds/article.json",
    )
    assert_not_found_without_clerk(browser, "unknown-article")
    assert_not_found_without_clerk(browser, "draft-article")
    assert_bad_gateway_without_clerk(browser, "conflict-article")
    assert_bad_gateway_without_clerk(browser, "upstream-error")
    assert_seo_routes(browser)

    if AUTH_STATE:
        valid_clerk_context = inspect_page(
            browser,
            storage_state=str(Path(AUTH_STATE).resolve()),
        )
        assert valid_clerk_context == anonymous, (
            "Authenticated blog metadata/content differs from anonymous response:\n"
            + json.dumps(
                {
                    "anonymous": anonymous,
                    "validClerkStorageState": valid_clerk_context,
                },
                indent=2,
            )
        )

    browser.close()
    print(
        json.dumps(
            {
                "anonymous": anonymous,
                "cookieContext": cookie_context,
                "googlebot": googlebot,
                "validClerkStorageStateChecked": bool(AUTH_STATE),
            },
            indent=2,
        )
    )
