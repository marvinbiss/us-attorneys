/**
 * SCRAPE PORTABLES via Playwright — Google Search, 0 credit API
 *
 * Navigateur headless qui cherche sur Google.
 * Filtre strict 06/07. Anti-dedup. Progress save.
 *
 * Usage:
 *   node scripts/scrape-mobile-playwright.js              # Lancer
 *   node scripts/scrape-mobile-playwright.js --resume      # Reprendre
 *   node scripts/scrape-mobile-playwright.js --workers 3   # 3 onglets
 *   node scripts/scrape-mobile-playwright.js --dept 13     # Un dept
 *   node scripts/scrape-mobile-playwright.js --test        # 20 artisans
 */

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEFAULT_WORKERS = 3;
const MIN_DELAY = 5000;
const MAX_DELAY = 12000;
const PAGE_TIMEOUT = 15000;
const BATCH_SIZE = 500;

const DATA_DIR = path.join(__dirname, '.pw-data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const PROGRESS_FILE = path.join(DATA_DIR, 'progress-google.json');

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
// Track "noise" phones that appear too often (Google ads)
const phoneFrequency = new Map();
const NOISE_THRESHOLD = 5;

const stats = {
  searched: 0,
  found: 0,
  updated: 0,
  dedups: 0,
  blocked: 0,
  errors: 0,
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

function isNoise(phone) {
  const count = phoneFrequency.get(phone) || 0;
  phoneFrequency.set(phone, count + 1);
  return count >= NOISE_THRESHOLD;
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

async function searchGoogle(page, name, location) {
  const cleanName = name
    .replace(/\b(SARL|SAS|SA|EURL|SASU|EIRL|EI|SCI|SNC|SCOP)\b/gi, '')
    .replace(/\([^)]*\)/g, '').trim();

  const query = '"' + cleanName + '" ' + location + ' telephone';
  const url = 'https://www.google.fr/search?q=' + encodeURIComponent(query) + '&hl=fr&gl=fr&num=5';

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT });
    await sleep(800 + Math.random() * 500);

    const content = await page.content();

    // Check for captcha/block
    if (content.includes('unusual traffic') || content.includes('captcha') || content.includes('/sorry/')) {
      stats.blocked++;
      // Long pause on block
      await sleep(30000 + Math.random() * 30000);
      return [];
    }

    const mobiles = [];
    const seen = new Set();
    let m;

    // 1) tel: links (most reliable)
    const telRe = /href="tel:([^"]+)"/g;
    while ((m = telRe.exec(content)) !== null) {
      const mobile = normalizeMobile(m[1]);
      if (mobile && !seen.has(mobile)) { seen.add(mobile); mobiles.push(mobile); }
    }

    // 2) +33 6/7 format
    const intlRe = /\+33[\s.]?[67][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g;
    while ((m = intlRe.exec(content)) !== null) {
      const mobile = normalizeMobile(m[0]);
      if (mobile && !seen.has(mobile)) { seen.add(mobile); mobiles.push(mobile); }
    }

    // 3) 06/07 patterns in visible text (not HTML tags to avoid noise)
    const text = await page.evaluate(() => document.body.innerText || '');
    const mobileRe = /(?:0[67])[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g;
    while ((m = mobileRe.exec(text)) !== null) {
      const mobile = normalizeMobile(m[0]);
      if (mobile && !seen.has(mobile)) { seen.add(mobile); mobiles.push(mobile); }
    }

    // Filter noise phones (appear on every Google page = ads)
    return mobiles.filter(p => !isNoise(p));
  } catch (err) {
    stats.errors++;
    return [];
  }
}

async function worker(workerId, page, queue, supabase) {
  while (!shuttingDown) {
    const artisan = queue.shift();
    if (!artisan) break;

    if (processedIds.has(artisan.id)) continue;
    processedIds.add(artisan.id);
    stats.searched++;

    const location = artisan.address_city || 'France';
    const mobiles = await searchGoogle(page, artisan.name, location);

    if (mobiles.length > 0) {
      for (const mobile of mobiles) {
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
        'B:' + stats.blocked + ' E:' + stats.errors + ' | ' + elapsed() + '    \r'
      );
    }
    if (stats.searched % 100 === 0) saveProgress();

    await sleep(randDelay());
  }
}

async function main() {
  const args = process.argv.slice(2);
  const numWorkers = args.includes('--workers') ? parseInt(args[args.indexOf('--workers') + 1]) : DEFAULT_WORKERS;
  const resume = args.includes('--resume');
  const test = args.includes('--test');
  const deptArg = args.includes('--dept') ? args[args.indexOf('--dept') + 1] : null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('\n' + '='.repeat(60));
  console.log('  SCRAPE PORTABLES — Google Playwright (0 credit API)');
  console.log('='.repeat(60));
  console.log('  Workers (onglets):', numWorkers);
  console.log('  Source: Google Search (navigateur headless)');
  console.log('  Delai: ' + (MIN_DELAY/1000) + '-' + (MAX_DELAY/1000) + 's entre requetes');
  console.log('  Filtre: UNIQUEMENT 06/07\n');

  // Load existing phones
  console.log('  Chargement phones existants...');
  let from = 0;
  const LOAD_BATCH = 1000;
  while (true) {
    const { data, error } = await supabase.from('providers')
      .select('phone').not('phone', 'is', null)
      .range(from, from + LOAD_BATCH - 1);
    if (error) { console.log('  Err load phones:', error.message); break; }
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

  // Launch browser
  console.log('  Lancement navigateur...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'fr-FR',
    viewport: { width: 1280, height: 720 },
  });
  // Anti-detection
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  // Create pages (tabs)
  const pages = [];
  for (let i = 0; i < numWorkers; i++) {
    pages.push(await context.newPage());
  }

  // Dismiss Google cookies on each page
  for (const p of pages) {
    try {
      await p.goto('https://www.google.fr', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await sleep(1000);
      const btn = p.locator('button:has-text("Tout accepter"), button:has-text("Accept all")');
      await btn.first().click({ timeout: 3000 });
      await sleep(500);
    } catch { /* no cookie banner */ }
  }
  console.log('  Cookies Google acceptes');

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

    // Load artisans without phone
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

    if (test) queue.splice(20);

    // Launch workers
    const workers = [];
    for (let i = 0; i < numWorkers; i++) {
      workers.push(worker(i, pages[i], queue, supabase));
    }
    await Promise.all(workers);

    if (!shuttingDown && !test) {
      completedDepts.add(dept);
      saveProgress();
    }
  }

  saveProgress();
  await browser.close();

  console.log('\n\n' + '='.repeat(60));
  console.log('  RESULTAT — Google Playwright scraper');
  console.log('='.repeat(60));
  console.log('  Duree:        ' + elapsed());
  console.log('  Traites:      ' + fmt(stats.searched));
  console.log('  Portables:    +' + fmt(stats.found));
  console.log('  Dedups:       ' + fmt(stats.dedups));
  console.log('  Bloques:      ' + stats.blocked);
  console.log('  Erreurs:      ' + stats.errors);
  console.log('  Cout:         0€');
  console.log('='.repeat(60) + '\n');
}

main().then(() => process.exit(0)).catch(e => { console.error('Fatal:', e); process.exit(1); });
