#!/usr/bin/env python3
"""Export listing metadata from Samui Social directory pages."""

from __future__ import annotations

import argparse
import csv
import sys
from collections import defaultdict
from pathlib import Path
from typing import Iterable

import requests
from lxml import etree
from lxml.html import html5parser

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}


def strip_namespaces(root: etree._Element) -> None:
    for element in root.iter():
        if isinstance(element.tag, str) and element.tag.startswith("{"):
            element.tag = element.tag.split("}", 1)[1]
    etree.cleanup_namespaces(root)


def fetch_listing_urls(sitemap_url: str, base_url: str, timeout: float) -> list[str]:
    response = requests.get(sitemap_url, headers=DEFAULT_HEADERS, timeout=timeout)
    response.raise_for_status()
    try:
        document = etree.fromstring(response.content)
    except etree.XMLSyntaxError as exc:  # pragma: no cover
        raise ValueError(f"Failed to parse sitemap {sitemap_url}: {exc}") from exc

    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    base = base_url.rstrip("/")
    urls = []
    for loc in document.xpath("//sm:url/sm:loc/text()", namespaces=ns):
        loc = (loc or "").strip()
        if loc.startswith(base):
            urls.append(loc)

    if not urls:
        raise ValueError(f"No listing URLs found in sitemap {sitemap_url} using base {base}.")
    return urls


def classify_contact(href: str) -> tuple[str, str] | None:
    href = href.strip()
    if not href or href.startswith("/login"):
        return None
    lower = href.lower()
    if lower.startswith("tel:"):
        return ("phone", href.split(":", 1)[1])
    if lower.startswith("mailto:"):
        return ("email", href.split(":", 1)[1])
    if "wa.me" in lower or "whatsapp" in lower:
        return ("whatsapp", href)
    if "line.me" in lower or "line://" in lower:
        return ("line", href)
    if "facebook.com" in lower:
        return ("facebook", href)
    if "instagram.com" in lower:
        return ("instagram", href)
    if "tiktok.com" in lower:
        return ("tiktok", href)
    if "youtube.com" in lower or "youtu.be" in lower:
        return ("youtube", href)
    if lower.startswith("http://") or lower.startswith("https://"):
        return ("website", href)
    return None


def extract_listing(url: str, timeout: float) -> dict[str, str]:
    response = requests.get(url, headers=DEFAULT_HEADERS, timeout=timeout)
    response.raise_for_status()

    document = html5parser.fromstring(response.content)
    strip_namespaces(document)
    container = document.xpath("//div[contains(@class,'profile-left')]")
    if not container:
        raise ValueError("profile-left container missing")
    node = container[0]

    listing_id = url.rstrip("/").split("/")[-1]
    image = node.xpath(".//img[contains(@class,'listingLogo')]/@src")
    name = node.xpath(".//h2/text()")
    location = node.xpath(".//p[contains(@class,'bold')][1]/text()")
    tags = node.xpath(".//div[contains(@class,'tag-preview-text')]/text()")

    address = ""
    address_heading = node.xpath(".//h3[normalize-space()='Address']")
    if address_heading:
        paragraph = address_heading[0].getnext()
        if paragraph is not None and paragraph.tag.lower() == "p":
            address = " ".join(paragraph.itertext()).strip()

    contacts: dict[str, set[str]] = defaultdict(set)
    for href in node.xpath(".//a[@href]/@href"):
        classified = classify_contact(href)
        if classified is None:
            continue
        key, value = classified
        contacts[key].add(value)

    def join_set(key: str) -> str:
        values = sorted(contacts.get(key, []))
        return ";".join(values)

    return {
        "listing_id": listing_id,
        "url": url,
        "name": name[0].strip() if name else "",
        "location": location[0].strip() if location else "",
        "tags": tags[0].strip() if tags else "",
        "address": address,
        "image_url": image[0].strip() if image else "",
        "phone": join_set("phone"),
        "whatsapp": join_set("whatsapp"),
        "email": join_set("email"),
        "line": join_set("line"),
        "website": join_set("website"),
        "facebook": join_set("facebook"),
        "instagram": join_set("instagram"),
        "tiktok": join_set("tiktok"),
        "youtube": join_set("youtube"),
    }


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    if not rows:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "listing_id",
        "url",
        "name",
        "location",
        "tags",
        "address",
        "image_url",
        "phone",
        "whatsapp",
        "email",
        "line",
        "website",
        "facebook",
        "instagram",
        "tiktok",
        "youtube",
    ]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Export listing metadata to CSV.")
    parser.add_argument(
        "--sitemap-url",
        default="https://www.samuisocial.com/sitemap.xml",
        help="Sitemap to scan for listing URLs.",
    )
    parser.add_argument(
        "--base-url",
        default="https://www.samuisocial.com/directory/listing/",
        help="Base prefix that identifies listing URLs inside the sitemap.",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=30,
        help="Request timeout in seconds.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Optional max number of listings to export (useful for testing).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("listing_details.csv"),
        help="Where to write the CSV output.",
    )
    args = parser.parse_args(argv)

    try:
        urls = fetch_listing_urls(args.sitemap_url, args.base_url, args.timeout)
    except Exception as exc:  # pragma: no cover
        parser.exit(status=1, message=f"error: {exc}\n")

    if args.limit is not None:
        urls = urls[: args.limit]

    rows: list[dict[str, str]] = []
    for index, url in enumerate(urls, start=1):
        try:
            rows.append(extract_listing(url, args.timeout))
        except Exception as exc:  # pragma: no cover
            print(f"[warn] Failed to process {url}: {exc}", file=sys.stderr)
        else:
            print(f"[{index}/{len(urls)}] Collected {url}")

    if not rows:
        print("No listings collected.", file=sys.stderr)
        return 1

    write_csv(args.output, rows)
    print(f"Wrote {len(rows)} listings to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
