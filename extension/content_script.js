/**
 * PromptScore Content Script
 * Reads selected/draft prompt text and safely writes improved prompt back to composer.
 * Works across Claude.ai, ChatGPT, and generic chat surfaces.
 */

(() => {
  if (window.__PROMPTSCORE_INJECTED__) {
    return;
  }
  window.__PROMPTSCORE_INJECTED__ = true;

  // Listen for queries from the Side Panel
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_PROMPT') {
      const selected = window.getSelection() ? window.getSelection().toString().trim() : '';
      if (selected && selected.length >= 3) {
        sendResponse({ success: true, text: selected, source: 'selection' });
        return true;
      }

      const composer = findComposerElement();
      if (composer) {
        const text = getElementText(composer);
        sendResponse({ success: Boolean(text), text: text || '', source: 'composer' });
      } else {
        sendResponse({ success: false, text: '', source: 'none' });
      }
      return true;
    }

    if (message.type === 'REPLACE_PROMPT') {
      const success = replaceComposerText(message.text);
      sendResponse({ success });
      return true;
    }
  });

  function findComposerElement() {
    // 1. Active element if input/textarea/contenteditable
    const active = document.activeElement;
    if (active && (active.tagName === 'TEXTAREA' || active.isContentEditable || active.tagName === 'INPUT')) {
      return active;
    }

    // 2. Claude, ChatGPT, or standard chat selectors in priority order
    const selectors = [
      'div[contenteditable="true"].ProseMirror',
      'div[contenteditable="true"][role="textbox"]',
      'div.ProseMirror[contenteditable="true"]',
      'div[contenteditable="true"]',
      '#prompt-textarea',
      'div[role="textbox"]',
      'fieldset div[contenteditable="true"]',
      'textarea[placeholder*="prompt" i]',
      'textarea[placeholder*="message" i]',
      'textarea[placeholder*="reply" i]',
      'textarea',
      'fieldset textarea'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function getElementText(el) {
    if (!el) return '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      return el.value.trim();
    }
    if (el.isContentEditable) {
      // In ProseMirror/Claude, innerText captures paragraph newlines cleanly
      const text = el.innerText || el.textContent || '';
      return text.trim();
    }
    return '';
  }

  function replaceComposerText(newText) {
    const el = findComposerElement();
    if (!el) return false;

    el.focus();

    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      el.value = newText;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    if (el.isContentEditable) {
      let applied = false;
      try {
        // Select all existing content
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }

        // Standard execCommand handled by ProseMirror / Draft.js / Lexical
        applied = document.execCommand('insertText', false, newText);
      } catch (e) {
        applied = false;
      }

      // If execCommand failed or didn't update DOM, construct paragraph structure
      if (!applied || getElementText(el) !== newText.trim()) {
        try {
          el.innerHTML = '';
          const lines = newText.split('\n');
          for (const line of lines) {
            const p = document.createElement('p');
            p.textContent = line || '\u00A0';
            el.appendChild(p);
          }
          applied = true;
        } catch (e) {
          el.innerText = newText;
          applied = true;
        }
      }

      // Dispatch synthetic input events to trigger React / ProseMirror state machine
      try {
        el.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: newText }));
      } catch (e) {
        // fallback
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    return false;
  }

  // --- Proactive sync with Side Panel on typing or selection ---
  let inputTimer = null;
  function notifyChange(source) {
    clearTimeout(inputTimer);
    inputTimer = setTimeout(() => {
      const selected = window.getSelection() ? window.getSelection().toString().trim() : '';
      if (selected && selected.length >= 3) {
        trySendMessage({ type: 'PROMPT_CHANGED', text: selected, source: 'selection' });
        return;
      }

      const composer = findComposerElement();
      if (composer) {
        const text = getElementText(composer);
        if (text) {
          trySendMessage({ type: 'PROMPT_CHANGED', text, source: 'composer' });
        }
      }
    }, 200);
  }

  function trySendMessage(msg) {
    try {
      chrome.runtime.sendMessage(msg, () => {
        // Suppress error if side panel is closed
        if (chrome.runtime.lastError) {
          /* noop */
        }
      });
    } catch (e) {
      /* extension context might be invalidated */
    }
  }

  // Listen to typing in document
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el && (el.isContentEditable || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
      notifyChange('composer');
    }
  }, true);

  // Listen to selection changes
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length >= 3) {
      notifyChange('selection');
    }
  });

  // Initial probe on load
  setTimeout(() => {
    notifyChange('initial');
  }, 300);
})();
