const url = process.argv[2];
const key = process.argv[3];

async function count(filter) {
  const r = await fetch(`${url}/rest/v1/providers?select=id&${filter}&limit=1`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Prefer': 'count=exact' }
  });
  await r.json();
  const range = r.headers.get('content-range');
  return range ? parseInt(range.split('/')[1]) : 0;
}

async function sample(filter, n) {
  const r = await fetch(`${url}/rest/v1/providers?select=name,specialty,code_naf&${filter}&limit=${n}`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  return await r.json();
}

const TRADE_PATTERNS = {
  'plombier': ['plomber', 'plombier', 'plomberie', 'canalisation', 'assainissement', 'vidange'],
  'electricien': ['electri', 'cablage'],
  'serrurier': ['serrurier', 'serrurerie', 'blindage'],
  'chauffagiste': ['chauffag', 'chaudiere', 'radiateur', 'plancher chauffant'],
  'climaticien': ['climatisation', 'climatiseur', 'frigorist', 'froid', 'ventilation', 'cvc'],
  'peintre-en-batiment': ['peinture', 'peintre', 'tapisserie', 'papier peint'],
  'menuisier': ['menuiser', 'ebenist', 'boiserie'],
  'carreleur': ['carrelage', 'carreleur', 'faience', 'mosaique', 'ceramique'],
  'couvreur': ['couverture bati', 'couvreur', 'toiture', 'ardoise', 'tuile'],
  'macon': ['macon', 'maconnerie', 'gros oeuvre', 'beton', 'fondation'],
  'charpentier': ['charpent', 'ossature bois', 'construction bois'],
  'cuisiniste': ['cuisine amenag', 'cuisiniste', 'agencement cuisine', 'dressing'],
  'vitrier': ['vitrier', 'vitrerie', 'vitrage', 'double vitrage'],
  'storiste': ['store', 'volet roulant', 'fermeture', 'pergola', 'brise soleil', 'protection solaire'],
  'pisciniste': ['piscine', 'pisciniste', 'bassin', 'spa', 'jacuzzi'],
  'domoticien': ['domotique', 'smart home', 'maison connect', 'knx'],
  'alarme-securite': ['alarme', 'videosurveillance', 'telesurveillance', 'detection intrusion', 'interphone', 'digicode'],
  'antenniste': ['antenne', 'satellite', 'parabole', 'fibre optique'],
  'diagnostiqueur': ['diagnostic immobilier', 'diagnosti', 'amiante', 'dpe'],
  'geometre': ['geometre', 'topograph', 'arpentage', 'bornage', 'foncier'],
  'demenageur': ['demenag', 'garde meuble', 'stockage meuble'],
  'ramoneur': ['ramonage', 'ramoneur', 'cheminee', 'fumisterie'],
  'zingueur': ['zinguerie', 'gouttiere', 'cheneau'],
  'ferronnier': ['ferronnerie', 'ferronnier', 'fer forge', 'forgeron'],
  'facadier': ['facade', 'ravalement', 'enduit', 'crepis', 'isolation exterieure'],
  'etancheiste': ['etanchei', 'impermeabilis', 'membrane'],
  'metallier': ['metallier', 'metalleri', 'chaudronneri', 'soudure', 'soudeur', 'construction metallique'],
  'pompe-a-chaleur': ['pompe a chaleur', 'geotherm', 'aerotherm', 'thermodynamique'],
  'panneaux-solaires': ['solaire', 'photovoltai', 'energie renouvelable'],
  'isolation-thermique': ['isolation thermique', 'isolant', 'laine de verre', 'laine de roche', 'ouate', 'polystyrene'],
  'renovation-energetique': ['renovation energetique', 'audit energetique', 'bilan thermique', 'transition energetique'],
  'borne-recharge': ['borne recharge', 'irve', 'vehicule electrique'],
  'poseur-de-parquet': ['parquet', 'parqueteur', 'plancher bois', 'stratifie'],
  'miroitier': ['miroiterie', 'miroitier'],
  'ascensoriste': ['ascenseur', 'ascensoriste', 'monte-charge', 'elevateur'],
  'desinsectisation': ['desinsect', 'insecte', 'termite', 'cafard', 'punaise', 'frelon', 'moustique'],
  'deratisation': ['deratisation', 'rongeur', 'nuisible'],
  'nettoyage': ['nettoyage', 'proprete', 'menage'],
  'salle-de-bain': ['salle de bain', 'douche italienne', 'baignoire'],
  'paysagiste': ['paysagist', 'paysager', 'landscape', 'amenagement exterieur'],
  'jardinier': ['jardin', 'elagage', 'espaces verts', 'espace vert', 'tonte', 'pelouse', 'gazon', 'debroussaillage', 'arboriste', 'abattage arbre'],
  'solier': ['sol souple', 'moquette', 'revetement sol', 'linoleum', 'lino', 'vinyle'],
  'platrier': ['platrier', 'platrerie', 'placo', 'placoplatre', 'cloison seche', 'faux plafond', 'staff'],
};

async function run() {
  console.log('MEGA AUDIT — Analyse croisee nom x specialty x NAF');
  console.log('='.repeat(100));

  const allIssues = [];

  for (const [targetTrade, keywords] of Object.entries(TRADE_PATTERNS)) {
    for (const kw of keywords) {
      try {
        const total = await count(`specialty=neq.${encodeURIComponent(targetTrade)}&name=ilike.*${encodeURIComponent(kw)}*&specialty=not.is.null`);
        if (total > 5) {
          const samples = await sample(`specialty=neq.${encodeURIComponent(targetTrade)}&name=ilike.*${encodeURIComponent(kw)}*&specialty=not.is.null`, 30);
          const bySpec = {};
          for (const s of samples) {
            bySpec[s.specialty] = (bySpec[s.specialty] || 0) + 1;
          }
          const topSpec = Object.entries(bySpec).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([s,c]) => `${s}(${c})`).join(', ');
          allIssues.push({ target: targetTrade, keyword: kw, count: total, sources: topSpec });
        }
      } catch (e) {
        // skip on API error
      }
    }
  }

  allIssues.sort((a, b) => b.count - a.count);

  console.log('\nProviders potentiellement mal classes (> 5 occurrences):\n');
  console.log(`${'Target'.padEnd(25)}${'Mot-cle'.padEnd(25)}${'Count'.padStart(6)}  Sources`);
  console.log('-'.repeat(100));

  for (const i of allIssues.slice(0, 80)) {
    console.log(`> ${i.target.padEnd(23)}${i.keyword.padEnd(25)}${String(i.count).padStart(6)}  ${i.sources}`);
  }

  console.log('\n' + '-'.repeat(100));
  console.log(`Total distinct issues: ${allIssues.length}`);

  // Check unknown NAF codes
  console.log('\n\n=== Codes NAF non mappes ===');
  const allNaf = [];
  let lastNaf = '';
  while (true) {
    const gte = lastNaf ? `&code_naf=gt.${encodeURIComponent(lastNaf)}` : '';
    const r = await fetch(`${url}/rest/v1/providers?select=code_naf&code_naf=not.is.null${gte}&order=code_naf&limit=1`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const data = await r.json();
    if (data.length === 0) break;
    lastNaf = data[0].code_naf;
    allNaf.push(lastNaf);
  }

  const knownNaf = new Set([
    '43.21A','43.21B','43.22A','43.22B','43.29A','43.29B','43.31Z','43.32A','43.32B','43.32C',
    '43.33Z','43.34Z','43.39Z','43.12A','43.12B','43.91A','43.91B','43.99A','43.99C',
    '25.11Z','31.02Z','49.42Z','71.11Z','71.12B','71.20B','74.10Z',
    '81.21Z','81.22Z','81.29A','81.29B','81.30Z'
  ]);

  for (const naf of allNaf) {
    if (!knownNaf.has(naf)) {
      const c = await count(`code_naf=eq.${encodeURIComponent(naf)}`);
      const s = await sample(`code_naf=eq.${encodeURIComponent(naf)}`, 3);
      const names = s.map(x => x.name).join(' | ');
      console.log(`  ${naf} -> ${c} providers (spec: ${s[0]?.specialty || 'NULL'}) ex: ${names}`);
    }
  }
}

run().catch(e => console.error(e));
