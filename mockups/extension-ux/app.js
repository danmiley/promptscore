/**
 * PromptScore — UX Prototype Application Logic
 * Interactive prototype exploring 3 artifact presentations and 3 UI models:
 * 1) Docked Side Panel (Chrome SidePanel API)
 * 2) In-Situ Floating HUD (Contextual Flyout)
 * 3) Split Workbench (Deep Comparison Modal)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Preset Data Matrix mirroring `src/promptscore` & `prompt-templates/rubric.toml`
  const PRESETS = {
    partial: {
      id: 'partial',
      title: 'Partial Task (Score 567 — Usable)',
      sourceName: 'partial-task.md',
      score: 567,
      band: {
        title: 'Usable',
        range: '500–649',
        cssClass: 'band-usable',
        summary: 'The outcome is visible, but a model can still miss the boundary or fail to verify its work.'
      },
      rawPrompt: `Fix the flaky checkout test in tests/test_checkout.py.

The test fails when the cart is empty. Do not change the payment provider.

Return a short explanation of the cause.`,
      why: [
        { type: 'deficit', title: 'Observable finish line at 0.00', desc: 'Done means a check someone can settle, not a compliment or task name.' },
        { type: 'deficit', title: 'Reported check at 0.00', desc: 'Verification asks the model to report the command and result actually run.' },
        { type: 'credit', title: 'Named outcome & inputs present', desc: 'Identified target path tests/test_checkout.py and clear action verb.' },
        { type: 'credit', title: 'Boundaries & Output shape present', desc: 'Prohibits changing payment provider; asks for explanation.' }
      ],
      tips: [
        { points: '+90 pts', title: 'Add an observable finish line', desc: 'State exact command: `uv run pytest tests/test_checkout.py` exiting 0.' },
        { points: '+70 pts', title: 'Ask for verified output', desc: 'Request the exit code and observed output in the first sentence.' },
        { points: '+20 pts', title: 'Name single check over ceremony', desc: 'One concrete test run moves the score more than extra adjectives.' }
      ],
      rubricTable: [
        { name: 'Named outcome', weight: 16, fulfillment: '0.85', status: 'Partial: action verb' },
        { name: 'Observable finish line', weight: 18, fulfillment: '0.00', status: 'Missing' },
        { name: 'Boundaries', weight: 14, fulfillment: '0.70', status: 'Partial: prohibition' },
        { name: 'Output shape', weight: 14, fulfillment: '0.70', status: 'Partial: answer contents' },
        { name: 'Named inputs', weight: 10, fulfillment: '0.85', status: 'Partial: named path' },
        { name: 'Reported check', weight: 14, fulfillment: '0.00', status: 'Missing' },
        { name: 'Stop conditions', weight: 8, fulfillment: 'n/a', status: 'Not required' },
        { name: 'Step checks', weight: 6, fulfillment: 'n/a', status: 'Not required' }
      ],
      segments: [
        {
          index: 1,
          type: 'keep',
          text: 'Fix the flaky checkout test in tests/test_checkout.py.',
          rationale: 'Covers: Named outcome, Named inputs.',
          suggestion: 'Strong intent and explicit file target. Keep.'
        },
        {
          index: 2,
          type: 'keep',
          text: 'The test fails when the cart is empty. Do not change the payment provider.',
          rationale: 'Covers: Boundaries & constraints.',
          suggestion: 'Clear prohibition protects against collateral refactoring. Keep.'
        },
        {
          index: 3,
          type: 'gap',
          text: 'Return a short explanation of the cause.',
          rationale: 'Covers: Output shape, but lacks verification evidence.',
          suggestion: 'Add requirement to report the command output that proves the fix.'
        }
      ],
      goldenPrompt: `Fix the flaky checkout test in tests/test_checkout.py.

The test fails when the cart is empty. Do not change the payment provider.

Return a short explanation of the cause.

Done when: For "Fix the flaky checkout test in tests/test_checkout.py.", name the artifact and the check that shows it is finished.

Verify:
- Re-run the check this request names.
- If you could not run it, say that in the first sentence and name what is missing.`,
      goldenFormattedHtml: `<span class="golden-preserved">Fix the flaky checkout test in tests/test_checkout.py.

The test fails when the cart is empty. Do not change the payment provider.

Return a short explanation of the cause.</span>

<span class="golden-added">Done when: For "Fix the flaky checkout test in tests/test_checkout.py.", name the artifact and the check that shows it is finished.</span>

<span class="golden-added">Verify:
- Re-run the check this request names.
- If you could not run it, say that in the first sentence and name what is missing.</span>`
    },

    thin: {
      id: 'thin',
      title: 'Thin Request (Score 331 — Developing)',
      sourceName: 'thin-request.md',
      score: 331,
      band: {
        title: 'Developing',
        range: '300–499',
        cssClass: 'band-developing',
        summary: 'Text does not say what must be true when work is done. Contains subjective buzzwords.'
      },
      rawPrompt: `make the dashboard better and more professional`,
      why: [
        { type: 'deficit', title: 'Vague-word factor penalized (-15%)', desc: 'Contains subjective words: "better", "professional".' },
        { type: 'deficit', title: 'Short-prompt factor penalized (7 words)', desc: 'Prompts under 15 words fail to convey boundaries or criteria.' },
        { type: 'deficit', title: 'Observable finish line at 0.00', desc: 'No verifiable test, screenshot, or metric specified.' },
        { type: 'credit', title: 'Named outcome partial', desc: 'Action verb "make" and target "dashboard" identified.' }
      ],
      tips: [
        { points: '+150 pts', title: 'Replace subjective adjectives', desc: 'Replace "better/professional" with specific layout, spacing, or visual tokens.' },
        { points: '+110 pts', title: 'Define an observable finish line', desc: 'Specify components to render and automated visual regression checks.' },
        { points: '+80 pts', title: 'Name inputs and boundary files', desc: 'Provide relative paths: `src/components/Dashboard.tsx`.' }
      ],
      rubricTable: [
        { name: 'Named outcome', weight: 16, fulfillment: '0.40', status: 'Vague target' },
        { name: 'Observable finish line', weight: 18, fulfillment: '0.00', status: 'Missing' },
        { name: 'Boundaries', weight: 14, fulfillment: '0.00', status: 'Missing' },
        { name: 'Output shape', weight: 14, fulfillment: '0.00', status: 'Missing' },
        { name: 'Named inputs', weight: 10, fulfillment: '0.20', status: 'Generic' },
        { name: 'Reported check', weight: 14, fulfillment: '0.00', status: 'Missing' },
        { name: 'Stop conditions', weight: 8, fulfillment: 'n/a', status: 'Not required' },
        { name: 'Step checks', weight: 6, fulfillment: 'n/a', status: 'Not required' }
      ],
      segments: [
        {
          index: 1,
          type: 'gap',
          text: 'make the dashboard better and more professional',
          rationale: 'Heavy penalty for vague buzzwords ("better", "professional").',
          suggestion: 'Name the exact components and concrete visual standards.'
        }
      ],
      goldenPrompt: `Redesign the metrics widgets in src/components/Dashboard.tsx to match our dark theme design tokens.

Constraints:
- Use existing CSS variables from styles/theme.css; do not install new icon or chart packages.
- Maintain responsive breakpoints for 768px and 1200px viewports.

Output:
- The modified component file and a summary of layout changes made.

Done when:
- \`npm run build\` succeeds without TypeScript errors, and \`npm test -- -u\` passes.

Verify:
- Run the build and test commands and paste the terminal output.`,
      goldenFormattedHtml: `<span class="golden-added">Redesign the metrics widgets in src/components/Dashboard.tsx to match our dark theme design tokens.

Constraints:
- Use existing CSS variables from styles/theme.css; do not install new icon or chart packages.
- Maintain responsive breakpoints for 768px and 1200px viewports.

Output:
- The modified component file and a summary of layout changes made.

Done when:
- npm run build succeeds without TypeScript errors, and npm test passes.

Verify:
- Run the build and test commands and paste the terminal output.</span>`
    },

    disciplined: {
      id: 'disciplined',
      title: 'Disciplined Task (Score 816 — Disciplined)',
      sourceName: 'disciplined-task.md',
      score: 816,
      band: {
        title: 'Disciplined',
        range: '750–850',
        cssClass: 'band-disciplined',
        summary: 'Exceptional clarity. Observable finish lines, explicit verification command, and tight boundaries.'
      },
      rawPrompt: `Fix the empty-cart failure in tests/test_checkout.py.

Done when: \`uv run pytest tests/test_checkout.py -q\` exits 0, and that empty-cart case is the one that was failing.

Constraints:
- Change only the checkout test or the cart code the failure proves is wrong.
- Do not change the payment provider.
- Do not guess a cause you have not reproduced.

Output:
- The cause, the files you changed, and the pytest output you observed.

Verify:
- Re-run that pytest command and include the exit status.`,
      why: [
        { type: 'credit', title: 'Observable finish line fully satisfied (1.00)', desc: 'Done when specifies command `uv run pytest` exiting 0.' },
        { type: 'credit', title: 'Reported check fully satisfied (1.00)', desc: 'Verify asks the model to re-run and report the exit status.' },
        { type: 'credit', title: 'Strict boundaries (1.00)', desc: 'Limits changes, forbids changing payment provider or guessing.' },
        { type: 'credit', title: 'Structured output shape (1.00)', desc: 'Bullet list requesting cause, modified files, and test output.' }
      ],
      tips: [
        { points: '✓ Top Tier', title: 'Prompt past rewrite threshold', desc: 'Every applicable characteristic is present. No further sections needed.' }
      ],
      rubricTable: [
        { name: 'Named outcome', weight: 16, fulfillment: '1.00', status: 'Full credit' },
        { name: 'Observable finish line', weight: 18, fulfillment: '1.00', status: 'Full credit' },
        { name: 'Boundaries', weight: 14, fulfillment: '1.00', status: 'Full credit' },
        { name: 'Output shape', weight: 14, fulfillment: '1.00', status: 'Full credit' },
        { name: 'Named inputs', weight: 10, fulfillment: '1.00', status: 'Full credit' },
        { name: 'Reported check', weight: 14, fulfillment: '1.00', status: 'Full credit' },
        { name: 'Stop conditions', weight: 8, fulfillment: 'n/a', status: 'Not required' },
        { name: 'Step checks', weight: 6, fulfillment: 'n/a', status: 'Not required' }
      ],
      segments: [
        {
          index: 1,
          type: 'keep',
          text: 'Fix the empty-cart failure in tests/test_checkout.py.',
          rationale: 'Named outcome + Named inputs.',
          suggestion: 'Excellent.'
        },
        {
          index: 2,
          type: 'keep',
          text: 'Done when: `uv run pytest tests/test_checkout.py -q` exits 0, and that empty-cart case is the one that was failing.',
          rationale: 'Observable finish line.',
          suggestion: 'Gold standard. Testable and machine-executable.'
        },
        {
          index: 3,
          type: 'keep',
          text: 'Constraints: Change only the checkout test or cart code; do not change payment provider; do not guess.',
          rationale: 'Boundaries & prohibitions.',
          suggestion: 'Protects critical payment subsystem.'
        },
        {
          index: 4,
          type: 'keep',
          text: 'Verify: Re-run that pytest command and include the exit status.',
          rationale: 'Reported check.',
          suggestion: 'Enforces proof-of-work in response.'
        }
      ],
      goldenPrompt: `Fix the empty-cart failure in tests/test_checkout.py.

Done when: \`uv run pytest tests/test_checkout.py -q\` exits 0, and that empty-cart case is the one that was failing.

Constraints:
- Change only the checkout test or the cart code the failure proves is wrong.
- Do not change the payment provider.
- Do not guess a cause you have not reproduced.

Output:
- The cause, the files you changed, and the pytest output you observed.

Verify:
- Re-run that pytest command and include the exit status.`,
      goldenFormattedHtml: `<span class="golden-preserved">Fix the empty-cart failure in tests/test_checkout.py.

Done when: \`uv run pytest tests/test_checkout.py -q\` exits 0, and that empty-cart case is the one that was failing.

Constraints:
- Change only the checkout test or the cart code the failure proves is wrong.
- Do not change the payment provider.
- Do not guess a cause you have not reproduced.

Output:
- The cause, the files you changed, and the pytest output you observed.

Verify:
- Re-run that pytest command and include the exit status.</span>`
    }
  };

  // State
  let currentPresetKey = 'partial';
  let currentLayout = 'tabs'; // 'tabs' | 'stream'
  let currentTab = 'score';   // 'score' | 'markup' | 'golden'
  let isPanelOpen = true;

  // DOM Elements
  const viewport = document.getElementById('app-viewport');
  const promptInput = document.getElementById('prompt-input');
  const wordCountDisplay = document.getElementById('prompt-word-count');
  const presetSelector = document.getElementById('preset-selector');
  const floatingTriggerPill = document.getElementById('floating-trigger-pill');
  const pillScoreTag = document.getElementById('pill-score-tag');

  // Toolbar & Side Panel Elements
  const sidePanel = document.getElementById('ps-side-panel');
  const btnToggleSidePanel = document.getElementById('btn-toggle-sidepanel');
  const toolbarScorePill = document.getElementById('toolbar-score-pill');
  const btnLayoutTabs = document.getElementById('btn-layout-tabs');
  const btnLayoutStream = document.getElementById('btn-layout-stream');
  const btnPanelClose = document.getElementById('btn-panel-close');
  const btnPanelMinimize = document.getElementById('btn-panel-minimize');
  const sidepanelStickyBar = document.getElementById('sidepanel-sticky-bar');
  const btnStickyApply = document.getElementById('btn-sticky-apply');

  // Artifact Tabs & Panes
  const artifactTabs = document.querySelectorAll('.artifact-tab');
  const artifactPanes = document.querySelectorAll('.artifact-pane');

  // Score Elements
  const displayScoreValue = document.getElementById('display-score-value');
  const displayBandBadge = document.getElementById('display-band-badge');
  const displayBandTitle = document.getElementById('display-band-title');
  const displayBandRange = document.getElementById('display-band-range');
  const displayBandSummary = document.getElementById('display-band-summary');
  const gaugeFillPath = document.getElementById('gauge-fill-path');
  const scaleSegments = document.querySelectorAll('.scale-segment');
  const displayWhyList = document.getElementById('display-why-list');
  const displayTipsList = document.getElementById('display-tips-list');
  const rubricTableBody = document.getElementById('rubric-table-body');

  // Markup Elements
  const segmentsContainer = document.getElementById('segments-container');
  const btnSwitchToGolden = document.getElementById('btn-switch-to-golden');

  // Golden Elements
  const goldenPromptPre = document.getElementById('golden-prompt-pre');
  const btnCopyGolden = document.getElementById('btn-copy-golden');
  const btnApplyGoldenToChat = document.getElementById('btn-apply-golden-to-chat');

  // Toast
  const toast = document.getElementById('ps-toast');

  /**
   * Helper: Show transient toast message
   */
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
    }, 2600);
  }

  /**
   * Helper: Update word count
   */
  function updateWordCount() {
    const text = promptInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    wordCountDisplay.textContent = `${words} word${words === 1 ? '' : 's'}`;
  }

  /**
   * Set Radial Gauge SVG Fill Arc
   * Scale runs 300 to 850 (span = 550)
   * Arc total length is approx 236
   */
  function updateGauge(score, bandCssClass) {
    const min = 300;
    const max = 850;
    const ratio = Math.max(0, Math.min(1, (score - min) / (max - min)));
    const totalDash = 236;
    const offset = totalDash * (1 - ratio);
    
    gaugeFillPath.style.strokeDashoffset = offset;

    // Update gauge stroke color to match band
    if (bandCssClass === 'band-developing') {
      gaugeFillPath.style.stroke = '#ef4444';
    } else if (bandCssClass === 'band-usable') {
      gaugeFillPath.style.stroke = '#f59e0b';
    } else if (bandCssClass === 'band-capable') {
      gaugeFillPath.style.stroke = '#3b82f6';
    } else {
      gaugeFillPath.style.stroke = '#10b981';
    }
  }

  /**
   * Render Active Preset Data into all 3 Artifact Views
   */
  function renderPreset(presetKey) {
    const data = PRESETS[presetKey];
    if (!data) return;

    currentPresetKey = presetKey;
    presetSelector.value = presetKey;
    promptInput.value = data.rawPrompt;
    updateWordCount();

    // Toolbar & Composer Badges
    toolbarScorePill.textContent = data.score;
    pillScoreTag.textContent = data.score;
    pillScoreTag.className = `pill-score-tag ${data.band.cssClass}`;

    // -------------------------------------------------------------
    // ARTIFACT 1: SCORE & DIAGNOSTICS
    // -------------------------------------------------------------
    displayScoreValue.textContent = data.score;
    displayBandTitle.textContent = data.band.title;
    displayBandRange.textContent = `(${data.band.range})`;
    displayBandSummary.textContent = data.band.summary;
    displayBandBadge.className = `band-badge ${data.band.cssClass}`;

    updateGauge(data.score, data.band.cssClass);

    // Update 4-segment visualizer highlight
    scaleSegments.forEach(seg => {
      seg.classList.remove('current');
      if (
        (data.band.title === 'Developing' && seg.classList.contains('seg-dev')) ||
        (data.band.title === 'Usable' && seg.classList.contains('seg-usable')) ||
        (data.band.title === 'Capable' && seg.classList.contains('seg-capable')) ||
        (data.band.title === 'Disciplined' && seg.classList.contains('seg-disc'))
      ) {
        seg.classList.add('current');
      }
    });

    // Why this score
    displayWhyList.innerHTML = data.why.map(item => `
      <li class="why-item ${item.type}">
        <div class="why-bullet">${item.type === 'credit' ? '✓' : '✕'}</div>
        <div class="why-content">
          <strong>${item.title}</strong>
          <p>${item.desc}</p>
        </div>
      </li>
    `).join('');

    // How to raise it (Tips)
    displayTipsList.innerHTML = data.tips.map(tip => `
      <div class="tip-card" title="Suggested refinement">
        <div class="tip-points">${tip.points}</div>
        <div class="tip-text">
          <strong>${tip.title}</strong>
          <p>${tip.desc}</p>
        </div>
      </div>
    `).join('');

    // Rubric Table
    rubricTableBody.innerHTML = data.rubricTable.map(row => `
      <tr>
        <td><strong>${row.name}</strong></td>
        <td>${row.weight}</td>
        <td>${row.fulfillment}</td>
        <td>${row.status}</td>
      </tr>
    `).join('');

    // -------------------------------------------------------------
    // ARTIFACT 2: DETAILED MARKUP / ANNOTATION
    // -------------------------------------------------------------
    segmentsContainer.innerHTML = data.segments.map(seg => `
      <div class="segment-card status-${seg.type}">
        <div class="segment-header">
          <span class="segment-tag-num">Segment ${seg.index}</span>
          <span class="segment-tag-badge tag-${seg.type}">${seg.type === 'keep' ? 'Preserve' : 'Refine'}</span>
        </div>
        <div class="segment-body">
          <div class="segment-quote">${escapeHtml(seg.text)}</div>
          <div class="segment-rationale">${escapeHtml(seg.rationale)}</div>
          <div class="segment-suggestion"><strong>Suggestion:</strong> ${escapeHtml(seg.suggestion)}</div>
        </div>
      </div>
    `).join('');

    // -------------------------------------------------------------
    // ARTIFACT 3: CANONICAL GOLDEN PROMPT
    // -------------------------------------------------------------
    goldenPromptPre.innerHTML = `<code>${data.goldenFormattedHtml}</code>`;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Switch Side Panel Layout: 'tabs' vs 'stream' (Unified Feed)
   */
  function switchLayout(layout) {
    currentLayout = layout;
    btnLayoutTabs.classList.toggle('active', layout === 'tabs');
    btnLayoutStream.classList.toggle('active', layout === 'stream');

    if (layout === 'stream') {
      viewport.classList.add('layout-stream');
      showToast('Switched to Unified Feed: All 3 artifacts stacked');
    } else {
      viewport.classList.remove('layout-stream');
      switchTab(currentTab);
      showToast('Switched to Tabbed View: 1 Score | 2 Markup | 3 Golden');
    }
  }

  /**
   * Switch Artifact Tab (for Tabbed Layout)
   */
  function switchTab(tabKey) {
    currentTab = tabKey;
    artifactTabs.forEach(tab => {
      const match = tab.getAttribute('data-tab') === tabKey;
      tab.classList.toggle('active', match);
      tab.setAttribute('aria-selected', match);
    });

    artifactPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `pane-${tabKey}`);
    });
  }

  /**
   * Toggle Side Panel Visibility
   */
  function toggleSidePanel(forceState) {
    if (typeof forceState === 'boolean') {
      isPanelOpen = forceState;
    } else {
      isPanelOpen = !isPanelOpen;
    }

    sidePanel.classList.toggle('closed', !isPanelOpen);
    btnToggleSidePanel.classList.toggle('active', isPanelOpen);

    if (isPanelOpen) {
      showToast('PromptScore Chrome Side Panel open');
    } else {
      showToast('Side Panel closed');
    }
  }

  /**
   * Event Listeners Setup
   */

  // Preset Selector
  presetSelector.addEventListener('change', (e) => {
    renderPreset(e.target.value);
    showToast(`Loaded ${PRESETS[e.target.value].title}`);
  });

  // Chrome Extension Action Button in Toolbar
  btnToggleSidePanel.addEventListener('click', () => {
    toggleSidePanel();
  });

  // Composer Floating Chip (opens side panel if closed)
  floatingTriggerPill.addEventListener('click', () => {
    toggleSidePanel(true);
    switchTab('score');
  });

  // Layout Switcher (Tabs vs Stream)
  btnLayoutTabs.addEventListener('click', () => switchLayout('tabs'));
  btnLayoutStream.addEventListener('click', () => switchLayout('stream'));

  // Tab navigation clicks
  artifactTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.getAttribute('data-tab'));
    });
  });

  btnSwitchToGolden.addEventListener('click', () => {
    switchTab('golden');
  });

  // Panel Close / Minimize buttons
  btnPanelClose.addEventListener('click', () => toggleSidePanel(false));
  btnPanelMinimize.addEventListener('click', () => toggleSidePanel(false));

  // Golden Copy & Apply Actions
  function applyGoldenToComposer() {
    const data = PRESETS[currentPresetKey];
    promptInput.value = data.goldenPrompt;
    updateWordCount();
    showToast('⚡ Golden prompt inserted into Chat Composer!');
    promptInput.focus();
  }

  btnApplyGoldenToChat.addEventListener('click', applyGoldenToComposer);
  btnStickyApply.addEventListener('click', applyGoldenToComposer);

  btnCopyGolden.addEventListener('click', () => {
    const data = PRESETS[currentPresetKey];
    navigator.clipboard.writeText(data.goldenPrompt).then(() => {
      showToast('📋 Golden prompt copied to clipboard!');
    }).catch(() => {
      showToast('📋 Copied!');
    });
  });

  // Textarea input event
  promptInput.addEventListener('input', () => {
    updateWordCount();
  });

  // Keyboard shortcut simulation: Alt+S toggles side panel
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      toggleSidePanel();
    }
  });

  // Initialize
  renderPreset('partial');
  switchLayout('tabs');
  switchTab('score');
  toggleSidePanel(true);
});
