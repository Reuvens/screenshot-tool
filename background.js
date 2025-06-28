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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureAndEdit") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (screenshotUrl) => {
      if (chrome.runtime.lastError) {
        console.error("captureVisibleTab failed: ", chrome.runtime.lastError.message);
        return;
      }

      // Open editor.html in a new tab and pass the screenshot and rect data
      chrome.tabs.create({ url: chrome.runtime.getURL("editor.html") }, (newTab) => {
        // Once the new tab is loaded, send the data to its content script
        // A more robust solution would involve message passing after the editor.html is fully loaded
        // For now, a small delay might be necessary or use chrome.tabs.sendMessage after tab is updated
        setTimeout(() => {
          chrome.tabs.sendMessage(newTab.id, {
            action: "initEditor",
            screenshotUrl: screenshotUrl,
            rect: request.rect
          });
        }, 500); // Small delay to ensure editor.html is ready
      });
    });
    return true; // Indicates that sendResponse will be called asynchronously
  }
});