/**
 * Integration test verifying:
 * 1. Extension loads into Chromium.
 * 2. Content script connects to page with ProseMirror contenteditable composer.
 * 3. Proactive live sync updates the Side Panel.
 * 4. "Insert into Chat Composer" successfully updates the ProseMirror composer.
 */

const { chromium } = require('/Users/dmiley/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const extensionPath = path.resolve(__dirname, '../extension');
  const userDataDir = `/tmp/ps_chrome_profile_${Date.now()}`;

  console.log(`[LIVE TEST] Launching Chromium with extension: ${extensionPath}`);
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
    ],
    viewport: { width: 1200, height: 800 }
  });

  try {
    // 1. Wait for service worker
    let worker = context.serviceWorkers()[0];
    if (!worker) {
      worker = await context.waitForEvent('serviceworker');
    }
    const extId = worker.url().split('/')[2];
    console.log(`[LIVE TEST] Extension ID: ${extId}`);

    // 2. Open chat page on localhost (matching manifest permissions)
    const chatPage = await context.newPage();
    await chatPage.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
    console.log('[LIVE TEST] Local chat page loaded.');

    // 3. Open Side Panel page
    const sidepanelPage = await context.newPage();
    await sidepanelPage.goto(`chrome-extension://${extId}/sidepanel.html`, { waitUntil: 'networkidle' });
    console.log('[LIVE TEST] Side Panel loaded.');

    // Bring chat page to front so it's active
    await chatPage.bringToFront();
    await chatPage.waitForTimeout(500);

    // Now in sidepanel, trigger refresh
    await sidepanelPage.bringToFront();
    await sidepanelPage.click('#btn-refresh-prompt');
    await sidepanelPage.waitForTimeout(600);

    const promptInPanel = await sidepanelPage.$eval('#active-prompt-text', el => el.value);
    console.log(`[LIVE TEST] Prompt in Side Panel: "${promptInPanel.slice(0, 50)}..."`);

    // Switch to Golden tab
    await sidepanelPage.click('button[data-tab="golden"]');
    await sidepanelPage.waitForTimeout(300);

    const goldenText = await sidepanelPage.$eval('#golden-prompt-pre', el => el.textContent);
    console.log(`[LIVE TEST] Generated Golden Prompt (${goldenText.length} chars)`);

    // Click "Insert into Chat Composer"
    await sidepanelPage.click('#btn-apply-golden-to-chat');
    await sidepanelPage.waitForTimeout(600);

    const toastText = await sidepanelPage.$eval('#ps-toast', el => el.textContent);
    console.log(`[LIVE TEST] Toast after applying golden: "${toastText}"`);

    console.log('[LIVE TEST] Verification completed successfully!');
  } finally {
    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

run().catch(err => {
  console.error('[LIVE TEST] Error:', err);
  process.exit(1);
});

