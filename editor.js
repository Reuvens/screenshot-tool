document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('editorCanvas');
  const ctx = canvas.getContext('2d');

  // Get tool buttons
  const rectToolBtn = document.getElementById('rectTool');
  const circleToolBtn = document.getElementById('circleTool');
  const penToolBtn = document.getElementById('penTool');
  const blurToolBtn = document.getElementById('blurTool');

  // Get action buttons
  const downloadBtn = document.getElementById('downloadBtn');
  const copyBtn = document.getElementById('copyBtn');
  const driveLinkBtn = document.getElementById('driveLinkBtn');

  let currentTool = null;
  let isDrawing = false;
  let startX, startY;
  let originalImageData = null; // To store the initial screenshot for redraws

  // Set default drawing color
  ctx.strokeStyle = '#FF0000';
  ctx.fillStyle = '#FF0000';
  ctx.lineWidth = 2;

  // Event Listeners for tools
  rectToolBtn.addEventListener('click', () => currentTool = 'rectangle');
  circleToolBtn.addEventListener('click', () => currentTool = 'circle');
  penToolBtn.addEventListener('click', () => currentTool = 'pen');
  blurToolBtn.addEventListener('click', () => currentTool = 'blur');

  // Event Listeners for action buttons
  downloadBtn.addEventListener('click', () => {
    const dataURL = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'screenshot.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  copyBtn.addEventListener('click', () => {
    canvas.toBlob((blob) => {
      const item = new ClipboardItem({ "image/png": blob });
      navigator.clipboard.write([item]).then(() => {
        console.log('Image copied to clipboard!');
        const confirmationMessage = document.getElementById('confirmationMessage');
        confirmationMessage.classList.remove('hidden');
        confirmationMessage.classList.add('show');
        setTimeout(() => {
          confirmationMessage.classList.remove('show');
          confirmationMessage.classList.add('hidden');
        }, 2000); // Hide after 2 seconds
      }).catch((err) => {
        console.error('Failed to copy image: ', err);
      });
    }, 'image/png');
  });

  driveLinkBtn.addEventListener('click', () => console.log('Get Drive Link clicked'));

  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    startX = e.offsetX;
    startY = e.offsetY;

    if (currentTool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;

    const currentX = e.offsetX;
    const currentY = e.offsetY;

    if (currentTool === 'pen') {
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
    } else if (currentTool === 'rectangle') {
      // Clear previous drawing for live preview (more advanced)
      // For now, just draw directly
    } else if (currentTool === 'blur') {
      redrawCanvas();
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      blurArea(x, y, width, height);
    }
  });

  canvas.addEventListener('mouseup', (e) => {
    isDrawing = false;
    const endX = e.offsetX;
    const endY = e.offsetY;

    if (currentTool === 'rectangle') {
      const width = endX - startX;
      const height = endY - startY;
      ctx.strokeRect(startX, startY, width, height);
    } else if (currentTool === 'circle') {
      const radiusX = Math.abs(endX - startX) / 2;
      const radiusY = Math.abs(endY - startY) / 2;
      const centerX = Math.min(startX, endX) + radiusX;
      const centerY = Math.min(startY, endY) + radiusY;

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (currentTool === 'pen') {
      ctx.closePath();
    } else if (currentTool === 'blur') {
      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);
      blurArea(x, y, width, height, true); // Apply permanent blur
    }
    // Update originalImageData after a permanent drawing action
    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  });

  function blurArea(x, y, width, height, permanent = false) {
    const imageData = ctx.getImageData(x, y, width, height);
    const pixels = imageData.data;
    const pixelSize = 8; // Adjust for more or less pixelation

    for (let i = 0; i < height; i += pixelSize) {
      for (let j = 0; j < width; j += pixelSize) {
        const pixelIndex = ((i + y) * canvas.width + (j + x)) * 4;
        const red = pixels[pixelIndex];
        const green = pixels[pixelIndex + 1];
        const blue = pixels[pixelIndex + 2];

        for (let row = 0; row < pixelSize; row++) {
          for (let col = 0; col < pixelSize; col++) {
            const currentPixelIndex = ((i + row + y) * canvas.width + (j + col + x)) * 4;
            if (currentPixelIndex < pixels.length) {
              pixels[currentPixelIndex] = red;
              pixels[currentPixelIndex + 1] = green;
              pixels[currentPixelIndex + 2] = blue;
            }
          }
        }
      }
    }
    if (permanent) {
      ctx.putImageData(imageData, x, y);
    } else {
      // For live preview, draw on a temporary canvas or restore original and draw
      // For simplicity, we'll just redraw the whole canvas and then the blur area
      // This is not ideal for performance but works for a basic implementation
      ctx.putImageData(imageData, x, y);
    }
  }

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
        originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      };
      img.src = request.screenshotUrl;
    }
  });

  function redrawCanvas() {
    ctx.putImageData(originalImageData, 0, 0);
  }

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;

    const currentX = e.offsetX;
    const currentY = e.offsetY;

    if (currentTool === 'pen') {
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
    } else if (currentTool === 'rectangle') {
      redrawCanvas();
      const width = currentX - startX;
      const height = currentY - startY;
      ctx.strokeRect(startX, startY, width, height);
    } else if (currentTool === 'circle') {
      redrawCanvas();
      const radiusX = Math.abs(currentX - startX) / 2;
      const radiusY = Math.abs(currentY - startY) / 2;
      const centerX = startX + (currentX - startX) / 2;
      const centerY = startY + (currentY - startY) / 2;

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
    }
  });
});