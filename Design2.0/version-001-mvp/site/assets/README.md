# Site assets

`hero-workspace.png` создан встроенным imagegen как нейтральный светлый фон без
текста, логотипов и узнаваемых интерфейсов. Текст и UI в макете набраны в
`../source/` средствами HTML/CSS.

Краткий prompt: светлое домашнее рабочее место, ноутбук и телефон справа,
свободное пространство слева, молочно-персиково-голубая палитра, мягкий
утренний свет; без людей, текста, логотипов и fake UI.

## Hero v2

`reference-hero-v2.png` создан встроенным imagegen на основе
`reference-hero.png`. Сохранены композиция, ракурс, ноутбук, телефон и светлая
палитра; повышены разрешение и детализация. Итоговый файл — `1234×1274`, без
водяных знаков и рекламного текста.

Краткий prompt: реалистичная премиальная предметная фотография ноутбука и
телефона на светлом столе, тот же кадр и пропорции, аккуратные интерфейсы
приложений, тёплый мягкий дневной свет; без людей, дополнительных устройств и
искажённой геометрии.

## Hero wide v3

`reference-hero-wide-v3.png` создан встроенным imagegen как широкая версия
верхней секции (`1672×941`). Устройства расположены справа, слева и сверху
оставлены спокойные светлые зоны под настоящий HTML-текст и навигацию. В
изображение намеренно не встроены заголовки, кнопки и меню.

Краткий prompt: полноширинная реалистичная hero-фотография 16:9, ноутбук справа,
телефон перед ним, светлый стол и тёплая кремовая стена; левая часть тихая и
низкоконтрастная, без людей, текста, кнопок, навигации и водяных знаков.

## App icons v2

`instagram-v2.png`, `telegram-v2.png`, `chatgpt-v2.png` и `youtube-v2.png`
собраны в единой плитке `512×512` из векторных знаков Wikimedia Commons:

- `Instagram_logo_2022.svg`;
- `Telegram_2019_Logo.svg`;
- `ChatGPT-Logo.svg`;
- `YouTube_full-color_icon_(2017).svg`.

Загруженные SVG и контрольные PNG-копии находятся в
`sources/app-icons/`. Названия и товарные знаки принадлежат соответствующим
правообладателям.

## Benefits v2

Для секции «Всё работает вместе» встроенным imagegen пересобраны четыре
иллюстрации с настоящим прозрачным фоном:

- `russian-services-v2.png` — `1200×600`;
- `benefit-access-v2.png` — `960×640`;
- `benefit-search-v2.png` — `960×640`;
- `benefit-support-v2.png` — `925×640`.

Каждый файл имеет RGBA/alpha (`opaque=false`); цвет карточки задаётся только
CSS и остаётся виден за объектом и его мягкой тенью. После генерации PNG
нормализованы и сжаты ImageMagick без добавления фоновой заливки.

Краткие prompts: сохранить исходные формы и мягкую сине-персиковую 3D-палитру,
повысить детализацию, изолировать объект вместе с тенью на genuine transparent
background; без прямоугольной подложки, текста и водяных знаков.

## Platform icons

Для accordion «Как начать» используется единый набор фотореалистичных device
cutout'ов, созданный встроенным imagegen и нормализованный ImageMagick:

- `platform-android-phone-v2.png` — graphite Samsung flagship, `621×900`;
- `platform-iphone-orange-v2.png` — orange iPhone, `598×900`;
- `platform-windows-desktop-v2.png` — monitor, compact tower и keyboard,
  `900×633`;
- `platform-macbook-photo-v1.png` — silver MacBook, `900×600`.

Все четыре PNG имеют настоящий alpha (`opaque=false`), полностью видимый
корпус, мягкую контактную тень и не содержат текста, UI labels или watermark.
Исходные Mini App SVG сохранены рядом как предыдущая версия для простого
отката.

Общий prompt: premium studio product photo of a single platform device,
three-quarter view, transparent background, entire device visible, restrained
screen gradient, subtle grounding shadow; no text, labels, props or watermark.
