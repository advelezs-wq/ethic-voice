import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse


PORT = int(os.environ.get("MOCK_SEMSEI_PORT", "3101"))


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        request = urlparse(self.path)
        query = parse_qs(request.query)

        if request.path == "/api/public/code/page":
            locale = query.get("locale", ["es"])[0]
            slug = query.get("slug", [""])[0]
            if slug in {"unknown-article", "draft-article"}:
                self.respond({"error": "not_found"}, status=404)
                return
            if slug == "conflict-article":
                self.respond({"error": "configuration_mismatch"}, status=409)
                return
            if slug == "upstream-error":
                self.respond({"error": "upstream_error"}, status=503)
                return
            canonical = f"https://ethicvoice.co/{locale}/blogs/{slug}"
            title = (
                "Mundial 2026: Tu guia de compliance"
                if slug == "mundial-2026-tu-guia-de-compliance"
                else f"Fixture article: {slug}"
            )
            page = {
                "title": title,
                "seoTitle": f"{title} | EthicVoice",
                "metaDescription": "Deterministic Semsei fixture",
                "keywords": "compliance",
                "schemaJsonLd": {
                    "@context": "https://schema.org",
                    "@type": "Article",
                    "url": canonical,
                    "headline": title,
                },
                "slug": slug,
                "locale": locale,
                "createdAt": "2026-07-23T00:00:00.000Z",
                "updatedAt": "2026-07-23T00:00:00.000Z",
                "ogImageUrl": None,
                "contentLanguage": locale,
                "robots": {"index": True, "follow": True},
                "html": f"<article><h1>{title}</h1></article>",
            }
            response = {
                **page,
                "page": page,
                "canonicalUrl": canonical,
                "alternates": {locale: canonical, "x-default": canonical},
                "siteOrigin": "https://ethicvoice.co",
                "pathPrefix": "/blogs",
                "hreflang": [
                    {"locale": locale, "url": canonical},
                    {"locale": "x-default", "url": canonical},
                ],
            }
            self.respond(response)
            return

        if request.path == "/api/public/code/pages":
            self.respond(
                {
                    "host": "ethicvoice.co",
                    "siteOrigin": "https://ethicvoice.co",
                    "pathPrefix": "/blogs",
                    "entries": [
                        {
                            "url": "https://ethicvoice.co/es/blogs/mundial-2026-tu-guia-de-compliance",
                            "lastModified": "2026-07-23T00:00:00.000Z",
                            "locale": "es",
                            "slug": "mundial-2026-tu-guia-de-compliance",
                            "translationGroupId": "world-cup-guide",
                        },
                        {
                            "url": "https://ethicvoice.co/en/blogs/world-cup-2026-compliance-guide",
                            "lastModified": "2026-07-23T00:00:00.000Z",
                            "locale": "en",
                            "slug": "world-cup-2026-compliance-guide",
                            "translationGroupId": "world-cup-guide",
                        },
                        {
                            "url": "https://ethicvoice.co/es/blogs/draft-article",
                            "lastModified": "2026-07-23T00:00:00.000Z",
                            "locale": "es",
                            "slug": "draft-article",
                            "translationGroupId": None,
                            "noindex": True,
                        },
                    ],
                }
            )
            return

        self.respond({"error": "not_found"}, status=404)

    def respond(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, _format, *_args):
        return


ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
