const name = 'plombier';
const city = 'Lyon';

async function test() {
  const url = 'https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=' + encodeURIComponent(name) + '&ou=' + encodeURIComponent(city);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9',
    }
  });
  console.log('Status:', res.status);
  const html = await res.text();
  console.log('Size:', html.length);
  console.log('DataDome:', html.includes('datadome') || html.includes('DataDome'));

  // Extract 06/07 numbers
  const mobileRe = /(0[67])[\s.]?(\d{2})[\s.]?(\d{2})[\s.]?(\d{2})[\s.]?(\d{2})/g;
  const phones = new Set();
  let m;
  while ((m = mobileRe.exec(html)) !== null) {
    const num = m[0].replace(/[\s.]/g, '');
    if (/^0[67]\d{8}$/.test(num)) phones.add(num);
  }
  console.log('Portables trouves:', phones.size);
  if (phones.size > 0) console.log('Exemples:', [...phones].slice(0, 5));

  // Also check tel: links
  const telLinks = html.match(/href="tel:([^"]+)"/g) || [];
  console.log('tel: links:', telLinks.length);
}

test().catch(e => console.error(e.message));
