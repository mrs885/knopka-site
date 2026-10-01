# КнопкА Design 2.0 — version-001-mvp

Реализация требований из `../REQ/REQ-001-mvp.md`.

## Что входит

- `site/` — desktop/mobile макеты рекламного лендинга и отдельный layout-template;
- `app-site/` — desktop/mobile макеты четырёх платёжных состояний и отдельные layout-templates;
- `tg-ad/` — квадратный рекламный макет, уменьшенное превью и текст;
- `tg-bot/` — стартовое изображение, превью в Telegram и текст.

`source/` содержит редактируемые HTML/CSS-источники макетов. Файлы в
`template/` намеренно используют пустые media placeholders и не содержат
production-интеграций.

## Палитра MVP

- background: `#fbf7f2`;
- surface: `#fffdf9`;
- peach: `#f5dfd2`;
- sky: `#dcecff`;
- text: `#172033`;
- muted: `#667085`;
- action: `#2878ff`.

Сгенерированные растровые фоны не содержат текста и логотипов. Весь текст
наложен контролируемой HTML/CSS-вёрсткой.
