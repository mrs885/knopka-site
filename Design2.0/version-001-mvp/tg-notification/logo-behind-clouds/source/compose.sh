#!/usr/bin/env bash
set -euo pipefail

source_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
output_dir=$(cd "$source_dir/.." && pwd)
selected_base="$output_dir/../sun-after-cloud/tg-notification-sun-cloud-02.png"

verify_sha256() {
  local expected=$1
  local file=$2
  local actual
  actual=$(sha256sum "$file" | awk '{print $1}')
  [[ "$actual" == "$expected" ]] || {
    echo "Checksum mismatch: $file" >&2
    exit 1
  }
}

verify_sha256 9abb097b144e46fd7af2a9d34060e043a5c02f3bc50959151a5a00fb4f0a10d0 "$selected_base"
verify_sha256 0bf188a5085c32c546f42e2c445bffac80d95ac3fe949859ba5ebc3cfcd086be "$source_dir/app-button-black-a.png"
verify_sha256 bea29aff15283658abde8851ec39457092b6e09c3299d00917d8bef8beb277fb "$source_dir/cloud-plate-01-original.png"
verify_sha256 0459be3e87ae23fbdb0226558f9c4c9dcb214264e052c27f76e49d7ad73c5e90 "$source_dir/cloud-plate-02-original.png"
verify_sha256 5ac10a8c500d46584fbf46fb7f61bb95c49e752dc9709cd1ff2b861d40e1af62 "$source_dir/cloud-plate-03-original.png"

mkdir -p "$output_dir/thumbs"
rm -f "$output_dir"/tg-notification-logo-clouds-0{1,2,3}.png \
  "$output_dir/comparison.png" "$output_dir/thumbs"/variant-0{1,2,3}.png

work_dir=$(mktemp -d)
trap 'rm -rf "$work_dir"' EXIT

render_variant() {
  local n=$1
  local size=$2
  local x=$3
  local y=$4
  local cover_y=$5
  local cover_x0=$6
  local cover_x1=$7
  local glow_x=$((x - 90))
  local glow_y=$((y - 90))
  local glow_size=$((size + 180))
  local glow_center=$((glow_size / 2))
  local plate="$source_dir/cloud-plate-$n-original.png"
  local logo="$work_dir/logo-$n.png"
  local glow="$work_dir/glow-$n.png"
  local mask="$work_dir/foreground-mask-$n.png"
  local foreground="$work_dir/foreground-$n.png"
  local composite="$work_dir/composite-$n.png"

  convert "$source_dir/app-button-black-a.png" -resize "${size}x${size}!" "$logo"
  convert -size "${glow_size}x${glow_size}" xc:none \
    -fill 'rgba(101,255,88,0.78)' \
    -draw "circle $glow_center,$glow_center $glow_center,90" \
    -blur 0x48 "$glow"

  convert "$plate" "$glow" -geometry "+$glow_x+$glow_y" -compose Over -composite \
    "$logo" -geometry "+$x+$y" -compose Over -composite "$composite"

  convert -size 1254x1254 xc:black -fill white \
    -draw "rectangle $cover_x0,$cover_y $cover_x1,1254" -blur 0x10 "$mask"
  convert "$plate" "$mask" -alpha off -compose CopyOpacity -composite "$foreground"
  convert "$composite" "$foreground" -compose Over -composite \
    -resize 1080x1080! -strip -colorspace sRGB \
    "$output_dir/tg-notification-logo-clouds-$n.png"
  convert "$output_dir/tg-notification-logo-clouds-$n.png" \
    -resize 320x320! -strip "$output_dir/thumbs/variant-$n.png"
}

render_variant 01 500 377 230 545 330 925
render_variant 02 500 377 220 540 330 925
render_variant 03 455 555 260 550 515 1045

for n in 01 02 03; do
  convert "$output_dir/tg-notification-logo-clouds-$n.png" \
    -resize 360x360! -background '#f7f3ef' -gravity south -splice 0x52 \
    -fill '#242424' -pointsize 28 -annotate +0+12 "Variant ${n#0}" \
    "$work_dir/compare-$n.png"
done
montage "$work_dir/compare-01.png" "$work_dir/compare-02.png" "$work_dir/compare-03.png" \
  -tile 3x1 -geometry +16+16 -background '#f7f3ef' "$output_dir/comparison.png"

for image in "$output_dir"/tg-notification-logo-clouds-0{1,2,3}.png; do
  dimensions=$(identify -format '%wx%h' "$image")
  colorspace=$(identify -format '%[colorspace]' "$image")
  [[ "$dimensions" == 1080x1080 && "$colorspace" == sRGB ]] || {
    echo "Invalid output: $image ($dimensions, $colorspace)" >&2
    exit 1
  }
done

echo "Rendered three exact-logo variants, thumbnails and comparison sheet."
