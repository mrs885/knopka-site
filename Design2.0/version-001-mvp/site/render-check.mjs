// Run with PLAYWRIGHT_MODULE=/path/to/playwright-core/index.mjs node render-check.mjs
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const root = new URL('./', import.meta.url);
mkdirSync(new URL('renders/',root), {recursive:true});
const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome-stable',headless:true,args:['--no-sandbox']});
try {
  for (const kind of ['source','template']) {
    for (const width of [390,772,1000,1200,1440]) {
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
        downloadButtons:[...document.querySelectorAll('#start .platform-download')].map(button=>({tag:button.tagName,href:button.getAttribute('href'),target:button.getAttribute('target'),rel:button.getAttribute('rel'),configKey:button.dataset.configKey,label:button.querySelector('.download-copy strong')?.textContent,note:button.querySelector('.download-copy small')?.textContent,file:button.querySelector('.download-file')?.textContent,mark:button.querySelector('.download-mark')?.textContent,isolated:!button.classList.contains('button')})),
        supportLink:[...document.querySelectorAll('.support-copy a')].map(link=>({href:link.getAttribute('href'),target:link.getAttribute('target'),rel:link.getAttribute('rel')})),
        trialCtas:[...document.querySelectorAll('a,button')].filter(el=>el.textContent.includes('Попробовать бесплатно')).map(el=>({tag:el.tagName,href:el.getAttribute('href')})),
        tariffLayouts:document.querySelectorAll('#tariff .tariff-layout').length,
        heroBackgrounds:document.querySelectorAll('.hero-wrap > .hero-background').length,
        heroBackgroundWidth:Math.round(document.querySelector('.hero-wrap > .hero-background')?.getBoundingClientRect().width || 0),
        brandLogos:[...document.querySelectorAll('.wordmark .brand-logo')].map(i=>({src:i.getAttribute('src'),width:Math.round(i.getBoundingClientRect().width)})),
        supportOperator:[...document.querySelectorAll('.support .support-operator')].map(i=>({src:i.getAttribute('src'),width:Math.round(i.getBoundingClientRect().width)})),
        supportWidth:Math.round(document.querySelector('.support')?.getBoundingClientRect().width || 0),
        sectionWidth:Math.round(document.querySelector('.section.shell')?.getBoundingClientRect().width || 0),
        faqQuestions:[...document.querySelectorAll('#faq details summary')].map(el=>el.textContent.trim()),
        faqAnswers:[...document.querySelectorAll('#faq details p')].map(el=>el.textContent.trim()),
        reviewAvatars:[...document.querySelectorAll('#reviews .review-avatar')].map(i=>i.getAttribute('src')),
        reviewText:document.querySelector('#reviews')?.innerText || '',
        tariffPadding:[getComputedStyle(document.querySelector('#tariff')).paddingTop,getComputedStyle(document.querySelector('#tariff')).paddingBottom],
        tariffCtaRightGap:Math.round(innerWidth-document.querySelector('#tariff .tariff-cta').getBoundingClientRect().right),
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
        {tag:'A',href:'https://github.com/mrs885/knopka/releases/download/android-2.7/knopka-2.7.apk',target:'_blank',rel:'noopener',configKey:'apk_url',label:'Скачать для Android',note:'Установочный файл',file:'APK',mark:'A',isolated:true},
        {tag:'A',href:'https://testflight.apple.com/join/66AbtsBG',target:'_blank',rel:'noopener',configKey:'update_url',label:'Открыть TestFlight',note:'Установка на iPhone',file:'iOS',mark:'i',isolated:true},
        {tag:'A',href:'https://github.com/mrs885/knopka/releases/download/windows-3.1/Knopka-Setup-3.1.2.exe',target:'_blank',rel:'noopener',configKey:'win_url',label:'Скачать для Windows',note:'Установщик приложения',file:'EXE',mark:'W',isolated:true},
        {tag:'A',href:'https://github.com/mrs885/knopka/releases/download/macOS-1.0/KnopkA.dmg',target:'_blank',rel:'noopener',configKey:'dmg_url',label:'Скачать для MacBook',note:'Образ приложения',file:'DMG',mark:'M',isolated:true}
      ])) throw Error(`${kind} store-style download buttons are incomplete`);
      if(JSON.stringify(check.supportLink)!==JSON.stringify([{href:'https://t.me/AKnopkaVpnBot?start=support',target:'_blank',rel:'noopener'}])) throw Error(`${kind} PROD support link is incomplete`);
      if(check.trialCtas.length!==3||check.trialCtas.some(cta=>cta.tag!=='A'||cta.href!=='#start')) throw Error(`${kind} trial CTAs must link to #start`);
      if(check.tariffLayouts!==1) throw Error(`${kind} tariff layout missing`);
      if(check.heroBackgrounds!==1||check.heroBackgroundWidth!==width) throw Error(`${kind} hero background must span the viewport`);
      if(check.brandLogos.length!==2||check.brandLogos.some(logo=>logo.src!=='../../assets/app-button-black-a.png'||logo.width<25)) throw Error(`${kind} header/footer brand logos are incomplete`);
      if(check.supportOperator.length!==1||check.supportOperator[0].src!=='../assets/support-operator-site-v2.png'||check.supportOperator[0].width<110) throw Error(`${kind} support operator artwork is incomplete`);
      if(check.supportWidth!==check.sectionWidth) throw Error(`${kind} support card must match section width`);
      if(JSON.stringify(check.faqQuestions)!==JSON.stringify(['Как подключиться?','На каких устройствах можно установить ВПН?','Что делать, если возникла проблема?'])||check.faqAnswers.length!==3||check.faqAnswers.some(answer=>!answer)) throw Error(`${kind} FAQ copy is incomplete`);
      if(JSON.stringify(check.reviewAvatars)!==JSON.stringify(['../assets/review-woman-1-v1.png','../assets/review-man-v1.png','../assets/review-woman-2-v1.png'])||check.reviewText.includes('Пример')) throw Error(`${kind} review portraits or copy are incomplete`);
      const minimumTariffCtaGap=width<=700?16:24;
      if(JSON.stringify(check.tariffPadding)!==JSON.stringify(['24px','24px'])||check.tariffCtaRightGap<minimumTariffCtaGap) throw Error(`${kind} tariff spacing is unsafe at ${width}px`);
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
      if([390,772,1440].includes(width)) await page.screenshot({path:fileURLToPath(new URL(`renders/${kind}-${width}.png`,root)),fullPage:true});
      console.log(JSON.stringify({kind,...check,accordions:'OK',errors}));
      await page.close();
    }
  }
} finally {await browser.close();}
