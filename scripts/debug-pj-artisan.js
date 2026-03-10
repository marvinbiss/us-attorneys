const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function debug() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Get some artisans without phone from dept 01
  const { data: artisans } = await supabase.from('providers')
    .select('id, name, address_city')
    .is('phone', null).eq('is_active', true).eq('is_artisan', true)
    .eq('address_department', '01')
    .not('name', 'is', null)
    .order('id', { ascending: true })
    .range(200, 205);

  console.log('Artisans to test:', artisans.map(a => a.name + ' / ' + a.address_city));

  const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'fr-FR',
  });
  const page = await context.newPage();

  for (const a of artisans) {
    const cleanName = a.name
      .replace(/\b(SARL|SAS|SA|EURL|SASU|EIRL|EI|SCI|SNC|SCOP)\b/gi, '')
      .replace(/\([^)]*\)/g, '').trim();
    const location = a.address_city || 'France';
    const url = 'https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=' + encodeURIComponent(cleanName) + '&ou=' + encodeURIComponent(location);

    console.log('\n=== ' + cleanName + ' / ' + location + ' ===');
    console.log('URL:', url);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));

    const content = await page.content();
    console.log('Page size:', content.length);
    console.log('Has datadome:', content.includes('datadome') || content.includes('DataDome'));
    console.log('Has captcha:', content.includes('captcha'));
    console.log('Has "aucun resultat":', content.includes('aucun résultat') || content.includes('Aucun résultat') || content.includes('pas de résultat'));

    // Count results
    const nbResults = (content.match(/class="[^"]*bi-ligne[^"]*"/g) || []).length;
    console.log('Nb result cards:', nbResults);

    // Phone patterns
    const mobileRe = /0[67][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g;
    const mobiles = content.match(mobileRe) || [];
    console.log('Mobiles in HTML:', mobiles.length, mobiles.length > 0 ? [...new Set(mobiles.map(m => m.replace(/[\s.]/g, '')))].slice(0, 3) : '');

    // All phone patterns (including fixed)
    const allPhones = /0[1-9][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g;
    const phones = content.match(allPhones) || [];
    console.log('All phones in HTML:', phones.length);

    // Check if page is a redirect or empty
    const title = await page.title();
    console.log('Title:', title.substring(0, 80));

    await new Promise(r => setTimeout(r, 1000));
  }

  await browser.close();
}

debug().catch(e => console.error(e));
