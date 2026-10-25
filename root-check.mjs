// Verify the GitHub Pages root after promoting Design2.0/source.
import { chromium } from '/usr/lib/node_modules/openclaw/node_modules/playwright-core/index.mjs';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('./', import.meta.url);
const expectedDownloads = [
  'https://storage.yandexcloud.net/knopka/knopka-2.9.apk',
  'https://testflight.apple.com/join/66AbtsBG',
  'https://storage.yandexcloud.net/knopka/Knopka-Setup-3.1.3.exe',
  'https://storage.yandexcloud.net/knopka/KnopkA-31.dmg',
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
      stylesheet: document.querySelector('link[rel="stylesheet"]')?.getAttribute('href'),
      missingAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(link => !document.getElementById(link.hash.slice(1))).map(link => link.hash),
      downloads: [...document.querySelectorAll('#start .platform-download')].map(link => link.href),
      faqQuestions: [...document.querySelectorAll('#faq details > summary')].map(summary => summary.textContent.trim()),
      familyImages: [...document.querySelectorAll('#faq .faq-family-gallery img')].map(image => ({ src: image.getAttribute('src'), alt: image.alt })),
      promoImage: (() => { const image = document.querySelector('#faq .faq-promo-figure img'); return image ? { src: image.getAttribute('src'), alt: image.alt } : null; })(),
      support: document.querySelector('.support-copy a')?.href,
      tariffPadding: [getComputedStyle(document.querySelector('#tariff')).paddingTop, getComputedStyle(document.querySelector('#tariff')).paddingBottom],
      tariffRightGap: Math.round(innerWidth - document.querySelector('#tariff .tariff-cta').getBoundingClientRect().right),
    }));
    const minimumGap = width <= 700 ? 16 : 24;
    if (result.width !== width || result.scrollWidth > width || result.brokenImages.length || result.missingAnchors.length || errors.length ||
        result.socialMeta.ogTitle !== 'КнопкА — стабильный ВПН' || result.socialMeta.ogImage !== 'https://knopka.onlinedesk.online/assets/app-button-black-a.png' || result.socialMeta.twitterCard !== 'summary' || result.socialMeta.twitterImage !== result.socialMeta.ogImage || result.stylesheet !== 'styles.css?v=20261025-3' ||
        JSON.stringify(result.downloads) !== JSON.stringify(expectedDownloads) ||
        JSON.stringify(result.faqQuestions) !== JSON.stringify(['Как подключиться?', 'На каких устройствах можно установить ВПН?', 'Есть ли семейный тариф?', 'Как использовать промо-код и получить скидку?', 'Что делать, если возникла проблема?']) ||
        result.familyImages.length !== 3 || result.familyImages.some(image => !image.src || !image.alt) ||
        !result.promoImage?.src || !result.promoImage.alt ||
        result.support !== 'https://t.me/AKnopkaVpnBot?start=support' ||
        JSON.stringify(result.tariffPadding) !== JSON.stringify(['24px', '24px']) || result.tariffRightGap < minimumGap) {
      throw new Error(JSON.stringify({ width, ...result, errors }));
    }
    console.log(JSON.stringify({ width, scrollWidth: result.scrollWidth, tariffRightGap: result.tariffRightGap, status: 'OK' }));
    await page.close();
  }

  const accordionPage = await browser.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1 });
  await accordionPage.goto(new URL('index.html', root).href);
  const faqSummary = accordionPage.locator('#faq details').first().locator('summary');
  const closedState = await faqSummary.evaluate(summary => {
    const icon = getComputedStyle(summary, '::after');
    return {
      userSelect: getComputedStyle(summary).userSelect,
      content: icon.content,
      transform: icon.transform,
      borderRight: icon.borderRightWidth,
      borderBottom: icon.borderBottomWidth,
    };
  });
  await faqSummary.click();
  await accordionPage.waitForTimeout(250);
  const openState = await faqSummary.evaluate(summary => ({
    open: summary.parentElement.open,
    transform: getComputedStyle(summary, '::after').transform,
  }));
  const selectableAnswer = await accordionPage.evaluate(() => {
    const answer = document.querySelector('#faq details[open] p');
    const range = document.createRange();
    range.selectNodeContents(answer);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return { selected: selection.toString(), userSelect: getComputedStyle(answer).userSelect };
  });
  await faqSummary.click();
  const closedAfterSelection = await accordionPage.evaluate(() => ({
    open: document.querySelector('#faq details').open,
    selection: window.getSelection()?.toString() ?? '',
  }));
  if (closedState.userSelect !== 'none' || closedState.content !== '""' || closedState.transform === 'none' ||
      closedState.borderRight === '0px' || closedState.borderBottom === '0px' || !openState.open ||
      openState.transform === closedState.transform || selectableAnswer.userSelect === 'none' ||
      !selectableAnswer.selected || closedAfterSelection.open || closedAfterSelection.selection) {
    throw new Error(`Accordion interaction failed: ${JSON.stringify({ closedState, openState, selectableAnswer, closedAfterSelection })}`);
  }
  await faqSummary.focus();
  await accordionPage.keyboard.press('Enter');
  if (!await faqSummary.evaluate(summary => summary.parentElement.open)) throw new Error('FAQ keyboard toggle failed');
  const promoDetails = accordionPage.locator('#faq .faq-promo');
  await promoDetails.locator('summary').click();
  const promoVisual = await promoDetails.evaluate(details => {
    const image = details.querySelector('img');
    const steps = details.querySelector('.faq-steps');
    return {
      width: Math.round(image.getBoundingClientRect().width),
      borderRadius: getComputedStyle(image).borderRadius,
      imageTop: Math.round(image.getBoundingClientRect().top),
      stepsBottom: Math.round(steps.getBoundingClientRect().bottom),
    };
  });
  if (promoVisual.width !== 266 || promoVisual.borderRadius !== '12px' || promoVisual.imageTop < promoVisual.stepsBottom) {
    throw new Error(`Promo FAQ visual contract failed: ${JSON.stringify(promoVisual)}`);
  }
  await accordionPage.close();

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
