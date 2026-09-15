#!/usr/bin/env python3
"""Add the GA4 tag to the dev build, without touching production pages."""

import sys
from pathlib import Path

from build_og_images import published_pages

MEASUREMENT_ID = "G-F5044SW1GJ"
MARKER = f"googletagmanager.com/gtag/js?id={MEASUREMENT_ID}"
TAG = f'''<script async src="https://www.googletagmanager.com/gtag/js?id={MEASUREMENT_ID}"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){{dataLayer.push(arguments);}}
gtag('js', new Date());
gtag('config', '{MEASUREMENT_ID}', {{debug_mode: true}});
</script>
'''


def apply(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="replace")
    if MARKER in text:
        return "same"
    if "</head>" not in text:
        return "no-head"
    path.write_text(text.replace("</head>", TAG + "</head>", 1), encoding="utf-8")
    return "wrote"


def main() -> int:
    counts = {}
    seen = set()
    for pages in published_pages().values():
        for path in pages:
            if path in seen:
                continue
            seen.add(path)
            result = apply(path)
            counts[result] = counts.get(result, 0) + 1
    print(", ".join(f"{value} {key}" for key, value in sorted(counts.items())))
    return 0


if __name__ == "__main__":
    sys.exit(main())
