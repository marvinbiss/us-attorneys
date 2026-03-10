// Test multiple free sources with real artisan SIRETs
const testCases = [
  { name: 'AMG', siret: '49913755200018', city: 'Nîmes', knownPhone: '0699028068' },
  { name: 'ENTREPRISE VILLETTE', siret: '34145072400016', city: 'Bû', knownPhone: '0667298330' },
  { name: 'CHANUC PEINTURE', siret: '49362047000028', city: 'Toulouse', knownPhone: '0675878111' },
];

async function testSociete(siren, name) {
  // societe.com by name search
  const url = 'https://www.societe.com/cgi-bin/search?champs=' + encodeURIComponent(siren);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0', 'Accept-Language': 'fr-FR' },
    redirect: 'follow'
  });
  const html = await res.text();
  const telLinks = (html.match(/href="tel:([^"]+)"/g) || []).map(m => m.match(/tel:([^"]+)/)[1]);
  const mobiles = (html.match(/0[67][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g) || [])
    .map(p => p.replace(/[\s.]/g, '')).filter(p => /^0[67]\d{8}$/.test(p));
  return { status: res.status, size: html.length, telLinks, mobiles, blocked: html.includes('captcha') || html.includes('robot') };
}

async function testInfogreffe(siren) {
  const url = 'https://www.infogreffe.fr/entreprise/' + siren;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' }
  });
  const html = await res.text();
  const mobiles = (html.match(/0[67][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g) || [])
    .map(p => p.replace(/[\s.]/g, '')).filter(p => /^0[67]\d{8}$/.test(p));
  return { status: res.status, size: html.length, mobiles, blocked: html.includes('captcha') };
}

async function testGoogleDirect(name, city) {
  const query = '"' + name + '" ' + city + ' telephone portable';
  const url = 'https://www.google.fr/search?q=' + encodeURIComponent(query) + '&hl=fr&num=5';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' }
  });
  const html = await res.text();
  const mobiles = (html.match(/0[67][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g) || [])
    .map(p => p.replace(/[\s.]/g, '')).filter(p => /^0[67]\d{8}$/.test(p));
  return { status: res.status, size: html.length, mobiles: [...new Set(mobiles)], blocked: html.includes('captcha') || res.status === 429 };
}

async function main() {
  for (const tc of testCases) {
    const siren = tc.siret.substring(0, 9);
    console.log('\n=== ' + tc.name + ' (SIREN: ' + siren + ', attendu: ' + tc.knownPhone + ') ===');

    console.log('\n  [societe.com]');
    const s = await testSociete(siren, tc.name);
    console.log('  Status:', s.status, '| Size:', s.size, '| Blocked:', s.blocked, '| Mobiles:', s.mobiles);

    console.log('\n  [Google direct]');
    const g = await testGoogleDirect(tc.name, tc.city);
    console.log('  Status:', g.status, '| Size:', g.size, '| Blocked:', g.blocked, '| Mobiles:', g.mobiles);

    console.log('\n  [Infogreffe]');
    const ig = await testInfogreffe(siren);
    console.log('  Status:', ig.status, '| Size:', ig.size, '| Blocked:', ig.blocked, '| Mobiles:', ig.mobiles);

    await new Promise(r => setTimeout(r, 2000));
  }
}

main().catch(e => console.error(e));
