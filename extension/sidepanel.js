/**
 * PromptScore — Chrome Side Panel Controller
 * Handles live grading, communication with active tab content script, and UI updates.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof RUBRIC_DATA === 'undefined' || typeof PromptScoreGrader === 'undefined') {
    console.error('PromptScore: Rubric data or Grader engine missing.');
    return;
  }

  const rubric = PromptScoreGrader.compileRubric(RUBRIC_DATA);

  // State
  let currentGrade = null;
  let currentGoldenText = '';
  let activeTabId = null;

  // DOM Elements
  const activePromptTextarea = document.getElementById('active-prompt-text');
  const wordCountLabel = document.getElementById('word-count-label');
  const btnRefreshPrompt = document.getElementById('btn-refresh-prompt');
  const syncStatusLabel = document.getElementById('sync-status-label');
  const syncStatusPill = document.getElementById('sync-status-pill');

  // Artifact Tabs
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

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2600);
  }

  function updateGauge(score, bandClass) {
    const min = rubric.score_min;
    const max = rubric.score_max;
    const ratio = Math.max(0, Math.min(1, (score - min) / (max - min)));
    const totalDash = 236;
    gaugeFillPath.style.strokeDashoffset = totalDash * (1 - ratio);

    if (bandClass === 'band-developing') {
      gaugeFillPath.style.stroke = '#ef4444';
    } else if (bandClass === 'band-usable') {
      gaugeFillPath.style.stroke = '#f59e0b';
    } else if (bandClass === 'band-strong') {
      gaugeFillPath.style.stroke = '#3b82f6';
    } else {
      gaugeFillPath.style.stroke = '#10b981';
    }
  }

  function evaluatePrompt(text) {
    const trimmed = text.trim();
    const grade = PromptScoreGrader.gradePrompt(trimmed, rubric);
    const golden = PromptScoreGrader.improvedPrompt(trimmed, grade, rubric);
    const segments = PromptScoreGrader.annotateSegments(trimmed, grade, rubric);

    currentGrade = grade;
    currentGoldenText = golden;

    wordCountLabel.textContent = `${grade.word_count} word${grade.word_count === 1 ? '' : 's'}`;

    // Determine band CSS class
    let bandClass = 'band-developing';
    if (grade.score >= 750) bandClass = 'band-disciplined';
    else if (grade.score >= 650) bandClass = 'band-strong';
    else if (grade.score >= 500) bandClass = 'band-usable';

    // -----------------------------------------------------------------
    // ARTIFACT 1: CREDIT SCORE
    // -----------------------------------------------------------------
    displayScoreValue.textContent = grade.score;
    displayBandTitle.textContent = grade.band_title;
    displayBandRange.textContent = `(${grade.band_min}–${grade.band_max})`;
    displayBandSummary.textContent = grade.band_summary;
    displayBandBadge.className = `band-badge ${bandClass}`;
    updateGauge(grade.score, bandClass);

    // Scale bar highlight
    scaleSegments.forEach(seg => {
      seg.classList.remove('current');
      if (
        (grade.band_title === 'Developing' && seg.classList.contains('seg-dev')) ||
        (grade.band_title === 'Usable' && seg.classList.contains('seg-usable')) ||
        (grade.band_title === 'Strong' && seg.classList.contains('seg-strong')) ||
        (grade.band_title === 'Disciplined' && seg.classList.contains('seg-disc'))
      ) {
        seg.classList.add('current');
      }
    });

    // Why this score
    const deficits = grade.dimensions.filter(d => d.applicable && d.fulfillment < rubric.adjustments.insert_below);
    const credits = grade.dimensions.filter(d => d.applicable && d.fulfillment >= rubric.adjustments.insert_below);

    const whyItems = [];
    for (const d of deficits) {
      whyItems.push(`<li class="why-item deficit"><div class="why-bullet">✕</div><div class="why-content"><strong>${escapeHtml(d.title)} (${d.fulfillment.toFixed(2)})</strong><p>${escapeHtml(d.note)}</p></div></li>`);
    }
    for (const d of credits) {
      whyItems.push(`<li class="why-item credit"><div class="why-bullet">✓</div><div class="why-content"><strong>${escapeHtml(d.title)}</strong><p>${escapeHtml(d.note)}</p></div></li>`);
    }
    if (grade.vague_factor < 1.0) {
      whyItems.unshift(`<li class="why-item deficit"><div class="why-bullet">✕</div><div class="why-content"><strong>Vague-word penalty (-15%)</strong><p>Contains: ${grade.vague_terms.join(', ')}</p></div></li>`);
    }
    displayWhyList.innerHTML = whyItems.join('');

    // How to raise it (Tips)
    const tipItems = [];
    for (const d of deficits.slice(0, 3)) {
      tipItems.push(`<div class="tip-card"><div class="tip-points">+${Math.round(d.weight * 5.5)} pts</div><div class="tip-text"><strong>${escapeHtml(d.title)}</strong><p>${escapeHtml(d.tip)}</p></div></div>`);
    }
    if (tipItems.length === 0) {
      tipItems.push('<div class="tip-card"><div class="tip-points">✓ Top Tier</div><div class="tip-text"><strong>All critical characteristics satisfied</strong><p>Prompt is hard to misread. Ready to execute.</p></div></div>');
    }
    displayTipsList.innerHTML = tipItems.join('');

    // Rubric Table
    rubricTableBody.innerHTML = grade.dimensions.map(d => `
      <tr>
        <td><strong>${escapeHtml(d.title)}</strong></td>
        <td>${d.weight}</td>
        <td>${d.applicable ? d.fulfillment.toFixed(2) : 'n/a'}</td>
        <td>${escapeHtml(d.note)}</td>
      </tr>
    `).join('');

    // -----------------------------------------------------------------
    // ARTIFACT 2: DETAILED MARKUP
    // -----------------------------------------------------------------
    segmentsContainer.innerHTML = segments.map(seg => {
      const isRefine = seg.suggestion.startsWith('Replace') || seg.suggestion.startsWith('Add') || seg.suggestion.startsWith('Make');
      const tagClass = isRefine ? 'tag-gap' : 'tag-keep';
      const statusClass = isRefine ? 'status-gap' : 'status-keep';
      const tagLabel = isRefine ? 'Refine' : 'Preserve';

      return `
        <div class="segment-card ${statusClass}">
          <div class="segment-header">
            <span class="segment-tag-num">Segment ${seg.index}</span>
            <span class="segment-tag-badge ${tagClass}">${tagLabel}</span>
          </div>
          <div class="segment-body">
            <div class="segment-quote">${escapeHtml(seg.text)}</div>
            <div class="segment-suggestion"><strong>Suggestion:</strong> ${escapeHtml(seg.suggestion)}</div>
          </div>
        </div>
      `;
    }).join('');

    // -----------------------------------------------------------------
    // ARTIFACT 3: CANONICAL GOLDEN PROMPT
    // -----------------------------------------------------------------
    goldenPromptPre.textContent = golden;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function switchTab(tabKey) {
    artifactTabs.forEach(tab => {
      const match = tab.getAttribute('data-tab') === tabKey;
      tab.classList.toggle('active', match);
      tab.setAttribute('aria-selected', match);
    });

    artifactPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `pane-${tabKey}`);
    });
  }

  // --- Active Tab Communication & Dynamic Injection ---
  function getTabSiteLabel(tab) {
    if (!tab || !tab.url) return 'Active Tab';
    if (tab.url.includes('claude.ai')) return 'Claude.ai';
    if (tab.url.includes('chatgpt.com') || tab.url.includes('openai.com')) return 'ChatGPT';
    if (tab.url.includes('localhost') || tab.url.includes('127.0.0.1')) return 'Local Chat';
    try {
      return new URL(tab.url).hostname;
    } catch (e) {
      return 'Active Tab';
    }
  }

  function queryActiveTabPrompt() {
    if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) {
      syncStatusLabel.textContent = 'Local Mode';
      evaluatePrompt(activePromptTextarea.value || 'Fix the flaky checkout test in tests/test_checkout.py.');
      return;
    }

    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        syncStatusLabel.textContent = 'No Active Tab';
        return;
      }
      // Pick the active tab in this window that is not the extension itself
      let tab = tabs.find(t => t.active && t.url && !t.url.startsWith('chrome-extension:'));
      if (!tab) {
        tab = tabs.find(t => t.url && !t.url.startsWith('chrome-extension:'));
      }
      if (!tab) {
        syncStatusLabel.textContent = 'No Chat Tab';
        evaluatePrompt(activePromptTextarea.value);
        return;
      }
      activeTabId = tab.id;
      const siteLabel = getTabSiteLabel(tab);

      // Attempt sending message to content script
      chrome.tabs.sendMessage(tab.id, { type: 'GET_PROMPT' }, (res) => {
        if (chrome.runtime.lastError || !res) {
          // Content script not running in this tab yet (e.g. loaded before extension). Inject it dynamically!
          if (chrome.scripting && chrome.scripting.executeScript && tab.id) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content_script.js']
            }).then(() => {
              // Retry reading prompt after injection
              chrome.tabs.sendMessage(tab.id, { type: 'GET_PROMPT' }, (retryRes) => {
                if (retryRes && retryRes.success && retryRes.text) {
                  activePromptTextarea.value = retryRes.text;
                  syncStatusLabel.textContent = `${siteLabel} (${retryRes.source})`;
                  evaluatePrompt(retryRes.text);
                  showToast(`✦ Connected to ${siteLabel}`);
                } else {
                  syncStatusLabel.textContent = `Connected: ${siteLabel}`;
                  if (!activePromptTextarea.value) {
                    activePromptTextarea.value = 'Fix the flaky checkout test in tests/test_checkout.py.\n\nThe test fails when the cart is empty. Do not change the payment provider.\n\nReturn a short explanation of the cause.';
                  }
                  evaluatePrompt(activePromptTextarea.value);
                }
              });
            }).catch(() => {
              syncStatusLabel.textContent = `Ready (${siteLabel})`;
              evaluatePrompt(activePromptTextarea.value);
            });
            return;
          }

          syncStatusLabel.textContent = `Ready (${siteLabel})`;
          evaluatePrompt(activePromptTextarea.value);
          return;
        }

        if (res.success && res.text) {
          activePromptTextarea.value = res.text;
          syncStatusLabel.textContent = `${siteLabel} (${res.source})`;
          evaluatePrompt(res.text);
          showToast(`✦ Read ${res.source} from ${siteLabel}`);
        } else {
          syncStatusLabel.textContent = `Connected: ${siteLabel}`;
          evaluatePrompt(activePromptTextarea.value);
        }
      });
    });
  }

  // Listen for proactive prompt change broadcasts from content script
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'PROMPT_CHANGED' && message.text) {
        if (document.activeElement !== activePromptTextarea && activePromptTextarea.value !== message.text) {
          activePromptTextarea.value = message.text;
          syncStatusLabel.textContent = message.source === 'selection' ? 'Selection Detected' : 'Live Synced';
          evaluatePrompt(message.text);
        }
      }
    });
  }

  // Re-sync when switching tabs
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.onActivated) {
    chrome.tabs.onActivated.addListener(() => {
      queryActiveTabPrompt();
    });
  }

  // Re-sync when side panel window regains focus
  window.addEventListener('focus', () => {
    queryActiveTabPrompt();
  });

  // Event Listeners
  activePromptTextarea.addEventListener('input', () => {
    evaluatePrompt(activePromptTextarea.value);
  });

  btnRefreshPrompt.addEventListener('click', () => {
    queryActiveTabPrompt();
  });

  artifactTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.getAttribute('data-tab'));
    });
  });

  btnSwitchToGolden.addEventListener('click', () => {
    switchTab('golden');
  });

  btnCopyGolden.addEventListener('click', () => {
    if (!currentGoldenText) return;
    navigator.clipboard.writeText(currentGoldenText).then(() => {
      showToast('📋 Golden prompt copied to clipboard!');
    }).catch(() => {
      showToast('📋 Copied!');
    });
  });

  btnApplyGoldenToChat.addEventListener('click', () => {
    if (!currentGoldenText) return;

    if (typeof chrome === 'undefined' || !chrome.tabs || !activeTabId) {
      showToast('⚡ Golden prompt applied locally');
      activePromptTextarea.value = currentGoldenText;
      evaluatePrompt(currentGoldenText);
      return;
    }

    const tryReplace = () => {
      chrome.tabs.sendMessage(activeTabId, { type: 'REPLACE_PROMPT', text: currentGoldenText }, (res) => {
        if (chrome.runtime.lastError || !res || !res.success) {
          showToast('⚠️ Could not find chat input to replace');
        } else {
          showToast('⚡ Replaced draft with Golden Prompt in chat!');
          activePromptTextarea.value = currentGoldenText;
          evaluatePrompt(currentGoldenText);
        }
      });
    };

    chrome.tabs.sendMessage(activeTabId, { type: 'REPLACE_PROMPT', text: currentGoldenText }, (res) => {
      if (chrome.runtime.lastError || !res || !res.success) {
        // Attempt dynamic injection if content script wasn't active, then retry
        if (chrome.scripting && chrome.scripting.executeScript && activeTabId) {
          chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            files: ['content_script.js']
          }).then(() => {
            tryReplace();
          }).catch(() => {
            showToast('⚠️ Could not find chat input to replace');
          });
          return;
        }
        showToast('⚠️ Could not find chat input to replace');
      } else {
        showToast('⚡ Replaced draft with Golden Prompt in chat!');
        activePromptTextarea.value = currentGoldenText;
        evaluatePrompt(currentGoldenText);
      }
    });
  });

  // Initialize
  queryActiveTabPrompt();
  switchTab('score');
});

