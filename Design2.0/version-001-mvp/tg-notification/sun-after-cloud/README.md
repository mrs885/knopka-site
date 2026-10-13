# Sun after cloud — Telegram notification variants

Three square notification concepts derived from the approved
`../tg-notification-info.png` background. The background, translucent ribbons,
canvas and margins are preserved; only the central black information button is
replaced by a sun emerging from a cloud.

## Deliverables

- `tg-notification-sun-cloud-01.png` — friendly rounded weather icon;
- `tg-notification-sun-cloud-02.png` — radiant sunrise with long rays;
- `tg-notification-sun-cloud-03.png` — compact glossy editorial icon;
- `comparison.png` — numbered selection sheet;
- `thumbs/` — 320 px Telegram-preview checks.

All deliverables are sRGB PNG, without text, logos or watermarks. The three
final notification files are exactly 1080×1080.

## Reproduction

The unmodified 1254×1254 generation outputs and exact prompts are retained in
`source/`. Run:

```bash
./source/compose.sh
```

The script refuses to render if the approved base or any stored generation
source changes, then rebuilds the 1080 px finals, 320 px thumbnails and the
comparison sheet from a clean output state.
