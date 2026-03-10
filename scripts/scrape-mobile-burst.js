/**
 * SCRAPE PORTABLES — Burst mode PagesJaunes
 *
 * Strategie: rafales de ~150 artisans puis relance navigateur (nouveaux cookies).
 * DataDome met ~200 requetes avant de bloquer, on reste en dessous.
 * Entre chaque rafale: pause longue + nouveau contexte navigateur.
 *
 * Usage:
 *   node scripts/scrape-mobile-burst.js                # Lancer
 *   node scripts/scrape-mobile-burst.js --resume       # Reprendre
 *   node scripts/scrape-mobile-burst.js --dept 13      # Un dept
 *   node scripts/scrape-mobile-burst.js --test         # 1 rafale
 */

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BURST_SIZE = 120;         // Artisans par rafale (reste sous le seuil DataDome ~200)
const WORKERS_PER_BURST = 5;    // Onglets par rafale
const MIN_DELAY = 2000;
const MAX_DELAY = 5000;
const PAUSE_BETWEEN_BURSTS = 15000; // 15s entre rafales
const PAGE_TIMEOUT = 15000;
const BATCH_SIZE = 500;

const DATA_DIR = path.join(__dirname, '.pw-data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const PROGRESS_FILE = path.join(DATA_DIR, 'progress-burst.json');

const DEPARTEMENTS = [
  '01','02','03','04','05','06','07','08','09','10',
  '11','12','13','14','15','16','17','18','19','2A',
  '2B','21','22','23','24','25','26','27','28','29',
  '30','31','32','33','34','35','36','37','38','39',
  '40','41','42','43','44','45','46','47','48','49',
  '50','51','52','53','54','55','56','57','58','59',
  '60','61','62','63','64','65','66','67','68','69',
  '70','71','72','73','74','75','76','77','78','79',
  '80','81','82','83','84','85','86','87','88','89',
  '90','91','92','93','94','95',
];

let shuttingDown = false;
const startTime = Date.now();
const existingPhones = new Set();
const sessionPhones = new Set();
const processedIds = new Set();
const completedDepts = new Set();

const stats = {
  searched: 0,
  found: 0,
  updated: 0,
  dedups: 0,
  blocked: 0,
  errors: 0,
  bursts: 0,
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function randDelay() { return MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY); }
function fmt(n) { return n.toLocaleString('fr-FR'); }
function elapsed() {
  const s = Math.floor((Date.now() - startTime) / 1000);
  const m = Math.floor(s / 60); const h = Math.floor(m / 60);
  return h > 0 ? h + 'h' + String(m % 60).padStart(2, '0') + 'm' : m + 'm' + String(s % 60).padStart(2, '0') + 's';
}

function normalizeMobile(raw) {
  if (!raw) return null;
  let c = raw.replace(/[^\d+]/g, '');
  if (c.startsWith('+33')) c = '0' + c.substring(3);
  if (c.startsWith('0033')) c = '0' + c.substring(4);
  if (!/^0[67]\d{8}$/.test(c)) return null;
  return c;
}

function isPhoneSafe(phone) {
  return !existingPhones.has(phone) && !sessionPhones.has(phone);
}
function markPhoneUsed(phone) {
  sessionPhones.add(phone);
  existingPhones.add(phone);
}

function saveProgress() {
  const ids = Array.from(processedIds);
  const recent = ids.length > 200000 ? ids.slice(-200000) : ids;
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    completedDepts: Array.from(completedDepts),
    processedIds: recent,
    stats,
    lastSave: new Date().toISOString(),
  }));
}

function loadProgress() {
  if (!fs.existsSync(PROGRESS_FILE)) return false;
  try {
    const d = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    (d.completedDepts || []).forEach(x => completedDepts.add(x));
    (d.processedIds || []).forEach(x => processedIds.add(x));
    if (d.stats) Object.assign(stats, d.stats);
    return true;
  } catch { return false; }
}

