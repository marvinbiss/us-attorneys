const { chromium } = require('playwright');

async function debug() {
  const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'fr-FR',
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  const name = 'plombier';
  const city = 'Lyon';
  const url = 'https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=' + encodeURIComponent(name) + '&ou=' + encodeURIComponent(city);

  console.log('URL:', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 3000));

  const content = await page.content();
  console.log('Page size:', content.length);
  console.log('Has datadome:', content.includes('datadome') || content.includes('DataDome'));
  console.log('Has captcha:', content.includes('captcha'));

  // Check for tel: links
  const telLinks = content.match(/href="tel:[^"]+"/g) || [];
  console.log('tel: links:', telLinks.length);
  if (telLinks.length > 0) console.log('  Examples:', telLinks.slice(0, 3));

  // Check for phone patterns
  const mobileRe = /0[67][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g;
  const mobiles = content.match(mobileRe) || [];
  console.log('Mobile patterns in HTML:', mobiles.length);

  // Check for "Afficher le numero" buttons
  const afficher = content.match(/afficher.*num/gi) || [];
  console.log('Afficher numero buttons:', afficher.length);
  if (afficher.length > 0) console.log('  Examples:', afficher.slice(0, 3));

  // Check for SEL_NUM or phone reveal elements
  const selNum = content.match(/SEL_NUM|bi-phone|icon-phone|numero|phone-number/gi) || [];
  console.log('Phone-related classes:', selNum.length);

  // Try clicking "Afficher le numero" if it exists
  const buttons = await page.$$('text=Afficher le N');
  console.log('Clickable "Afficher" buttons:', buttons.length);

  if (buttons.length > 0) {
    console.log('\nClicking first button...');
    await buttons[0].click();
    await new Promise(r => setTimeout(r, 2000));
    const after = await page.content();
    const mobilesAfter = after.match(mobileRe) || [];
    console.log('Mobiles after click:', mobilesAfter.length);
    if (mobilesAfter.length > 0) console.log('  Found:', [...new Set(mobilesAfter.map(m => m.replace(/[\s.]/g, '')))].slice(0, 5));
  }

  // Also try the numbered results approach
  const numBtns = await page.$$('[class*="numero"], [class*="phone"], [data-pjlb*="phone"], a[data-pjlb]');
  console.log('Phone-related elements:', numBtns.length);

  // Screenshot for debug
  await page.screenshot({ path: '/c/Users/USER/Downloads/servicesartisans/scripts/.pw-data/debug-pj.png' });
  console.log('Screenshot saved to .pw-data/debug-pj.png');

  // Print a snippet of the HTML around phone-related areas
  const idx = content.indexOf('numero');
  if (idx > -1) {
    console.log('\nHTML around "numero":', content.substring(Math.max(0, idx - 100), idx + 200));
  }

  await browser.close();
}

debug().catch(e => console.error(e));
