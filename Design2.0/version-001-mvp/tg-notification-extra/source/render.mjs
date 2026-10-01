import { fileURLToPath } from 'node:url';

const playwrightModule = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const { chromium } = playwrightModule.chromium ? playwrightModule : playwrightModule.default;
const root = new URL('./', import.meta.url);
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome-stable',
  headless: true,
  args: ['--no-sandbox'],
});

try {
  const page = await browser.newPage({ viewport: { width: 1254, height: 1568 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL('index.html', root).href);
  await page.waitForLoadState('networkidle');

  const check = await page.evaluate(() => {
    const rect = selector => {
      const bounds = document.querySelector(selector).getBoundingClientRect();
      return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, bottom: bounds.bottom };
    };
    return {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      brokenImages: [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.src),
      wallBrand: rect('.wall-brand'),
      foregroundTitle: rect('.foreground-title'),
      titleText: document.querySelector('.foreground-title').textContent.replace(/\s+/g, ' ').trim(),
      iconText: document.querySelector('.brand-icon').textContent.trim(),
    };
  });

  if (
    check.width !== 1254 || check.height !== 1568 || check.brokenImages.length ||
    check.titleText !== 'КнопкА ВПН' || check.iconText !== 'A' ||
    check.wallBrand.y < 110 || check.wallBrand.bottom > 390 ||
    check.foregroundTitle.y < 1160 || check.foregroundTitle.bottom > 1440 || errors.length
  ) {
    throw new Error(JSON.stringify({ check, errors }));
  }

  const path = fileURLToPath(new URL('../tg-notification-extra-01.png', root));
  await page.screenshot({ path, fullPage: true });
  console.log(JSON.stringify({ path, ...check }));
  await page.close();
} finally {
  await browser.close();
}
