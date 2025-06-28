console.log("Screenshot Capture Pro content script injected!");

let overlay = null;
let selectionDiv = null;
let startX, startY;
let isSelecting = false;
let captureActive = false; // New flag to track if a capture is in progress

let originalBodyMargin = '';
let originalBodyPadding = '';
let originalHtmlMargin = '';
let originalHtmlPadding = '';
let originalBodyPosition = '';
let originalBodyTransform = '';
let originalHtmlPosition = '';
let originalHtmlTransform = '';
let originalBodyOverflow = '';
let originalHtmlOverflow = '';

// Function to clean up existing capture UI and reset state
function cleanupCapture() {
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
  if (selectionDiv && selectionDiv.parentNode) {
    selectionDiv.parentNode.removeChild(selectionDiv);
  }
  document.body.style.cursor = 'default';
  captureActive = false;
  overlay = null;
  selectionDiv = null;
  // Remove event listeners to prevent memory leaks and duplicate behavior
  document.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('mousemove', updateSelection);
  window.removeEventListener('mouseup', endSelection);

  // Restore original body and html styles
  document.body.style.margin = originalBodyMargin;
  document.body.style.padding = originalBodyPadding;
  document.documentElement.style.margin = originalHtmlMargin;
  document.documentElement.style.padding = originalHtmlPadding;

  // Restore original position and transform
  document.body.style.position = originalBodyPosition;
  document.body.style.transform = originalBodyTransform;
  document.documentElement.style.position = originalHtmlPosition;
  document.documentElement.style.transform = originalHtmlTransform;

  // Restore original width and height for html and body
  document.documentElement.style.width = '';
  document.documentElement.style.height = '';
  document.body.style.width = '';
  document.body.style.height = '';

  // Restore original overflow styles
  document.documentElement.style.overflow = originalHtmlOverflow;
  document.body.style.overflow = originalBodyOverflow;
}

function createOverlay() {
  // If a capture is already active, clean up and restart
  if (captureActive) {
    cleanupCapture();
  }
  captureActive = true;

  // Store original body and html styles
  originalBodyMargin = document.body.style.margin;
  originalBodyPadding = document.body.style.padding;
  originalHtmlMargin = document.documentElement.style.margin;
  originalHtmlPadding = document.documentElement.style.padding;
  originalBodyPosition = document.body.style.position;
  originalBodyTransform = document.body.style.transform;
  originalHtmlPosition = document.documentElement.style.position;
  originalHtmlTransform = document.documentElement.style.transform;
  originalBodyOverflow = document.body.style.overflow;
  originalHtmlOverflow = document.documentElement.style.overflow;

  // Store original body and html overflow styles
  originalBodyOverflow = document.body.style.overflow;
  originalHtmlOverflow = document.documentElement.style.overflow;

  // Reset body and html margins/paddings to prevent offset issues
  document.body.style.margin = '0 !important';
  document.body.style.padding = '0 !important';
  document.documentElement.style.margin = '0 !important';
  document.documentElement.style.padding = '0 !important';

  // Temporarily hide overflow on html and body to prevent scrollbars during capture
  document.documentElement.style.overflow = 'hidden !important';
  document.body.style.overflow = 'hidden !important';

  // Reset position and transform to ensure fixed positioning works correctly
  document.body.style.position = 'absolute';
  document.body.style.top = '0';
  document.body.style.left = '0';
  document.body.style.transform = 'none';
  document.documentElement.style.position = 'absolute';
  document.documentElement.style.top = '0';
  document.documentElement.style.left = '0';
  document.documentElement.style.transform = 'none';

  // Ensure html and body take full height and width
  document.documentElement.style.width = '100%';
  document.documentElement.style.height = '100%';
  document.body.style.width = '100%';
  document.body.style.height = '100%';

  overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.width = '100vw'; // Ensure it covers the full viewport width
  overlay.style.height = '100vh'; // Ensure it covers the full viewport height
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
  overlay.style.zIndex = '99999';
  overlay.style.cursor = 'crosshair'; // Apply crosshair to the overlay
  overlay.style.boxSizing = 'border-box'; // Ensure consistent sizing
  document.documentElement.appendChild(overlay); // Append to document.documentElement

  // Temporarily hide overflow on html and body to prevent scrollbars during capture
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  overlay.addEventListener('mousedown', startSelection);
  // Attach mousemove and mouseup to window for more reliable drag handling
  window.addEventListener('mousemove', updateSelection);
  window.addEventListener('mouseup', endSelection);

  // Add an escape key listener to cancel the selection
  document.addEventListener('keydown', handleKeyDown);
}

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    console.log("Capture cancelled by Escape key.");
    cleanupCapture();
  }
}

function startSelection(e) {
  isSelecting = true;
  const overlayRect = overlay.getBoundingClientRect();
  startX = e.clientX - overlayRect.left;
  startY = e.clientY - overlayRect.top;

  selectionDiv = document.createElement('div');
  selectionDiv.style.position = 'absolute';
  selectionDiv.style.border = '1px dashed red';
  selectionDiv.style.backgroundColor = 'transparent';
  selectionDiv.style.zIndex = '100000';
  overlay.appendChild(selectionDiv); // Append to the overlay
}

function updateSelection(e) {
  if (!isSelecting) return;

  const currentX = e.clientX - overlay.getBoundingClientRect().left;
  const currentY = e.clientY - overlay.getBoundingClientRect().top;

  const minX = Math.min(startX, currentX);
  const minY = Math.min(startY, currentY);
  const maxX = Math.max(startX, currentX);
  const maxY = Math.max(startY, currentY);

  selectionDiv.style.left = `${minX}px`;
  selectionDiv.style.top = `${minY}px`;
  selectionDiv.style.width = `${maxX - minX}px`;
  selectionDiv.style.height = `${maxY - minY}px`;
}

function endSelection(e) {
  isSelecting = false;

  if (selectionDiv) {
    const rect = selectionDiv.getBoundingClientRect();
    console.log("Selected area:", {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    });

    // Capture the visible tab and send the image data to the background script
    chrome.runtime.sendMessage({
      action: "captureAndEdit",
      rect: {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height
      }
    });
  }
  cleanupCapture(); // Clean up after selection is done
}

// Initial call to start the capture process when the script is injected
createOverlay();