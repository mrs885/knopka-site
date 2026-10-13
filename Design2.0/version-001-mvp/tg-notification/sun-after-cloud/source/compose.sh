#!/usr/bin/env bash
set -euo pipefail

source_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
output_dir=$(cd "$source_dir/.." && pwd)
approved_base="$output_dir/../tg-notification-info.png"

verify_sha256() {
  local expected=$1
  local file=$2
  local actual
  actual=$(sha256sum "$file" | awk '{print $1}')
  if [[ "$actual" != "$expected" ]]; then
    echo "Checksum mismatch: $file" >&2
    exit 1
  fi
}

verify_sha256 f38e4a26cb1a5107c0aa7a3fff13944584283ab32fb385ed80b185ad479c2cbb "$approved_base"
verify_sha256 594bd3607f512021d61834d245ed969f1412e4a98bfb90d70f7083a683495a96 "$source_dir/generated-01-original.png"
verify_sha256 0fc788094c0f9e47e00e67a03890e37590c13a085868724f39982578cd6a9b6a "$source_dir/generated-02-original.png"
verify_sha256 f273efd09a878f09301d88902d9facf7a799f2cb01b07688a65b74618d808d3b "$source_dir/generated-03-original.png"

mkdir -p "$output_dir/thumbs"
rm -f \
  "$output_dir/tg-notification-sun-cloud-01.png" \
  "$output_dir/tg-notification-sun-cloud-02.png" \
  "$output_dir/tg-notification-sun-cloud-03.png" \
  "$output_dir/comparison.png" \
  "$output_dir/thumbs/variant-01.png" \
  "$output_dir/thumbs/variant-02.png" \
  "$output_dir/thumbs/variant-03.png"

for n in 01 02 03; do
  convert "$source_dir/generated-$n-original.png" \
    -resize 1080x1080! -strip -colorspace sRGB \
    "$output_dir/tg-notification-sun-cloud-$n.png"
  convert "$output_dir/tg-notification-sun-cloud-$n.png" \
    -resize 320x320! -strip \
    "$output_dir/thumbs/variant-$n.png"
done

tmp_compare=$(mktemp -d)
trap 'rm -rf "$tmp_compare"' EXIT
for n in 01 02 03; do
  convert "$output_dir/tg-notification-sun-cloud-$n.png" \
    -resize 360x360! \
    -background '#f7f3ef' -gravity south -splice 0x52 \
    -fill '#242424' -pointsize 28 -annotate +0+12 "Variant ${n#0}" \
    "$tmp_compare/$n.png"
done
montage "$tmp_compare/01.png" "$tmp_compare/02.png" "$tmp_compare/03.png" \
  -tile 3x1 -geometry +16+16 -background '#f7f3ef' \
  "$output_dir/comparison.png"

for image in "$output_dir"/tg-notification-sun-cloud-0{1,2,3}.png; do
  dimensions=$(identify -format '%wx%h' "$image")
  colorspace=$(identify -format '%[colorspace]' "$image")
  [[ "$dimensions" == "1080x1080" && "$colorspace" == "sRGB" ]] || {
    echo "Invalid output: $image ($dimensions, $colorspace)" >&2
    exit 1
  }
done

echo "Rendered three 1080x1080 variants, thumbnails and comparison sheet."
