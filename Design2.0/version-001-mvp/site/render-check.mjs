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
        platformImages:[...document.querySelectorAll('#start .platform-mark img')].map(i=>i.getAttribute('src')),
        platformGuides:[...document.querySelectorAll('#start .platform-guide-link')].map(a=>({href:a.getAttribute('href'),target:a.getAttribute('target'),rel:a.getAttribute('rel'),platform:a.closest('details')?.className})),
        downloadButtons:[...document.querySelectorAll('#start .platform-download')].map(button=>({label:button.querySelector('.download-copy strong')?.textContent,note:button.querySelector('.download-copy small')?.textContent,file:button.querySelector('.download-file')?.textContent,mark:button.querySelector('.download-mark')?.textContent,isolated:!button.classList.contains('button')})),
        trialCtas:[...document.querySelectorAll('a,button')].filter(el=>el.textContent.includes('Попробовать бесплатно')).map(el=>({tag:el.tagName,href:el.getAttribute('href')})),
        tariffLayouts:document.querySelectorAll('#tariff .tariff-layout').length,
        heroBackgrounds:document.querySelectorAll('.hero-wrap > .hero-background').length,
        heroBackgroundWidth:Math.round(document.querySelector('.hero-wrap > .hero-background')?.getBoundingClientRect().width || 0),
        brandLogos:[...document.querySelectorAll('.wordmark .brand-logo')].map(i=>({src:i.getAttribute('src'),width:Math.round(i.getBoundingClientRect().width)})),
        supportOperator:[...document.querySelectorAll('.support .support-operator')].map(i=>({src:i.getAttribute('src'),width:Math.round(i.getBoundingClientRect().width)})),
        supportWidth:Math.round(document.querySelector('.support')?.getBoundingClientRect().width || 0),
        sectionWidth:Math.round(document.querySelector('.section.shell')?.getBoundingClientRect().width || 0),
        missingAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash)
      }));
      if(check.width!==width||check.scroll>width||check.images.length||check.missingAnchors.length||errors.length) throw Error(JSON.stringify({kind,...check,errors}));
      if(check.heading!=='Доступ ко всем приложениям'||check.nav.length!==4) throw Error('Missing headline/nav');
      if(check.platformAccordions!==4) throw Error(`${kind} must have four platform accordions`);
      if(JSON.stringify(check.platformImages)!==JSON.stringify([
        '../assets/platform-android-samsung-user-v3.png',
        '../assets/platform-iphone-user-v3.png',
        '../assets/platform-windows-desktop-v2.png',
        '../assets/platform-macbook-photo-v1.png'
      ])) throw Error(`${kind} platform imagery is incomplete`);
      if(JSON.stringify(check.platformGuides.map(link=>link.href))!==JSON.stringify([
        '../assets/installation-android.pdf',
        '../assets/installation-iphone.pdf',
        '../assets/installation-macbook.pdf'
      ])||check.platformGuides.some(link=>link.target!=='_blank'||link.rel!=='noopener'||link.platform.includes('platform-windows'))) throw Error(`${kind} platform PDF guides are incomplete`);
      if(JSON.stringify(check.downloadButtons)!==JSON.stringify([
        {label:'Скачать для Android',note:'Установочный файл',file:'APK',mark:'A',isolated:true},
        {label:'Открыть TestFlight',note:'Установка на iPhone',file:'iOS',mark:'i',isolated:true},
        {label:'Скачать для Windows',note:'Установщик приложения',file:'EXE',mark:'W',isolated:true},
        {label:'Скачать для MacBook',note:'Образ приложения',file:'DMG',mark:'M',isolated:true}
      ])) throw Error(`${kind} store-style download buttons are incomplete`);
      if(check.trialCtas.length!==3||check.trialCtas.some(cta=>cta.tag!=='A'||cta.href!=='#start')) throw Error(`${kind} trial CTAs must link to #start`);
      if(check.tariffLayouts!==1) throw Error(`${kind} tariff layout missing`);
      if(check.heroBackgrounds!==1||check.heroBackgroundWidth!==width) throw Error(`${kind} hero background must span the viewport`);
      if(check.brandLogos.length!==2||check.brandLogos.some(logo=>logo.src!=='../../assets/app-button-black-a.png'||logo.width<25)) throw Error(`${kind} header/footer brand logos are incomplete`);
      if(check.supportOperator.length!==1||check.supportOperator[0].src!=='../assets/support-operator-site-v2.png'||check.supportOperator[0].width<110) throw Error(`${kind} support operator artwork is incomplete`);
      if(check.supportWidth!==check.sectionWidth) throw Error(`${kind} support card must match section width`);
      const accordions=page.locator('#start details.platform-accordion');
      for(let index=0;index<4;index++) {
        await accordions.nth(index).locator('summary').click();
        if(!await accordions.nth(index).evaluate(el=>el.open)) throw Error(`Platform accordion ${index+1} failed`);
        if(index>0) await accordions.nth(index).locator('summary').click();
      }
      const faq=page.locator('#faq details').first();
      await faq.locator('summary').click();
      if(!await faq.evaluate(el=>el.open))throw Error('FAQ failed');
      await faq.locator('summary').click();
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:fileURLToPath(new URL(`renders/${kind}-${width}.png`,root)),fullPage:true});
      console.log(JSON.stringify({kind,...check,accordions:'OK',errors}));
      await page.close();
    }
  }
} finally {await browser.close();}
