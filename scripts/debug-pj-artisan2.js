const { chromium } = require('playwright');

async function debug() {
  const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'fr-FR',
  });
  const page = await context.newPage();

  const tests = [
    { name: 'plombier', city: 'Lyon' },
    { name: 'FURKAN OZGUL', city: 'Ambérieu-en-Bugey' },
    { name: 'AFVR PLOMBERIE', city: 'Saint-André-de-Corcy' },
    { name: 'DOORTAL SERVICE', city: 'Miribel' },
  ];

  for (const t of tests) {
    const url = 'https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=' + encodeURIComponent(t.name) + '&ou=' + encodeURIComponent(t.city);
    console.log('\n=== ' + t.name + ' / ' + t.city + ' ===');

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Wait for actual content
    try {
      await page.waitForSelector('.bi-ligne, .noResults, #listResults, .pagination', { timeout: 10000 });
      console.log('  Content loaded via selector');
    } catch {
      console.log('  Selector timeout, waiting 3s fallback');
      await new Promise(r => setTimeout(r, 3000));
    }

    const content = await page.content();
    const title = await page.title();
    console.log('  Title:', title.substring(0, 60));
    console.log('  Size:', content.length);

    const mobileRe = /0[67][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g;
    const mobiles = content.match(mobileRe) || [];
    const unique = [...new Set(mobiles.map(m => m.replace(/[\s.]/g, '')))];
    console.log('  Mobiles:', unique.length, unique.slice(0, 3));

    const allPhones = /0[1-9][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g;
    const phones = content.match(allPhones) || [];
    console.log('  All phones:', phones.length);

    console.log('  Has "aucun resultat":', content.includes('Aucun professionnel') || content.includes('aucun résultat'));

    await new Promise(r => setTimeout(r, 2000));
  }

  await browser.close();
}

debug().catch(e => console.error(e));
