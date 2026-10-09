// Verify the GitHub Pages root after promoting Design2.0/source.
import { chromium } from '/usr/lib/node_modules/openclaw/node_modules/playwright-core/index.mjs';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('./', import.meta.url);
const expectedDownloads = [
  'https://github.com/mrs885/knopka/releases/download/android-2.7/knopka-2.7.apk',
  'https://testflight.apple.com/join/66AbtsBG',
  'https://github.com/mrs885/knopka/releases/download/windows-3.1/Knopka-Setup-3.1.2.exe',
  'https://github.com/mrs885/knopka/releases/download/macOS-1.0/KnopkA.dmg',
];

for (const path of ['old_version/index.html', 'old_version/assets/og-image.png', 'old_version/manuals/android.pdf']) {
  if (!existsSync(fileURLToPath(new URL(path, root)))) throw new Error(`Archive file missing: ${path}`);
}

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome-stable', headless: true, args: ['--no-sandbox'] });
try {
  for (const width of [390, 772, 1000, 1200, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(new URL('index.html', root).href);
    await page.evaluate(() => document.fonts.ready);
    const result = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      brokenImages: [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.src),
      socialMeta: { ogTitle: document.querySelector('meta[property="og:title"]')?.content, ogImage: document.querySelector('meta[property="og:image"]')?.content, twitterCard: document.querySelector('meta[name="twitter:card"]')?.content, twitterImage: document.querySelector('meta[name="twitter:image"]')?.content },
      missingAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(link => !document.getElementById(link.hash.slice(1))).map(link => link.hash),
      downloads: [...document.querySelectorAll('#start .platform-download')].map(link => link.href),
      support: document.querySelector('.support-copy a')?.href,
      tariffPadding: [getComputedStyle(document.querySelector('#tariff')).paddingTop, getComputedStyle(document.querySelector('#tariff')).paddingBottom],
      tariffRightGap: Math.round(innerWidth - document.querySelector('#tariff .tariff-cta').getBoundingClientRect().right),
    }));
    const minimumGap = width <= 700 ? 16 : 24;
    if (result.width !== width || result.scrollWidth > width || result.brokenImages.length || result.missingAnchors.length || errors.length ||
        result.socialMeta.ogTitle !== 'КнопкА — стабильный ВПН с защитой трафика. Неделя бесплатного использования' || result.socialMeta.ogImage !== 'https://knopka.onlinedesk.online/assets/og-image.png' || result.socialMeta.twitterCard !== 'summary' || result.socialMeta.twitterImage !== result.socialMeta.ogImage ||
        JSON.stringify(result.downloads) !== JSON.stringify(expectedDownloads) ||
        result.support !== 'https://t.me/AKnopkaVpnBot?start=support' ||
        JSON.stringify(result.tariffPadding) !== JSON.stringify(['24px', '24px']) || result.tariffRightGap < minimumGap) {
      throw new Error(JSON.stringify({ width, ...result, errors }));
    }
    console.log(JSON.stringify({ width, scrollWidth: result.scrollWidth, tariffRightGap: result.tariffRightGap, status: 'OK' }));
    await page.close();
  }
  const directPage = await browser.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1 });
  for (const [parameter, expected] of [['android', 'platform-android'], ['ios', 'platform-iphone'], ['iphone', 'platform-iphone'], ['windows', 'platform-windows'], ['mac', 'platform-macbook'], ['macos', 'platform-macbook'], ['macbook', 'platform-macbook']]) {
    await directPage.goto(new URL(`index.html?platform=${parameter}`, root).href);
    await directPage.waitForTimeout(150);
    const result = await directPage.evaluate(() => ({ open: [...document.querySelectorAll('#start details.platform-accordion[open]')].map(element => element.className), scrollY }));
    if (result.open.length !== 1 || !result.open[0].includes(expected) || result.scrollY === 0) throw new Error(`?platform=${parameter} failed: ${JSON.stringify(result)}`);
  }
  await directPage.close();
} finally {
  await browser.close();
}
