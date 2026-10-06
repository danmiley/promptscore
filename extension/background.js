/**
 * PromptScore — Background Service Worker
 * Configures Chrome sidePanel behavior to open on action toolbar click.
 */

chrome.runtime.onInstalled.addListener(async () => {
  console.log('PromptScore Extension installed or updated.');
  // Inject content script into all currently open matching tabs so refresh is not required
  try {
    const tabs = await chrome.tabs.query({
      url: [
        'https://claude.ai/*',
        'https://chatgpt.com/*',
        'https://chat.openai.com/*',
        'http://localhost/*',
        'http://127.0.0.1/*'
      ]
    });
    for (const tab of tabs) {
      if (tab.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content_script.js']
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Could not inject content script into existing tabs:', err);
  }
});

// Configure Side Panel to automatically open when user clicks the extension action icon in Chrome toolbar
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('PromptScore setPanelBehavior failed:', error));
}
