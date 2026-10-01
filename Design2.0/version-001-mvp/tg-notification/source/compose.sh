#!/usr/bin/env bash
set -euo pipefail

source_dir=$(cd "$(dirname "$0")" && pwd)
output_dir=$(cd "$source_dir/.." && pwd)
work_dir=$(mktemp -d)
trap 'rm -rf "$work_dir"' EXIT

render_flag() {
  local code=$1
  local geometry=$2
  convert -background none "$source_dir/flags/$code.svg" -resize "$geometry" "$work_dir/$code-$geometry.png"
}

place() {
  local canvas=$1
  local flag=$2
  local geometry=$3
  convert "$canvas" "$flag" -geometry "$geometry" -composite "$canvas"
}

# Variant 01 — the existing row grows by two visibly larger destinations.
convert "$source_dir/backgrounds/row.png" "$work_dir/01.png"
render_flag de 128x85
render_flag fr 128x85
render_flag nl 128x85
render_flag pl 202x126
render_flag gb 210x105
place "$work_dir/01.png" "$work_dir/de-128x85.png" +77+576
place "$work_dir/01.png" "$work_dir/fr-128x85.png" +273+576
place "$work_dir/01.png" "$work_dir/nl-128x85.png" +469+576
place "$work_dir/01.png" "$work_dir/pl-202x126.png" +686+531
place "$work_dir/01.png" "$work_dir/gb-210x105.png" +972+542
convert "$work_dir/01.png" -strip -quality 94 "$output_dir/tg-notification-01-row.png"

# Variant 02 — two new country cards lead, while the current countries stay grouped.
convert "$source_dir/backgrounds/cards.png" -background '#fbf7f2' -alpha remove -alpha off "$work_dir/02.png"
render_flag de 96x64
render_flag fr 96x64
render_flag nl 96x64
render_flag pl 350x219
render_flag gb 360x180
place "$work_dir/02.png" "$work_dir/de-96x64.png" +192+292
place "$work_dir/02.png" "$work_dir/fr-96x64.png" +371+292
place "$work_dir/02.png" "$work_dir/nl-96x64.png" +543+292
place "$work_dir/02.png" "$work_dir/gb-360x180.png" +725+500
place "$work_dir/02.png" "$work_dir/pl-350x219.png" +251+611
convert "$work_dir/02.png" -strip -quality 94 "$output_dir/tg-notification-02-cards.png"

# Variant 03 — the current network fans out toward the two new destinations.
convert "$source_dir/backgrounds/routes.png" -background '#fbf7f2' -alpha remove -alpha off "$work_dir/03.png"
render_flag de 96x64
render_flag fr 96x64
render_flag nl 96x64
render_flag pl 320x200
render_flag gb 340x170
place "$work_dir/03.png" "$work_dir/de-96x64.png" +178+304
place "$work_dir/03.png" "$work_dir/fr-96x64.png" +163+554
place "$work_dir/03.png" "$work_dir/nl-96x64.png" +181+799
place "$work_dir/03.png" "$work_dir/pl-320x200.png" +779+306
place "$work_dir/03.png" "$work_dir/gb-340x170.png" +770+697
convert "$work_dir/03.png" -strip -quality 94 "$output_dir/tg-notification-03-routes.png"

convert \
  \( "$output_dir/tg-notification-01-row.png" -resize 392x392 \) \
  \( "$output_dir/tg-notification-02-cards.png" -resize 392x392 \) \
  \( "$output_dir/tg-notification-03-routes.png" -resize 392x392 \) \
  +append -bordercolor '#fbf7f2' -border 12 \
  "$output_dir/preview-all.png"
