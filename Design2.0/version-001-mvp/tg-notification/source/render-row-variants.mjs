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
  for (const variant of ['a', 'b', 'c', 'd', 'e']) {
    const page = await browser.newPage({ viewport: { width: 1254, height: 1568 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(new URL(`row-variants.html?variant=${variant}`, root).href);
    await page.waitForLoadState('networkidle');
    const check = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      brokenImages: [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.src),
      cards: document.querySelectorAll('.country').length,
    }));
    if (check.width !== 1254 || check.height !== 1568 || check.brokenImages.length || check.cards !== 5 || errors.length) {
      throw new Error(JSON.stringify({ variant, check, errors }));
    }
    const path = fileURLToPath(new URL(`../tg-notification-01-row-${variant}.png`, root));
    await page.screenshot({ path, fullPage: true });
    await page.close();
    console.log(JSON.stringify({ variant, path, ...check }));
  }
} finally {
  await browser.close();
}
