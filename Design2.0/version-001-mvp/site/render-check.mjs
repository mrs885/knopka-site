// Run with PLAYWRIGHT_MODULE=/path/to/playwright-core/index.mjs node render-check.mjs
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const root = new URL('./', import.meta.url);
mkdirSync(new URL('renders/',root), {recursive:true});
const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome-stable',headless:true,args:['--no-sandbox']});
try {
  for (const kind of ['source','template']) {
    for (const width of [390,772,1440]) {
      const page = await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
      const errors=[];
      page.on('pageerror', e=>errors.push(e.message));
      await page.goto(new URL(`${kind}/index.html`,root).href);
      await page.evaluate(()=>document.fonts.ready);
      const check=await page.evaluate(()=>({
        width:innerWidth, scroll:document.documentElement.scrollWidth,
        images:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),
        heading:document.querySelector('h1').innerText.replace(/\s+/g,' '),
        nav:[...document.querySelectorAll('header nav a')].map(a=>a.textContent),
        platformAccordions:document.querySelectorAll('#start details.platform-accordion').length,
        trialCtas:[...document.querySelectorAll('a,button')].filter(el=>el.textContent.includes('Попробовать бесплатно')).map(el=>({tag:el.tagName,href:el.getAttribute('href')})),
        tariffLayouts:document.querySelectorAll('#tariff .tariff-layout').length,
        missingAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash)
      }));
      if(check.width!==width||check.scroll>width||check.images.length||check.missingAnchors.length||errors.length) throw Error(JSON.stringify({kind,...check,errors}));
      if(check.heading!=='Доступ ко всем приложениям'||check.nav.length!==4) throw Error('Missing headline/nav');
      if(kind==='template') {
        if(check.platformAccordions!==4) throw Error('Template must have four platform accordions');
        if(check.trialCtas.length!==3||check.trialCtas.some(cta=>cta.tag!=='A'||cta.href!=='#start')) throw Error('Template trial CTAs must link to #start');
        if(check.tariffLayouts!==1) throw Error('Template tariff layout missing');
        const accordions=page.locator('#start details.platform-accordion');
        for(let index=0;index<4;index++) {
          await accordions.nth(index).locator('summary').click();
          if(!await accordions.nth(index).evaluate(el=>el.open)) throw Error(`Platform accordion ${index+1} failed`);
          if(index>0) await accordions.nth(index).locator('summary').click();
        }
      } else {
        await page.locator('summary').first().click();
        if(!await page.locator('details').first().evaluate(el=>el.open))throw Error('FAQ failed');
        await page.locator('summary').first().click();
      }
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:fileURLToPath(new URL(`renders/${kind}-${width}.png`,root)),fullPage:true});
      console.log(JSON.stringify({kind,...check,accordions:'OK',errors}));
      await page.close();
    }
  }
} finally {await browser.close();}