async function searchPJ(page, name, location) {
  const cleanName = name
    .replace(/\b(SARL|SAS|SA|EURL|SASU|EIRL|EI|SCI|SNC|SCOP)\b/gi, '')
    .replace(/\([^)]*\)/g, '').trim();

  const url = 'https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=' +
    encodeURIComponent(cleanName) + '&ou=' + encodeURIComponent(location);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT });
    await sleep(1500 + Math.random() * 1500);

    const content = await page.content();

    // Check for DataDome block (small page = challenge)
    if (content.length < 15000) {
      const title = await page.title();
      if (title.includes('instant') || content.includes('datadome') || content.includes('captcha')) {
        stats.blocked++;
        return { mobiles: [], blocked: true };
      }
    }

    const mobiles = [];
    const seen = new Set();
    let m;

    // tel: links
    const telRe = /href="tel:([^"]+)"/g;
    while ((m = telRe.exec(content)) !== null) {
      const mobile = normalizeMobile(m[1]);
      if (mobile && !seen.has(mobile)) { seen.add(mobile); mobiles.push(mobile); }
    }

    // Mobile patterns in raw HTML
    const mobileRe = /(?:0[67])[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g;
    while ((m = mobileRe.exec(content)) !== null) {
      const mobile = normalizeMobile(m[0]);
      if (mobile && !seen.has(mobile)) { seen.add(mobile); mobiles.push(mobile); }
    }

    // +33 format
    const intlRe = /\+33[\s.]?[67][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g;
    while ((m = intlRe.exec(content)) !== null) {
      const mobile = normalizeMobile(m[0]);
      if (mobile && !seen.has(mobile)) { seen.add(mobile); mobiles.push(mobile); }
    }

    return { mobiles, blocked: false };
  } catch (err) {
    stats.errors++;
    return { mobiles: [], blocked: false };
  }
}

async function workerFn(workerId, page, queue, supabase) {
  let blockedCount = 0;

  while (!shuttingDown) {
    const artisan = queue.shift();
    if (!artisan) break;

    if (processedIds.has(artisan.id)) continue;
    processedIds.add(artisan.id);
    stats.searched++;

    const location = artisan.address_city || 'France';
    const result = await searchPJ(page, artisan.name, location);

    if (result.blocked) {
      blockedCount++;
      // If this worker hits 3 blocks, stop (DataDome detected us)
      if (blockedCount >= 3) {
        // Put artisan back
        queue.unshift(artisan);
        processedIds.delete(artisan.id);
        stats.searched--;
        break;
      }
      await sleep(5000 + Math.random() * 5000);
      continue;
    }

    blockedCount = 0; // Reset on success

    if (result.mobiles.length > 0) {
      for (const mobile of result.mobiles) {
        if (isPhoneSafe(mobile)) {
          const { error } = await supabase
            .from('providers')
            .update({ phone: mobile })
            .eq('id', artisan.id);
          if (!error) {
            markPhoneUsed(mobile);
            stats.found++;
            stats.updated++;
            break;
          }
        } else {
          stats.dedups++;
        }
      }
    }

    // Status
    if (stats.searched % 10 === 0) {
      const rate = stats.searched > 0 ? Math.round(stats.searched / ((Date.now() - startTime) / 3600000)) : 0;
      process.stdout.write(
        '  [' + fmt(stats.searched) + '] +' + fmt(stats.found) + ' portables | ' +
        fmt(stats.dedups) + ' dedups | ' + rate + '/h | ' +
        'B:' + stats.blocked + ' E:' + stats.errors + ' | rafales:' + stats.bursts + ' | ' + elapsed() + '    \r'
      );
    }

    await sleep(randDelay());
  }
}

async function runBurst(queue, supabase) {
  stats.bursts++;

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

  // Take a slice of the queue for this burst
  const burstQueue = queue.splice(0, BURST_SIZE);

  const pages = [];
  for (let i = 0; i < WORKERS_PER_BURST; i++) {
    pages.push(await context.newPage());
  }

  const workers = [];
  for (let i = 0; i < WORKERS_PER_BURST; i++) {
    workers.push(workerFn(i, pages[i], burstQueue, supabase));
  }
  await Promise.all(workers);

  // Put unprocessed items back in queue
  if (burstQueue.length > 0) {
    queue.unshift(...burstQueue);
  }

  await browser.close();
}

