const { chromium } = require('playwright');

async function debug() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'fr-FR',
    viewport: { width: 1280, height: 720 },
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();

  const tests = [
    { name: 'AMG', city: 'Nimes', expected: '0699028068' },
    { name: 'ENTREPRISE VILLETTE', city: 'Bu', expected: '0667298330' },
    { name: 'CHANUC PEINTURE', city: 'Toulouse', expected: '0675878111' },
    { name: 'plombier chauffagiste', city: 'Lyon', expected: null },
  ];

  for (const t of tests) {
    const query = '"' + t.name + '" ' + t.city + ' telephone portable';
    const url = 'https://www.google.fr/search?q=' + encodeURIComponent(query) + '&hl=fr&gl=fr&num=10';

    console.log('\n=== ' + t.name + ' / ' + t.city + (t.expected ? ' (attendu: ' + t.expected + ')' : '') + ' ===');
    console.log('Query:', query);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    const content = await page.content();
    const title = await page.title();
    console.log('  Title:', title.substring(0, 60));
    console.log('  Size:', content.length);
    console.log('  Captcha:', content.includes('captcha') || content.includes('unusual traffic'));

    // Extract mobiles from rendered page
    const mobileRe = /0[67][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g;
    const mobiles = content.match(mobileRe) || [];
    const unique = [...new Set(mobiles.map(m => m.replace(/[\s.]/g, '')))].filter(m => /^0[67]\d{8}$/.test(m));
    console.log('  Mobiles:', unique.length, unique.slice(0, 5));

    // +33 format
    const intlRe = /\+33[\s.]?[67][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g;
    const intls = content.match(intlRe) || [];
    console.log('  +33 mobiles:', intls.length, intls.slice(0, 3));

    // tel: links
    const telRe = /href="tel:([^"]+)"/g;
    let m;
    const tels = [];
    while ((m = telRe.exec(content)) !== null) tels.push(m[1]);
    console.log('  tel: links:', tels.length, tels.slice(0, 3));

    if (t.expected) {
      const found = unique.includes(t.expected) || content.includes(t.expected);
      console.log('  Match:', found ? 'OUI' : 'NON');
    }

    await new Promise(r => setTimeout(r, 3000));
  }

  await browser.close();
}

debug().catch(e => console.error(e));
