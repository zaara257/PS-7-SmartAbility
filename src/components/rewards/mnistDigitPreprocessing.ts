export interface PreprocessSuccess {
  kind: "success";
  inputValues: Float32Array;
  debug: {
    contrast: number;
    otsuThreshold: number;
    inkPixelCount: number;
    inkRatio: number;
    bbox: { x: number; y: number; w: number; h: number };
    centerOfMass: { cx: number; cy: number };
    shift: { dx: number; dy: number };
    previewCanvas?: HTMLCanvasElement;
  };
}

export interface PreprocessRejected {
  kind: "rejected";
  reason: string;
  debug?: {
    contrast?: number;
    otsuThreshold?: number;
    inkPixelCount?: number;
    inkRatio?: number;
  };
}

export type PreprocessResult = PreprocessSuccess | PreprocessRejected;

// Reusable canvas elements to prevent allocation churn in high-FPS loops
let highResCanvas: HTMLCanvasElement | null = null;
let digit28Canvas: HTMLCanvasElement | null = null;

/**
 * Calculates Otsu's optimal bimodal threshold from a 256-bin grayscale histogram.
 */
function computeOtsuThreshold(histogram: Int32Array, totalPixels: number): number {
  let sumAll = 0;
  for (let i = 0; i < 256; i++) {
    sumAll += i * histogram[i];
  }

  let sumBackground = 0;
  let weightBackground = 0;
  let maxVariance = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    weightBackground += histogram[t];
    if (weightBackground === 0) continue;

    const weightForeground = totalPixels - weightBackground;
    if (weightForeground === 0) break;

    sumBackground += t * histogram[t];

    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sumAll - sumBackground) / weightForeground;

    const varianceBetween =
      weightBackground * weightForeground * Math.pow(meanBackground - meanForeground, 2);

    if (varianceBetween > maxVariance) {
      maxVariance = varianceBetween;
      threshold = t;
    }
  }

  return threshold;
}

/**
 * Preprocesses a camera frame of a handwritten digit according to canonical MNIST conventions:
 * 1. High-resolution center crop (72% ROI) at 224x224.
 * 2. Grayscale conversion + 3x3 Gaussian smoothing.
 * 3. Otsu thresholding with dynamic polarity determination (ink is minority class).
 * 4. Noise cleanup & stroke density validation.
 * 5. Bounding box extraction and aspect-preserving scaling to 20x20.
 * 6. Placement in 28x28 frame and translation by Center-of-Mass (COM) to (14, 14).
 * 7. Normalization to Float32Array in [0, 1].
 */
