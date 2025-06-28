document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('editorCanvas');
  const ctx = canvas.getContext('2d');

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "initEditor") {
      const img = new Image();
      img.onload = () => {
        canvas.width = request.rect.width;
        canvas.height = request.rect.height;

        // Draw the captured portion of the image onto the canvas
        ctx.drawImage(
          img,
          request.rect.x, request.rect.y, request.rect.width, request.rect.height, // Source rectangle
          0, 0, request.rect.width, request.rect.height // Destination rectangle
        );
      };
      img.src = request.screenshotUrl;
    }
  });
});