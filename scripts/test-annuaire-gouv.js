// Test API annuaire-entreprises.data.gouv.fr
// + API recherche-entreprises.api.gouv.fr
// + API entreprise.data.gouv.fr (SIRENE)

async function test() {
  const testSirets = ['44306184100047', '82345678901234'];

  // 1) recherche-entreprises.api.gouv.fr
  console.log('=== recherche-entreprises.api.gouv.fr ===');
  try {
    const siret = testSirets[0];
    const url = 'https://recherche-entreprises.api.gouv.fr/search?q=' + siret;
    const res = await fetch(url);
    console.log('Status:', res.status);
    const data = await res.json();
    if (data.results && data.results[0]) {
      const r = data.results[0];
      console.log('Nom:', r.nom_complet);
      console.log('Siege:', JSON.stringify(r.siege, null, 2).substring(0, 500));
      console.log('Complements:', JSON.stringify(r.complements, null, 2));
      // Check all fields for phone
      const flat = JSON.stringify(r);
      const phoneMatch = flat.match(/0[67]\d{8}/g);
      console.log('Phones dans response:', phoneMatch);
    }
  } catch (e) { console.log('Err:', e.message); }

  // 2) annuaire-entreprises.data.gouv.fr (page HTML)
  console.log('\n=== annuaire-entreprises.data.gouv.fr ===');
  try {
    const siret = testSirets[0];
    const siren = siret.substring(0, 9);
    const url = 'https://annuaire-entreprises.data.gouv.fr/entreprise/' + siren;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' }
    });
    console.log('Status:', res.status);
    const html = await res.text();
    console.log('Size:', html.length);
    const phoneMatch = html.match(/0[67][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g);
    console.log('Phones dans page:', phoneMatch);
  } catch (e) { console.log('Err:', e.message); }

  // 3) Societe.com
  console.log('\n=== societe.com ===');
  try {
    const siret = testSirets[0];
    const siren = siret.substring(0, 9);
    const url = 'https://www.societe.com/societe/' + siren + '.html';
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' }
    });
    console.log('Status:', res.status);
    const html = await res.text();
    console.log('Size:', html.length);
    const phoneMatch = html.match(/0[67][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g);
    const telLinks = html.match(/href="tel:([^"]+)"/g) || [];
    console.log('Phones dans page:', phoneMatch);
    console.log('tel: links:', telLinks.length);
  } catch (e) { console.log('Err:', e.message); }
}

test().catch(e => console.error(e));
