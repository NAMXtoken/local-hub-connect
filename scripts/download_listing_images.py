#!/usr/bin/env python3
"""Download listing images locally for faster serving."""

from __future__ import annotations

import argparse
import csv
import json
import mimetypes
import re
import sys
from pathlib import Path
from typing import Iterable
from urllib.parse import urlparse

import requests

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}


def read_rows(csv_path: Path) -> Iterable[dict[str, str]]:
    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        yield from reader


def sanitize_filename(name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]", "", name)


def determine_extension(url: str, content_type: str | None) -> str:
    parsed = urlparse(url)
    path = Path(parsed.path)
    ext = path.suffix
    if ext:
        return ext
    if content_type:
        guessed = mimetypes.guess_extension(content_type.split(";", 1)[0])
        if guessed:
            return guessed
    return ".jpg"


def download_image(url: str, destination: Path, timeout: float) -> Path | None:
    try:
        response = requests.get(url, headers=DEFAULT_HEADERS, timeout=timeout, stream=True)
    except Exception as exc:  # pragma: no cover - network
        print(f"[warn] Failed to fetch {url}: {exc}", file=sys.stderr)
        return None

    if response.status_code >= 400:
        print(f"[warn] Got HTTP {response.status_code} for {url}", file=sys.stderr)
        return None

    content_type = response.headers.get("Content-Type")
    ext = determine_extension(url, content_type)
    final_path = destination.with_suffix(ext)
    final_path.parent.mkdir(parents=True, exist_ok=True)

    with final_path.open("wb") as handle:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                handle.write(chunk)

    return final_path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--csv-path",
        type=Path,
        default=Path("listing_details_with_descriptions.csv"),
        help="CSV file that includes image_url columns.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("public/listing-images"),
        help="Where to store downloaded images (relative paths used on the site).",
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("public/listing-images/manifest.json"),
        help="JSON file storing listing_id to relative path mapping.",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=30.0,
        help="Request timeout in seconds.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Optionally stop after downloading this many records (for testing).",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Redownload images even if a local file already exists.",
    )
    args = parser.parse_args()

    manifest: dict[str, str] = {}
    if args.manifest.exists():
        manifest = json.loads(args.manifest.read_text(encoding="utf-8"))

    processed = 0
    for row in read_rows(args.csv_path):
        listing_id = (row.get("listing_id") or "").strip()
        image_url = (row.get("image_url") or "").strip()
        if not listing_id or not image_url:
            continue

        safe_name = sanitize_filename(listing_id) or "listing"
        target_base = args.output_dir / safe_name

        if not args.force and listing_id in manifest and (args.output_dir.parent / manifest[listing_id]).exists():
            processed += 1
            if args.limit and processed >= args.limit:
                break
            continue

        final_path = download_image(image_url, target_base, args.timeout)
        if final_path:
            relative = final_path.relative_to(args.output_dir.parent)
            manifest[listing_id] = relative.as_posix()
        processed += 1

        if args.limit and processed >= args.limit:
            break

    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    args.manifest.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote manifest with {len(manifest)} entries to {args.manifest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
