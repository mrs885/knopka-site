#!/usr/bin/env bash
set -euo pipefail

source_dir=$(cd "$(dirname "$0")" && pwd)

cd "$source_dir"
sha256sum --check base.sha256
(cd assets && sha256sum --check logo.sha256)
export PLAYWRIGHT_MODULE=${PLAYWRIGHT_MODULE:-/usr/lib/node_modules/openclaw/node_modules/playwright-core/index.js}
node render.mjs
