#!/usr/bin/env bash
set -euo pipefail

source_dir=$(cd "$(dirname "$0")" && pwd)
output_dir=$(cd "$source_dir/.." && pwd)

export PLAYWRIGHT_MODULE=${PLAYWRIGHT_MODULE:-/usr/lib/node_modules/openclaw/node_modules/playwright-core/index.js}
node "$source_dir/render-row.mjs"
