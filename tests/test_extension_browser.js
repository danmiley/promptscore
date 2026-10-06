/**
 * Real Loaded-Extension End-to-End Browser Test
 * Launches Chromium with the unpacked PromptScore extension loaded,
 * validates service worker registration, side panel rendering, and prompt evaluation.
 */

const path = require('path');
const { chromium } = require('playwright');

const REPO_ROOT = path.resolve(__dirname, '..');
const EXTENSION_PATH = path.join(REPO_ROOT, 'extension');

(async () => {
  console.log(`[EXT TEST] Loading unpacked extension from: ${EXTENSION_PATH}`);

  // Launch persistent context with the extension loaded
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--headless=new',
      '--no-sandbox'
    ]
  });

  // 1. Wait for service worker to register
  let serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker', { timeout: 10000 });
  }

  const extensionUrl = serviceWorker.url();
  const extensionId = extensionUrl.split('/')[2];
  console.log(`[EXT TEST] Extension Service Worker active!`);
  console.log(`[EXT TEST] Extension ID: ${extensionId}`);

  // 2. Open simulated chat page
  const chatPage = await context.newPage();
  await chatPage.goto('http://localhost:8765/index.html');
  await chatPage.waitForTimeout(500);
  console.log(`[EXT TEST] Chat page loaded: ${chatPage.url()}`);

  // 3. Open the extension Side Panel directly via its extension URL
  const sidePanelPage = await context.newPage();
  const sidePanelUrl = `chrome-extension://${extensionId}/sidepanel.html`;
  await sidePanelPage.goto(sidePanelUrl);
  await sidePanelPage.waitForTimeout(600);
  console.log(`[EXT TEST] Side Panel page loaded: ${sidePanelUrl}`);

  // 4. Verify Side Panel DOM elements and Grader initialization
  const scoreValue = await sidePanelPage.$eval('#display-score-value', el => el.textContent.trim());
  const bandTitle = await sidePanelPage.$eval('#display-band-title', el => el.textContent.trim());
  console.log(`[EXT TEST] Initial evaluated score in Side Panel: ${scoreValue} (${bandTitle})`);

  // 5. Test entering a custom prompt into the side panel textarea
  const testPrompt = `make the dashboard better and more professional`;
  await sidePanelPage.fill('#active-prompt-text', testPrompt);
  await sidePanelPage.dispatchEvent('#active-prompt-text', 'input');
  await sidePanelPage.waitForTimeout(300);

  const updatedScore = await sidePanelPage.$eval('#display-score-value', el => el.textContent.trim());
  const updatedBand = await sidePanelPage.$eval('#display-band-title', el => el.textContent.trim());
  console.log(`[EXT TEST] Updated evaluated score for thin prompt: ${updatedScore} (${updatedBand})`);

  if (updatedScore !== '331') {
    throw new Error(`Expected score 331 for thin prompt, got ${updatedScore}`);
  }

  // 6. Test switching to Golden Prompt tab and reading the generated best-practice prompt
  await sidePanelPage.click('#tab-btn-golden');
  await sidePanelPage.waitForTimeout(300);
  const goldenPrompt = await sidePanelPage.$eval('#golden-prompt-pre', el => el.textContent.trim());
  console.log(`[EXT TEST] Generated Golden Prompt in extension (${goldenPrompt.length} chars)`);

  // 7. Capture screenshot of the real extension side panel running in Chromium
  await sidePanelPage.screenshot({ path: '/tmp/ps_loaded_extension_test.png' });
  console.log(`[EXT TEST] Screenshot captured: /tmp/ps_loaded_extension_test.png`);

  console.log(`[EXT TEST] SUCCESS: Manifest V3 extension verified in real Chromium browser!`);
  await context.close();
})();