export function preprocessMnistWrittenDigit(
  video: HTMLVideoElement,
  previewCanvas?: HTMLCanvasElement | null
): PreprocessResult {
  const vWidth = video.videoWidth;
  const vHeight = video.videoHeight;

  if (!vWidth || !vHeight) {
    return { kind: "rejected", reason: "Camera frame is not ready." };
  }

  // Allocate reusable canvases
  if (!highResCanvas) {
    highResCanvas = document.createElement("canvas");
    highResCanvas.width = 224;
    highResCanvas.height = 224;
  }
  if (!digit28Canvas) {
    digit28Canvas = document.createElement("canvas");
    digit28Canvas.width = 28;
    digit28Canvas.height = 28;
  }

  const ctx224 = highResCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx224) {
    return { kind: "rejected", reason: "Canvas 2D context unavailable." };
  }

  // Step 1: Center square ROI crop (matching visible 72% bounding box guide)
  const minDim = Math.min(vWidth, vHeight);
  const cropSize = minDim * 0.72;
  const sx = (vWidth - cropSize) / 2;
  const sy = (vHeight - cropSize) / 2;

  ctx224.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, 224, 224);

  const imgData = ctx224.getImageData(0, 0, 224, 224);
  const data = imgData.data;
  const numPixels = 224 * 224;

  const rawGrays = new Uint8Array(numPixels);
  const blurredGrays = new Uint8Array(numPixels);
  const histogram = new Int32Array(256);

  let minGray = 255;
  let maxGray = 0;

  // Step 2a: Convert to ITU-R BT.601 Grayscale
  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    rawGrays[i] = gray;
    if (gray < minGray) minGray = gray;
    if (gray > maxGray) maxGray = gray;
  }

  const contrast = maxGray - minGray;
  if (contrast < 28) {
    return {
      kind: "rejected",
      reason: "Show one handwritten number clearly inside the box 🌱",
      debug: { contrast },
    };
  }

  // Step 2b: 3x3 Gaussian smoothing to reduce sensor noise:
  // Kernel: [1 2 1; 2 4 2; 1 2 1] / 16
  for (let y = 1; y < 223; y++) {
    const yOffset = y * 224;
    for (let x = 1; x < 223; x++) {
      const sum =
        rawGrays[yOffset - 224 + (x - 1)] * 1 +
        rawGrays[yOffset - 224 + x] * 2 +
        rawGrays[yOffset - 224 + (x + 1)] * 1 +
        rawGrays[yOffset + (x - 1)] * 2 +
        rawGrays[yOffset + x] * 4 +
        rawGrays[yOffset + (x + 1)] * 2 +
        rawGrays[yOffset + 224 + (x - 1)] * 1 +
        rawGrays[yOffset + 224 + x] * 2 +
        rawGrays[yOffset + 224 + (x + 1)] * 1;
      const smoothed = sum >> 4;
      blurredGrays[yOffset + x] = smoothed;
      histogram[smoothed]++;
    }
  }

  // Step 3: Otsu optimal bimodal thresholding
  const otsuThreshold = computeOtsuThreshold(histogram, 222 * 222);

  // Step 4: Automatic Polarity Detection
  // In writing, ink is the minority pixel class (< 35% of frame)
  let countBelow = 0;
  let countAbove = 0;
  for (let y = 2; y < 222; y++) {
    const offset = y * 224;
    for (let x = 2; x < 222; x++) {
      if (blurredGrays[offset + x] < otsuThreshold) {
        countBelow++;
      } else {
        countAbove++;
      }
    }
  }

  // Determine which side is ink (minority class)
  const isDarkInk = countBelow <= countAbove;
  const inkMask = new Uint8Array(numPixels);
  let rawInkCount = 0;

  for (let y = 2; y < 222; y++) {
    const offset = y * 224;
    for (let x = 2; x < 222; x++) {
      const val = blurredGrays[offset + x];
      const isInk = isDarkInk ? val < otsuThreshold : val >= otsuThreshold;
      if (isInk) {
        inkMask[offset + x] = 1;
        rawInkCount++;
      }
    }
  }

  const inkRatio = rawInkCount / numPixels;

  // Step 5: Density and sanity checks
  // Must have enough ink pixels (not empty) and not too much ink (not covered/black scene)
  if (rawInkCount < 45 || inkRatio < 0.001) {
    return {
      kind: "rejected",
      reason: "Show one handwritten number inside the box 🌱",
      debug: { contrast, otsuThreshold, inkPixelCount: rawInkCount, inkRatio },
    };
  }

  if (inkRatio > 0.42) {
    return {
      kind: "rejected",
      reason: "Too dark or cluttered. Show one clear number on clean paper 🌱",
      debug: { contrast, otsuThreshold, inkPixelCount: rawInkCount, inkRatio },
    };
  }

  // Step 6: Find bounding box of ink pixels, ignoring single isolated noise specks
  let minX = 224;
  let maxX = 0;
  let minY = 224;
  let maxY = 0;
  let validInkCount = 0;

  for (let y = 3; y < 221; y++) {
    const offset = y * 224;
    for (let x = 3; x < 221; x++) {
      if (inkMask[offset + x] === 1) {
        // Simple 4-neighbor check to reject isolated single-pixel salt noise
        const neighbors =
          inkMask[offset - 224 + x] +
          inkMask[offset + 224 + x] +
          inkMask[offset + x - 1] +
          inkMask[offset + x + 1];
        if (neighbors >= 1) {
          validInkCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  if (validInkCount < 40 || maxX <= minX || maxY <= minY) {
    return {
      kind: "rejected",
      reason: "Show one handwritten number inside the box 🌱",
      debug: { contrast, otsuThreshold, inkPixelCount: validInkCount, inkRatio },
    };
  }

  const bboxW = maxX - minX + 1;
  const bboxH = maxY - minY + 1;

  // If bounding box is abnormally tiny or stretched like a line
  if (bboxW < 8 && bboxH < 8) {
    return {
      kind: "rejected",
      reason: "Bring the number a little closer 🌱",
      debug: { contrast, otsuThreshold, inkPixelCount: validInkCount, inkRatio },
    };
  }

  // Step 7: Create 20x20 scaled digit inside temporary canvas preserving aspect ratio
  // MNIST digits fit within a 20x20 box inside the 28x28 image
  const scale = 20 / Math.max(bboxW, bboxH);
  const targetW = Math.max(1, Math.round(bboxW * scale));
  const targetH = Math.max(1, Math.round(bboxH * scale));

  // Extract ink bounding box as clean black-background white-stroke image
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = bboxW;
  cropCanvas.height = bboxH;
  const cropCtx = cropCanvas.getContext("2d");
  if (!cropCtx) {
    return { kind: "rejected", reason: "Canvas context error" };
  }

  const cropImgData = cropCtx.createImageData(bboxW, bboxH);
  const cropPixels = cropImgData.data;

  for (let y = 0; y < bboxH; y++) {
    const srcY = minY + y;
    const srcOffset = srcY * 224;
    for (let x = 0; x < bboxW; x++) {
      const srcX = minX + x;
      const dstIdx = (y * bboxW + x) * 4;
      const isInk = inkMask[srcOffset + srcX] === 1;
      // White stroke (255) on black background (0)
      const val = isInk ? 255 : 0;
      cropPixels[dstIdx] = val;
      cropPixels[dstIdx + 1] = val;
      cropPixels[dstIdx + 2] = val;
      cropPixels[dstIdx + 3] = 255;
    }
  }
  cropCtx.putImageData(cropImgData, 0, 0);

  // Clear 28x28 canvas to black
  const ctx28 = digit28Canvas.getContext("2d");
  if (!ctx28) {
    return { kind: "rejected", reason: "Canvas context error" };
  }
  ctx28.fillStyle = "black";
  ctx28.fillRect(0, 0, 28, 28);

  // Initial placement centered in 20x20 area (padded by 4 pixels)
  const initialX = Math.round(4 + (20 - targetW) / 2);
  const initialY = Math.round(4 + (20 - targetH) / 2);

  ctx28.imageSmoothingEnabled = true;
  ctx28.imageSmoothingQuality = "high";
  ctx28.drawImage(cropCanvas, 0, 0, bboxW, bboxH, initialX, initialY, targetW, targetH);

  // Step 8: Center of Mass (COM) Calculation & Centering at (14, 14)
  const data28 = ctx28.getImageData(0, 0, 28, 28).data;
  let sumMass = 0;
  let sumX = 0;
  let sumY = 0;

  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      const mass = data28[(y * 28 + x) * 4]; // R channel represents grayscale
      if (mass > 0) {
        sumMass += mass;
        sumX += x * mass;
        sumY += y * mass;
      }
    }
  }

  let dx = 0;
  let dy = 0;
  let cx = 14;
  let cy = 14;

  if (sumMass > 0) {
    cx = sumX / sumMass;
    cy = sumY / sumMass;
    dx = Math.round(14 - cx);
    dy = Math.round(14 - cy);

    // Limit shift within safe range to prevent clipping
    dx = Math.max(-4, Math.min(4, dx));
    dy = Math.max(-4, Math.min(4, dy));

    if (dx !== 0 || dy !== 0) {
      // Re-draw with COM shift applied
      const temp28 = document.createElement("canvas");
      temp28.width = 28;
      temp28.height = 28;
      const tempCtx = temp28.getContext("2d");
      if (tempCtx) {
        tempCtx.drawImage(digit28Canvas, 0, 0);
        ctx28.fillStyle = "black";
        ctx28.fillRect(0, 0, 28, 28);
        ctx28.drawImage(temp28, dx, dy);
      }
    }
  }

  // Step 9: Convert final 28x28 canvas to Float32Array in [0, 1]
  const finalData = ctx28.getImageData(0, 0, 28, 28).data;
  const inputValues = new Float32Array(28 * 28);

  for (let i = 0; i < 28 * 28; i++) {
    // Normalize [0..255] to [0..1]
    const pixelVal = finalData[i * 4] / 255.0;
    inputValues[i] = pixelVal;
  }

  // Optional preview update for debug canvas
  if (previewCanvas) {
    const pCtx = previewCanvas.getContext("2d");
    if (pCtx) {
      previewCanvas.width = 112;
      previewCanvas.height = 112;
      pCtx.imageSmoothingEnabled = false; // Nearest-neighbor pixelated display
      pCtx.drawImage(digit28Canvas, 0, 0, 28, 28, 0, 0, 112, 112);
    }
  }

  return {
    kind: "success",
    inputValues,
    debug: {
      contrast,
      otsuThreshold,
      inkPixelCount: validInkCount,
      inkRatio,
      bbox: { x: minX, y: minY, w: bboxW, h: bboxH },
      centerOfMass: { cx: Math.round(cx * 10) / 10, cy: Math.round(cy * 10) / 10 },
      shift: { dx, dy },
      previewCanvas: digit28Canvas,
    },
  };
}
