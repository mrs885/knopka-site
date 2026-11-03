#!/usr/bin/env python3
"""Generate the four platform landing pages from the production homepage."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class Platform:
    slug: str
    css_class: str
    label: str
    title: str
    description: str
    intro: str


PLATFORMS = (
    Platform(
        "macos",
        "macbook",
        "macOS",
        "КнопкА для macOS — стабильный ВПН",
        "Скачайте КнопкА для macOS, установите приложение из DMG-файла и получите 7 дней бесплатного доступа.",
        "Установите КнопкА на macOS — внутри короткая пошаговая инструкция.",
    ),
    Platform(
        "ios",
        "iphone",
        "iOS",
        "КнопкА для iOS — стабильный ВПН",
        "Установите КнопкА на iPhone через TestFlight и получите 7 дней бесплатного доступа.",
        "Установите КнопкА на iPhone — внутри короткая пошаговая инструкция.",
    ),
    Platform(
        "android",
        "android",
        "Android",
        "КнопкА для Android — стабильный ВПН",
        "Скачайте КнопкА для Android, установите APK и получите 7 дней бесплатного доступа.",
        "Установите КнопкА на Android — внутри короткая пошаговая инструкция.",
    ),
    Platform(
        "windows",
        "windows",
        "Windows",
        "КнопкА для Windows — стабильный ВПН",
        "Скачайте КнопкА для Windows, запустите установщик и получите 7 дней бесплатного доступа.",
        "Установите КнопкА на Windows — внутри короткая пошаговая инструкция.",
    ),
)


def replace_meta(html: str, platform: Platform) -> str:
    url = f"https://knopka.onlinedesk.online/{platform.slug}/"
    html = re.sub(r"<title>.*?</title>", f"<title>{platform.title}</title>", html, count=1)
    html = re.sub(
        r'(<meta property="og:url" content=")[^"]*(">)',
        rf"\g<1>{url}\g<2>",
        html,
        count=1,
    )
    html = re.sub(
        r'(<meta property="og:title" content=")[^"]*(">)',
        rf"\g<1>{platform.title}\g<2>",
        html,
        count=1,
    )
    html = re.sub(
        r'(<meta property="og:description" content=")[^"]*(">)',
        rf"\g<1>{platform.description}\g<2>",
        html,
        count=1,
    )
    html = re.sub(
        r'(<meta name="twitter:title" content=")[^"]*(">)',
        rf"\g<1>{platform.title}\g<2>",
        html,
        count=1,
    )
    html = re.sub(
        r'(<meta name="twitter:description" content=")[^"]*(">)',
        rf"\g<1>{platform.description}\g<2>",
        html,
        count=1,
    )
    html, count = re.subn(
        r'<link rel="stylesheet" href="styles\.css\?v=[^"]+">',
        '<link rel="canonical" href="' + url + '">\n  <link rel="stylesheet" href="../styles.css?v=20261103-1">',
        html,
        count=1,
    )
    if count != 1:
        raise RuntimeError("Stylesheet marker not found")
    return html


def make_paths_relative(html: str) -> str:
    html = html.replace('src="assets/', 'src="../assets/')
    html = html.replace('href="assets/', 'href="../assets/')
    html = html.replace('href="/assets/', 'href="../assets/')
    return html


def child_navigation(html: str) -> str:
    html = html.replace('<a class="wordmark" href="#top">', '<a class="wordmark" href="../">')
    html = html.replace('<a href="#benefits">Преимущества</a>', '<a href="../#benefits">Преимущества</a>')
    for slug in ("macos", "ios", "android", "windows"):
        html = html.replace(f'href="{slug}/"', f'href="../{slug}/"')
    return html


def add_breadcrumbs(html: str, platform: Platform) -> str:
    marker = "    </header>\n    <section class=\"hero\""
    breadcrumbs = f'''    </header>
    <nav class="breadcrumbs shell" aria-label="Хлебные крошки">
      <ol>
        <li><a href="../">КнопкА</a></li>
        <li><span>Платформы</span></li>
        <li><span aria-current="page">{platform.label}</span></li>
      </ol>
    </nav>
    <section class="hero"'''
    if marker not in html:
        raise RuntimeError("Header marker not found")
    return html.replace(marker, breadcrumbs, 1)


def remove_benefits(html: str) -> str:
    result, count = re.subn(
        r'\n    <section class="section shell" id="benefits".*?</section>',
        "",
        html,
        count=1,
        flags=re.DOTALL,
    )
    if count != 1:
        raise RuntimeError("Benefits section was not removed exactly once")
    return result


def keep_platform(html: str, platform: Platform) -> str:
    pattern = re.compile(
        r'\n        <details class="platform-accordion platform-([^"]+)">.*?</details>',
        re.DOTALL,
    )
    blocks = list(pattern.finditer(html))
    if len(blocks) != 4:
        raise RuntimeError(f"Expected four platform blocks, found {len(blocks)}")
    selected = next((match.group(0) for match in blocks if match.group(1) == platform.css_class), None)
    if selected is None:
        raise RuntimeError(f"Platform block not found: {platform.css_class}")
    selected = selected.replace(
        f'<details class="platform-accordion platform-{platform.css_class}">',
        f'<details class="platform-accordion platform-{platform.css_class}" open>',
        1,
    )
    selected = re.sub(
        r'(<span class="platform-heading"><strong>)[^<]+',
        rf"\g<1>{platform.label}",
        selected,
        count=1,
    )
    if platform.slug == "macos":
        selected = selected.replace("Скачать для MacBook", "Скачать для macOS", 1)
    start, end = blocks[0].start(), blocks[-1].end()
    html = html[:start] + selected + html[end:]
    html = html.replace(
        '<p class="section-intro">Выберите своё устройство — внутри короткая инструкция по установке.</p>',
        f'<p class="section-intro">{platform.intro}</p>',
        1,
    )
    return html


def generate(platform: Platform, source: str) -> str:
    html = replace_meta(source, platform)
    html = make_paths_relative(html)
    html = child_navigation(html)
    html = add_breadcrumbs(html, platform)
    html = remove_benefits(html)
    html = keep_platform(html, platform)
    return html


def main() -> None:
    source = (ROOT / "index.html").read_text(encoding="utf-8")
    for platform in PLATFORMS:
        output = ROOT / platform.slug / "index.html"
        output.parent.mkdir(exist_ok=True)
        output.write_text(generate(platform, source), encoding="utf-8")
        print(output.relative_to(ROOT))


if __name__ == "__main__":
    main()
