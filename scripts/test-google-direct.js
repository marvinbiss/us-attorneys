// Test Google direct with different query strategies
const tests = [
  { name: 'AMG', city: 'Nîmes', siret: '49913755200018', expected: '0699028068' },
  { name: 'ENTREPRISE VILLETTE', city: 'Bû', siret: '34145072400016', expected: '0667298330' },
  { name: 'CHANUC PEINTURE', city: 'Toulouse', siret: '49362047000028', expected: '0675878111' },
  { name: 'FLORENT STEFFEN', city: 'Cluny', siret: '89433536300012', expected: '0676933969' },
];

function extractPhones(html) {
  const phones = new Set();
  // tel: links
  const telRe = /href="tel:([^"]+)"/g;
  let m;
  while ((m = telRe.exec(html)) !== null) {
    const num = m[1].replace(/[^\d+]/g, '').replace(/^\+33/, '0').replace(/^0033/, '0');
    if (/^0[67]\d{8}$/.test(num)) phones.add(num);
  }
  // data-phone-number
  const dpn = /data-phone-number="([^"]+)"/g;
  while ((m = dpn.exec(html)) !== null) {
    const num = m[1].replace(/[^\d+]/g, '').replace(/^\+33/, '0');
    if (/^0[67]\d{8}$/.test(num)) phones.add(num);
  }
  // Inline phone patterns
  const pr = /(?:0[67])[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g;
  while ((m = pr.exec(html)) !== null) {
    const num = m[0].replace(/[\s.]/g, '');
    if (/^0[67]\d{8}$/.test(num)) phones.add(num);
  }
  // +33 format
  const intl = /\+33[\s.]?[67][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g;
  while ((m = intl.exec(html)) !== null) {
    const num = m[0].replace(/[\s.]/g, '').replace(/^\+33/, '0');
    if (/^0[67]\d{8}$/.test(num)) phones.add(num);
  }
  return [...phones];
}

async function searchGoogle(query) {
  const url = 'https://www.google.fr/search?q=' + encodeURIComponent(query) + '&hl=fr&gl=fr&num=10';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'fr-FR,fr;q=0.9',
    }
  });
  return { status: res.status, html: await res.text() };
}

async function main() {
  for (const t of tests) {
    console.log('\n=== ' + t.name + ' (' + t.city + ') — attendu: ' + t.expected + ' ===');

    // Strategy 1: name + city + telephone
    const q1 = '"' + t.name + '" ' + t.city + ' telephone';
    const r1 = await searchGoogle(q1);
    const p1 = extractPhones(r1.html);
    console.log('  [name+city+tel]', r1.status, '→', p1.length ? p1 : 'rien', p1.includes(t.expected) ? '✓ MATCH' : '');

    await new Promise(r => setTimeout(r, 3000));

    // Strategy 2: SIRET + telephone
    const q2 = t.siret + ' telephone';
    const r2 = await searchGoogle(q2);
    const p2 = extractPhones(r2.html);
    console.log('  [siret+tel]    ', r2.status, '→', p2.length ? p2 : 'rien', p2.includes(t.expected) ? '✓ MATCH' : '');

    await new Promise(r => setTimeout(r, 3000));

    // Strategy 3: name + city + 06/07
    const q3 = t.name + ' ' + t.city + ' 06 OR 07';
    const r3 = await searchGoogle(q3);
    const p3 = extractPhones(r3.html);
    console.log('  [name+city+06] ', r3.status, '→', p3.length ? p3 : 'rien', p3.includes(t.expected) ? '✓ MATCH' : '');

    await new Promise(r => setTimeout(r, 3000));
  }
}

main().catch(e => console.error(e));
