#!/usr/bin/env python3
"""Build a metadata-only, clean-room audit of mayaknetworks.com.

The script intentionally does not persist page bodies, descriptions, headings,
styles, scripts, or media from the audited site.
"""

from __future__ import annotations

import concurrent.futures
import datetime as dt
import html
import json
import pathlib
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser


ORIGIN = "https://mayaknetworks.com"
SITEMAP_URL = f"{ORIGIN}/sitemap.xml"
ROOT = pathlib.Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
USER_AGENT = "Knopka clean-room SEO audit/1.0 (+https://knopka.onlinedesk.online/)"
MAX_WORKERS = 8
TIMEOUT_SECONDS = 15


class PageFactsParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.in_title = False
        self.in_script = False
        self.in_style = False
        self.in_main = False
        self.main_text_parts: list[str] = []
        self.meta: list[dict[str, str]] = []
        self.links: list[str] = []
        self.images = 0
        self.images_without_alt = 0
        self.heading_counts = {"h1": 0, "h2": 0, "h3": 0}
        self.canonical: list[str] = []
        self.jsonld_types: list[str] = []
        self._jsonld = False
        self._jsonld_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {key: value or "" for key, value in attrs}
        if tag == "title":
            self.in_title = True
        elif tag == "script":
            self.in_script = True
            if data.get("type", "").lower() == "application/ld+json":
                self._jsonld = True
                self._jsonld_parts = []
        elif tag == "style":
            self.in_style = True
        elif tag == "main":
            self.in_main = True
        elif tag == "meta":
            self.meta.append(data)
        elif tag == "a" and data.get("href"):
            self.links.append(data["href"])
        elif tag == "img":
            self.images += 1
            if not data.get("alt", "").strip():
                self.images_without_alt += 1
        elif tag in self.heading_counts:
            self.heading_counts[tag] += 1
        elif tag == "link" and "canonical" in data.get("rel", "").lower():
            if data.get("href"):
                self.canonical.append(data["href"])

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False
        elif tag == "script":
            if self._jsonld:
                try:
                    payload = json.loads("".join(self._jsonld_parts))
                    self.jsonld_types.extend(extract_jsonld_types(payload))
                except (TypeError, ValueError, json.JSONDecodeError):
                    pass
            self._jsonld = False
            self._jsonld_parts = []
            self.in_script = False
        elif tag == "style":
            self.in_style = False
        elif tag == "main":
            self.in_main = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)
        if self._jsonld:
            self._jsonld_parts.append(data)
        if self.in_main and not self.in_script and not self.in_style:
            self.main_text_parts.append(data)


def extract_jsonld_types(value: object) -> list[str]:
    found: list[str] = []
    if isinstance(value, dict):
        raw_type = value.get("@type")
        if isinstance(raw_type, str):
            found.append(raw_type)
        elif isinstance(raw_type, list):
            found.extend(item for item in raw_type if isinstance(item, str))
        for nested in value.values():
            found.extend(extract_jsonld_types(nested))
    elif isinstance(value, list):
        for nested in value:
            found.extend(extract_jsonld_types(nested))
    return found


