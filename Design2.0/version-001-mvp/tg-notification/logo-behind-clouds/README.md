# КнопкА behind clouds — Telegram notification variants

Three variants based on the selected
`../sun-after-cloud/tg-notification-sun-cloud-02.png`. The sun was removed,
the cloud scene was expanded, and the exact production КнопкА app button was
composited into the opening with an additional green glow.

The logo source is the canonical
`../../../assets/app-button-black-a.png`, also used by
`../../site/source/index.html` for the site wordmark. The copied source asset
is byte-identical to that file and is never redrawn by the image model.

## Deliverables

- `tg-notification-logo-clouds-01.png` — centered logo behind a deep cloud bank;
- `tg-notification-logo-clouds-02.png` — logo in a bright opening between cloud towers;
- `tg-notification-logo-clouds-03.png` — offset logo inside a diagonal cloud ring;
- `comparison.png` — numbered selection sheet;
- `thumbs/` — 320 px Telegram-preview checks.

All three notification files are 1080×1080 sRGB PNG without text or
watermarks.

## Reproduction

```bash
./source/compose.sh
```

The script verifies the selected base, canonical logo and three generated
cloud plates by SHA-256 before recreating every output from a clean state.
