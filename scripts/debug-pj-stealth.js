const { chromium } = require('playwright');

async function debug() {
  // Try with more stealth options
  const browser = await chromium.launch({
    headless: false, // Try with visible browser
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox',
    ],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'fr-FR',
    viewport: { width: 1280, height: 720 },
    javaScriptEnabled: true,
  });

  // Remove webdriver property
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    // Override plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    // Override languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['fr-FR', 'fr', 'en-US', 'en'],
    });
    // Chrome runtime
    window.chrome = { runtime: {} };
    // Permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters);
  });

  const page = await context.newPage();

  const url = 'https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=plombier&ou=Lyon';
  console.log('Navigating to:', url);

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('After networkidle');

  const title = await page.title();
  console.log('Title:', title);

  const content = await page.content();
  console.log('Size:', content.length);

  const mobileRe = /0[67][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/g;
  const mobiles = content.match(mobileRe) || [];
  console.log('Mobiles:', mobiles.length);

  // Save HTML for inspection
  const fs = require('fs');
  fs.writeFileSync('scripts/.pw-data/debug-page.html', content);
  console.log('HTML saved to .pw-data/debug-page.html');

  await page.screenshot({ path: 'scripts/.pw-data/debug-stealth.png', fullPage: true });
  console.log('Screenshot saved');

  // Wait more and check again
  await new Promise(r => setTimeout(r, 10000));
  const content2 = await page.content();
  const title2 = await page.title();
  console.log('After 10s wait - Title:', title2, 'Size:', content2.length);
  const mobiles2 = content2.match(mobileRe) || [];
  console.log('Mobiles after wait:', mobiles2.length);

  await browser.close();
}

debug().catch(e => console.error(e));
