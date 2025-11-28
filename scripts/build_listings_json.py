#!/usr/bin/env python3
"""Convert listing_details_with_descriptions.csv into JSON for the API."""

from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = value.replace("&", "and")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = value.strip("-")
    return value or "listing"


def split_list(value: str | None, delimiter: str) -> list[str]:
    if not value:
        return []
    parts = [part.strip() for part in value.split(delimiter)]
    return [part for part in parts if part]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--csv-path",
        type=Path,
        default=Path("listing_details_with_descriptions.csv"),
        help="Source CSV file produced by join_listing_details.py",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/listings.json"),
        help="Primary JSON path used by the API layer.",
    )
    parser.add_argument(
        "--public-output",
        type=Path,
        default=Path("public/data/listings.json"),
        help="Optional second path for serving JSON directly to the frontend.",
    )
    args = parser.parse_args()

    with args.csv_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        listings: list[dict[str, object]] = []
        for row in reader:
            listing_id = (row.get("listing_id") or "").strip()
            name = (row.get("name") or "").strip()
            tags = split_list(row.get("tags"), ",")
            description = (row.get("description") or "").strip()

            entry = {
                "id": listing_id,
                "slug": slugify(name or listing_id or "listing"),
                "name": name,
                "url": (row.get("url") or "").strip(),
                "location": (row.get("location") or "").strip(),
                "address": (row.get("address") or "").strip(),
                "primaryCategory": tags[0] if tags else "",
                "tags": tags,
                "imageUrl": (row.get("image_url") or "").strip(),
                "description": description,
                "contacts": {
                    "phone": split_list(row.get("phone"), ";"),
                    "whatsapp": split_list(row.get("whatsapp"), ";"),
                    "email": split_list(row.get("email"), ";"),
                    "line": split_list(row.get("line"), ";"),
                    "website": split_list(row.get("website"), ";"),
                    "facebook": split_list(row.get("facebook"), ";"),
                    "instagram": split_list(row.get("instagram"), ";"),
                    "tiktok": split_list(row.get("tiktok"), ";"),
                    "youtube": split_list(row.get("youtube"), ";"),
                },
            }
            listings.append(entry)

    payload = json.dumps(listings, ensure_ascii=False, indent=2)

    for destination in {args.output, args.public_output}:
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(payload, encoding="utf-8")
        print(f"Wrote {len(listings)} listings to {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
