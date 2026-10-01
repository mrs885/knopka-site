#!/usr/bin/env bash
set -euo pipefail

source_dir=$(cd "$(dirname "$0")" && pwd)
output_dir=$(cd "$source_dir/.." && pwd)

export PLAYWRIGHT_MODULE=${PLAYWRIGHT_MODULE:-/usr/lib/node_modules/openclaw/node_modules/playwright-core/index.js}
node "$source_dir/render-row-variants.mjs"

convert \
  \( "$output_dir/tg-notification-01-row-a.png" -resize 238x298 \) \
  \( "$output_dir/tg-notification-01-row-b.png" -resize 238x298 \) \
  \( "$output_dir/tg-notification-01-row-c.png" -resize 238x298 \) \
  \( "$output_dir/tg-notification-01-row-d.png" -resize 238x298 \) \
  \( "$output_dir/tg-notification-01-row-e.png" -resize 238x298 \) \
  +append -bordercolor '#fbf7f2' -border 12 \
  "$output_dir/preview-row-variants.png"