async function main() {
  const args = process.argv.slice(2);
  const resume = args.includes('--resume');
  const test = args.includes('--test');
  const deptArg = args.includes('--dept') ? args[args.indexOf('--dept') + 1] : null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('\n' + '='.repeat(60));
  console.log('  SCRAPE PORTABLES — Burst PJ (0 credit API)');
  console.log('='.repeat(60));
  console.log('  Mode: Rafales de ' + BURST_SIZE + ' artisans');
  console.log('  Workers/rafale:', WORKERS_PER_BURST);
  console.log('  Pause entre rafales:', (PAUSE_BETWEEN_BURSTS/1000) + 's');
  console.log('  Source: PagesJaunes (navigateur headless)');
  console.log('  Filtre: UNIQUEMENT 06/07\n');

  // Load existing phones
  console.log('  Chargement phones existants...');
  let from = 0;
  const LOAD_BATCH = 1000;
  while (true) {
    const { data, error } = await supabase.from('providers')
      .select('phone').not('phone', 'is', null)
      .range(from, from + LOAD_BATCH - 1);
    if (error) { console.log('  Err:', error.message); break; }
    if (!data || data.length === 0) break;
    data.forEach(d => { if (d.phone) existingPhones.add(d.phone); });
    from += LOAD_BATCH;
    if (from % 10000 === 0) process.stdout.write('  ' + fmt(existingPhones.size) + ' phones charges...\r');
    if (data.length < LOAD_BATCH) break;
  }
  console.log('  ' + fmt(existingPhones.size) + ' phones en base       ');

  if (resume) {
    const ok = loadProgress();
    if (ok) console.log('  Reprise: ' + fmt(processedIds.size) + ' traites, ' + completedDepts.size + ' depts');
  }

  process.on('SIGINT', () => {
    if (shuttingDown) { saveProgress(); process.exit(1); }
    console.log('\n  Arret gracieux...');
    shuttingDown = true;
  });

  const depts = deptArg ? [deptArg] : DEPARTEMENTS;

  for (const dept of depts) {
    if (shuttingDown) break;
    if (completedDepts.has(dept)) continue;

    console.log('\n-- Dept ' + dept + ' --');

    let allArtisans = [];
    let offset = 0;
    while (true) {
      const { data, error } = await supabase.from('providers')
        .select('id, name, address_city')
        .is('phone', null).eq('is_active', true).eq('is_artisan', true)
        .eq('address_department', dept)
        .not('name', 'is', null)
        .order('id', { ascending: true })
        .range(offset, offset + BATCH_SIZE - 1);
      if (error || !data || data.length === 0) break;
      allArtisans.push(...data);
      offset += BATCH_SIZE;
      if (data.length < BATCH_SIZE) break;
    }

    const queue = allArtisans.filter(a => !processedIds.has(a.id) && a.name && a.name.length >= 3);
    console.log('  ' + fmt(queue.length) + ' artisans a traiter');

    if (test) queue.splice(BURST_SIZE); // 1 burst only

    // Run bursts until queue is empty
    while (queue.length > 0 && !shuttingDown) {
      const beforeFound = stats.found;
      await runBurst(queue, supabase);
      const burstFound = stats.found - beforeFound;
      console.log('\n  Rafale ' + stats.bursts + ' terminee: +' + burstFound + ' portables | reste: ' + queue.length);
      saveProgress();

      if (queue.length > 0 && !shuttingDown) {
        const pause = PAUSE_BETWEEN_BURSTS + Math.random() * 10000;
        console.log('  Pause ' + Math.round(pause/1000) + 's avant prochaine rafale...');
        await sleep(pause);
      }
    }

    if (!shuttingDown && !test) {
      completedDepts.add(dept);
      saveProgress();
    }
  }

  saveProgress();

  console.log('\n\n' + '='.repeat(60));
  console.log('  RESULTAT — Burst PJ scraper');
  console.log('='.repeat(60));
  console.log('  Duree:        ' + elapsed());
  console.log('  Rafales:      ' + stats.bursts);
  console.log('  Traites:      ' + fmt(stats.searched));
  console.log('  Portables:    +' + fmt(stats.found));
  console.log('  Dedups:       ' + fmt(stats.dedups));
  console.log('  Bloques:      ' + stats.blocked);
  console.log('  Erreurs:      ' + stats.errors);
  console.log('  Cout:         0€');
  console.log('='.repeat(60) + '\n');
}

main().then(() => process.exit(0)).catch(e => { console.error('Fatal:', e); process.exit(1); });
