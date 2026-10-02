#!/usr/bin/env bash
set -euo pipefail

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
source_image="$script_dir/source/app-button-original.png"
output_image="$script_dir/app-button-black-a.png"
expected_sha256="96b9b8f1739c26d79b8da9a246d6e59b495455f2ad0d29f3ad53787005d92d34"

actual_sha256=$(sha256sum "$source_image" | awk '{print $1}')
if [[ "$actual_sha256" != "$expected_sha256" ]]; then
  echo "Source checksum mismatch: $actual_sha256" >&2
  exit 1
fi

mask_file=$(mktemp /tmp/knopka-app-button-mask.XXXXXX.png)
trap 'shred -u "$mask_file"' EXIT

# Source button center: (512, 520). The 640 px crop puts it at (320, 320).
# A 4x supersampled ellipse follows the outer black edge while excluding the
# surrounding green glow. Downsampling provides a clean antialiased alpha edge.
convert -size 2560x2560 xc:black \
  -fill white \
  -draw "ellipse 1280,1280 1200,1216 0,360" \
  -resize 640x640 \
  -colorspace Gray \
  "$mask_file"

convert "$source_image" \
  -crop 640x640+192+200 +repage \
  "$mask_file" \
  -alpha off \
  -compose CopyOpacity \
  -composite \
  -strip \
  -define png:color-type=6 \
  "$output_image"

identify "$output_image" | grep -q '640x640'
identify -format '%[channels]' "$output_image" | grep -qi 'a'
