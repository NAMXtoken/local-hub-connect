#!/usr/bin/env python3
"""Extract text from Samui Social listings, optionally in bulk."""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path
from typing import Iterable, Sequence

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
    """Remove XML namespaces so plain XPath expressions keep working."""
    for element in root.iter():
        if isinstance(element.tag, str) and element.tag.startswith("{"):
            element.tag = element.tag.split("}", 1)[1]
    etree.cleanup_namespaces(root)


def squash_text(node: etree._Element) -> str:
    """Collapse the visible text content of a node into readable lines."""
    chunks = []
    for chunk in node.itertext():
        chunk = chunk.strip()
        if chunk:
            chunks.append(chunk)
    return "\n".join(chunks)


def extract_text(url: str, xpath: str, timeout: float) -> list[str]:
    """Return a list of text blobs that match the supplied XPath."""
    response = requests.get(url, headers=DEFAULT_HEADERS, timeout=timeout)
    response.raise_for_status()

    document = html5parser.fromstring(response.content)
    strip_namespaces(document)
    etree.strip_elements(document, "script", "style", "noscript")
    matches = document.xpath(xpath)

    if not matches:
        raise ValueError(f"No nodes matched XPath: {xpath}")

    return [squash_text(node) for node in matches]


def fetch_listing_urls_from_sitemap(
    sitemap_url: str, base_url: str, timeout: float
) -> list[str]:
    """Return all listing URLs in the sitemap that match the base URL."""
    response = requests.get(sitemap_url, headers=DEFAULT_HEADERS, timeout=timeout)
    response.raise_for_status()

    try:
        document = etree.fromstring(response.content)
    except etree.XMLSyntaxError as exc:  # pragma: no cover - CLI convenience
        msg = f"Failed to parse sitemap at {sitemap_url}: {exc}"
        raise ValueError(msg) from exc

    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    base = base_url.rstrip("/")
    urls = []
    for loc in document.xpath("//sm:url/sm:loc/text()", namespaces=namespace):
        loc = (loc or "").strip()
        if not loc:
            continue
        if not loc.startswith(base):
            continue
        urls.append(loc)

    if not urls:
        raise ValueError(
            f"No listing URLs found in sitemap {sitemap_url} for base {base_url}."
        )

    return urls


def resolve_targets(args: argparse.Namespace) -> list[str]:
    """Build the set of listing URLs requested for extraction."""
    targets: list[str] = []
    if args.listings_file:
        text = args.listings_file.read_text(encoding="utf-8")
        for line in text.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if line.isdigit():
                line = args.base_url.rstrip("/") + "/" + line
            targets.append(line)
    elif args.from_sitemap:
        targets.extend(
            fetch_listing_urls_from_sitemap(
                args.sitemap_url, args.base_url, args.timeout
            )
        )
    elif args.start_id is not None and args.end_id is not None:
        if args.end_id < args.start_id:
            raise ValueError("--end-id must be >= --start-id")
        for listing_id in range(args.start_id, args.end_id + 1):
            targets.append(f"{args.base_url.rstrip('/')}/{listing_id}")
    else:
        targets.append(args.url)
    return targets


def write_csv(path: Path, rows: Sequence[tuple[str, int, str]]) -> None:
    """Persist extracted rows to CSV with listing URL metadata."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["listing_url", "match_index", "text"])
        for row in rows:
            writer.writerow(row)


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Grab text from Samui Social listings and optionally export CSV."
    )
    parser.add_argument(
        "--url",
        default="https://www.samuisocial.com/directory/listing/1725",
        help="Single listing URL to fetch (default behavior).",
    )
    parser.add_argument(
        "--base-url",
        default="https://www.samuisocial.com/directory/listing/",
        help="Base URL for building listing URLs when iterating over IDs.",
    )
    parser.add_argument(
        "--from-sitemap",
        action="store_true",
        help="Automatically fetch listing URLs from the sitemap (ignores --url).",
    )
    parser.add_argument(
        "--sitemap-url",
        default="https://www.samuisocial.com/sitemap.xml",
        help="Sitemap URL to inspect when using --from-sitemap.",
    )
    parser.add_argument(
        "--start-id",
        type=int,
        help="First listing ID in a range to fetch (requires --end-id).",
    )
    parser.add_argument(
        "--end-id",
        type=int,
        help="Last listing ID in a range to fetch (requires --start-id).",
    )
    parser.add_argument(
        "--listings-file",
        type=Path,
        help="Optional file with listing IDs or URLs (one per line).",
    )
    parser.add_argument(
        "--xpath",
        default="/html/body/div[2]/div/div[3]/div/div[2]/div[2]",
        help="XPath for the div you want.",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=30,
        help="How long to wait (seconds) before abandoning the request.",
    )
    parser.add_argument(
        "--csv-output",
        type=Path,
        help="Optional path to write the matches as CSV (listing_url,match_index,text).",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Skip printing matches to stdout (useful when only exporting CSV).",
    )
    args = parser.parse_args(argv)

    try:
        targets = resolve_targets(args)
    except Exception as exc:  # pragma: no cover - CLI convenience
        parser.exit(status=1, message=f"error: {exc}\n")

    csv_rows: list[tuple[str, int, str]] = []
    for url in targets:
        try:
            results = extract_text(url, args.xpath, args.timeout)
        except Exception as exc:  # pragma: no cover - CLI convenience
            print(f"[warn] Failed to process {url}: {exc}", file=sys.stderr)
            continue

        if args.csv_output:
            csv_rows.extend((url, index, text) for index, text in enumerate(results, 1))

        if not args.quiet:
            header = f"=== {url} ==="
            print(header)
            for index, text in enumerate(results, start=1):
                prefix = f"Match #{index}:" if len(results) > 1 else "Match:"
                print(prefix)
                print(text)
                if index < len(results):
                    print("-" * 40)

    if args.csv_output and csv_rows:
        write_csv(args.csv_output, csv_rows)

    if args.csv_output and not csv_rows:
        print("No matches collected; CSV file skipped.", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
