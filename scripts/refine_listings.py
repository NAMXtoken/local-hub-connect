#!/usr/bin/env python3
"""Extract listing summaries from listings.txt into refined.txt."""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Iterable


START_RE = re.compile(r"^\d+\s*-\s*\".+\",\"$")


def parse_sections(lines: Iterable[str]) -> list[str]:
    sections: list[str] = []
    buffer: list[str] | None = None
    skipping = False

    for raw_line in lines:
        line = raw_line.rstrip("\n")

        if START_RE.match(line):
            if buffer:
                sections.append("\n".join(buffer).rstrip())
            buffer = None
            skipping = '"Events","' in line
            if skipping:
                continue
            buffer = [line]
            continue

        if skipping:
            if line.startswith("Prices "):
                skipping = False
            continue

        if buffer is None:
            continue

        if line.startswith("Prices "):
            sections.append("\n".join(buffer).rstrip())
            buffer = None
            continue

        buffer.append(line)

    if buffer:
        sections.append("\n".join(buffer).rstrip())

    return sections


def main() -> int:
    parser = argparse.ArgumentParser(description="Refine listing exports.")
    parser.add_argument(
        "input_path",
        type=Path,
        nargs="?",
        default=Path("listings.txt"),
        help="Path to the raw listings text file.",
    )
    parser.add_argument(
        "output_path",
        type=Path,
        nargs="?",
        default=Path("refined.txt"),
        help="Where to write the refined listing summaries.",
    )
    args = parser.parse_args()

    text = args.input_path.read_text(encoding="utf-8")
    sections = parse_sections(text.splitlines())

    output = "\n\n".join(sections) + "\n"
    args.output_path.write_text(output, encoding="utf-8")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
