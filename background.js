chrome.action.onClicked.addListener((tab) => {
  console.log("Extension icon clicked!");
  if (tab && tab.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Script injection failed: ", chrome.runtime.lastError.message);
      } else {
        console.log("Content script injection attempted.");
      }
    });
  } else {
    console.error("No active tab found.");
  }
});