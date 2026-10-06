const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:8765/index.html');
  await page.waitForTimeout(500);

  // 1. Side Panel: Tabbed View - Credit Score
  await page.screenshot({ path: '/tmp/ps_sidepanel_01_score.png' });

  // 2. Side Panel: Tabbed View - Markup
  await page.click('#tab-btn-markup');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/ps_sidepanel_02_markup.png' });

  // 3. Side Panel: Tabbed View - Golden Prompt
  await page.click('#tab-btn-golden');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/ps_sidepanel_03_golden.png' });

  // 4. Side Panel: Unified Stream View (All 3 artifacts stacked)
  await page.click('#btn-layout-stream');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/ps_sidepanel_04_stream.png' });

  // 5. Test Golden Prompt insertion from sticky bar
  await page.click('#btn-sticky-apply');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/ps_sidepanel_05_applied.png' });

  // 6. Test toggling Side Panel closed from Chrome Toolbar button
  await page.click('#btn-toggle-sidepanel');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/ps_sidepanel_06_closed.png' });

  console.log('Side panel screenshots captured successfully.');
  await browser.close();
})();