def request(url: str) -> tuple[int, str, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as response:
        body = response.read()
        content_type = response.headers.get("Content-Type", "")
        return response.status, content_type, body


def parse_sitemap() -> list[dict[str, str]]:
    _, _, body = request(SITEMAP_URL)
    root = ET.fromstring(body)
    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    rows: list[dict[str, str]] = []
    for node in root.findall("sm:url", namespace):
        location = node.findtext("sm:loc", default="", namespaces=namespace).strip()
        lastmod = node.findtext("sm:lastmod", default="", namespaces=namespace).strip()
        if location.startswith(ORIGIN):
            rows.append({"url": location, "lastmod": lastmod})
    return rows


def category_for(path: str) -> str:
    if path in ("", "/"):
        return "root"
    if path.startswith("/blog/"):
        return "blog"
    if path.startswith("/en/blog/"):
        return "en-blog"
    if path.startswith("/en/"):
        return "en"
    if path.startswith("/tools/"):
        return "tools"
    return "pages"


def normalize_title(parts: list[str]) -> str:
    title = html.unescape(" ".join("".join(parts).split()))
    return title[:240]


def analyze(entry: dict[str, str]) -> dict[str, object]:
    url = entry["url"]
    path = urllib.parse.urlsplit(url).path or "/"
    base: dict[str, object] = {
        "url": url,
        "path": path,
        "lastmod": entry.get("lastmod", ""),
        "category": category_for(path),
    }
    try:
        status, content_type, body = request(url)
        base.update({
            "status": status,
            "content_type": content_type.split(";", 1)[0].strip().lower(),
            "bytes": len(body),
        })
        if "text/html" not in content_type.lower():
            return base
        text = body.decode("utf-8", errors="replace")
        parser = PageFactsParser()
        parser.feed(text)
        metadata = {
            (item.get("name") or item.get("property") or "").lower(): item.get("content", "")
            for item in parser.meta
        }
        internal_paths: set[str] = set()
        external_hosts: set[str] = set()
        for href in parser.links:
            absolute = urllib.parse.urljoin(url, href)
            parsed = urllib.parse.urlsplit(absolute)
            if parsed.scheme not in ("http", "https"):
                continue
            if parsed.netloc == urllib.parse.urlsplit(ORIGIN).netloc:
                internal_paths.add(parsed.path or "/")
            else:
                external_hosts.add(parsed.netloc)
        words = re.findall(r"[0-9A-Za-zА-Яа-яЁё]+", " ".join(parser.main_text_parts))
        canonical = parser.canonical[0] if parser.canonical else ""
        base.update({
            "title": normalize_title(parser.title_parts),
            "title_length": len(normalize_title(parser.title_parts)),
            "description_length": len(metadata.get("description", "").strip()),
            "canonical_present": bool(canonical),
            "canonical_self": canonical.rstrip("/") == url.rstrip("/") if canonical else False,
            "h1_count": parser.heading_counts["h1"],
            "h2_count": parser.heading_counts["h2"],
            "h3_count": parser.heading_counts["h3"],
            "main_word_count": len(words),
            "internal_link_targets": len(internal_paths),
            "external_hosts": len(external_hosts),
            "images": parser.images,
            "images_without_alt": parser.images_without_alt,
            "jsonld_types": sorted(set(parser.jsonld_types)),
            "og_present": bool(metadata.get("og:title") and metadata.get("og:image")),
        })
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as exc:
        base.update({"status": 0, "error": type(exc).__name__})
    return base


def summary_for(pages: list[dict[str, object]]) -> dict[str, object]:
    html_pages = [page for page in pages if page.get("content_type") == "text/html"]
    ok_pages = [page for page in html_pages if page.get("status") == 200]
    categories: dict[str, int] = {}
    schema_types: dict[str, int] = {}
    for page in pages:
        category = str(page.get("category", "unknown"))
        categories[category] = categories.get(category, 0) + 1
        for schema_type in page.get("jsonld_types", []):
            schema_types[str(schema_type)] = schema_types.get(str(schema_type), 0) + 1
    return {
        "sitemap_url": SITEMAP_URL,
        "generated_at": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
        "urls": len(pages),
        "html_pages": len(html_pages),
        "ok_html_pages": len(ok_pages),
        "blog_pages": categories.get("blog", 0),
        "categories": dict(sorted(categories.items())),
        "schema_types": dict(sorted(schema_types.items())),
        "canonical_present": sum(bool(page.get("canonical_present")) for page in html_pages),
        "self_canonical": sum(bool(page.get("canonical_self")) for page in html_pages),
        "og_present": sum(bool(page.get("og_present")) for page in html_pages),
        "single_h1": sum(page.get("h1_count") == 1 for page in html_pages),
    }


def write_outputs(pages: list[dict[str, object]]) -> None:
    pages.sort(key=lambda page: str(page.get("path", "")))
    payload = {"summary": summary_for(pages), "pages": pages}
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    (DATA_DIR / "site-map.json").write_text(serialized, encoding="utf-8")
    (DATA_DIR / "site-map.js").write_text(
        "window.MAYAK_AUDIT = " + serialized.rstrip() + ";\n",
        encoding="utf-8",
    )
    summary = payload["summary"]
    lines = [
        "# Mayak Networks audit summary",
        "",
        f"Generated: `{summary['generated_at']}`",
        "",
        f"- Sitemap URLs: **{summary['urls']}**",
        f"- HTML pages with HTTP 200: **{summary['ok_html_pages']}**",
        f"- Russian blog URLs: **{summary['blog_pages']}**",
        f"- Pages with canonical: **{summary['canonical_present']}**",
        f"- Pages with one H1: **{summary['single_h1']}**",
        f"- Pages with OG title and image: **{summary['og_present']}**",
        "",
        "This report contains metadata only. Page bodies and third-party assets are not stored.",
        "",
    ]
    (DATA_DIR / "summary.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    entries = parse_sitemap()
    if not entries:
        print("No sitemap URLs found", file=sys.stderr)
        return 1
    print(f"Auditing {len(entries)} URLs from {SITEMAP_URL}", file=sys.stderr)
    pages: list[dict[str, object]] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(analyze, entry) for entry in entries]
        for index, future in enumerate(concurrent.futures.as_completed(futures), start=1):
            pages.append(future.result())
            if index % 25 == 0 or index == len(futures):
                print(f"  {index}/{len(futures)}", file=sys.stderr)
    write_outputs(pages)
    print(f"Wrote {DATA_DIR / 'site-map.json'}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
