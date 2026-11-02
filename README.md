# knopka-site
КнопкА — сервис сетевой безопасности

GitHub Pages публикует новый Design2.0 landing из корневых `index.html`,
`styles.css` и `assets/`. Предыдущая опубликованная версия сохранена в
`old_version/` вместе с её assets, manuals и status pages.

Обычные push в `main` не публикуют сайт. Production deploy запускается вручную
в GitHub Actions: **Deploy GitHub Pages → Run workflow**. В поле `ref` можно
указать `main`, тег или конкретный commit SHA. Workflow сначала извлекает
выбранную ревизию, затем целиком публикует её как GitHub Pages artifact.

Проверка корневой сборки:

```bash
node root-check.mjs
```
