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
  await page.goto(new URL('row.html', root).href);
  await page.waitForLoadState('networkidle');

  const check = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.country')].map(element => {
      const rect = element.getBoundingClientRect();
      return {
        country: element.dataset.country,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        transform: getComputedStyle(element).transform,
      };
    });
    const overlaps = [];
    for (let i = 0; i < cards.length; i += 1) {
      for (let j = i + 1; j < cards.length; j += 1) {
        const a = cards[i];
        const b = cards[j];
        const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
        const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
        const area = width * height;
        const ratio = area / Math.min(a.width * a.height, b.width * b.height);
        overlaps.push({ pair: `${a.country}-${b.country}`, ratio });
      }
    }
    return {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      brokenImages: [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.src),
      cards,
      overlaps,
    };
  });

  const forbiddenOverlap = check.overlaps.find(item => item.pair === 'PL-GB' && item.ratio !== 0);
  const excessiveOverlap = check.overlaps.find(item => item.ratio > 0.2 + Number.EPSILON);
  const transformedCard = check.cards.find(card => card.transform !== 'none');
  if (
    check.width !== 1254 || check.height !== 1568 || check.brokenImages.length ||
    check.cards.length !== 5 || forbiddenOverlap || excessiveOverlap || transformedCard || errors.length
  ) {
    throw new Error(JSON.stringify({ check, forbiddenOverlap, excessiveOverlap, transformedCard, errors }));
  }

  const path = fileURLToPath(new URL('../tg-notification-01-row.png', root));
  await page.screenshot({ path, fullPage: true });
  console.log(JSON.stringify({ path, ...check }));
  await page.close();
} finally {
  await browser.close();
}
