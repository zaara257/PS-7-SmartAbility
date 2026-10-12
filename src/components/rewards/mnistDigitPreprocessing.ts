const WORKING_SIZE = 256;
const MNIST_SIZE = 28;
const INNER_DIGIT_SIZE = 20;

export type MnistDigitPreprocessResult =
  | { kind: "accepted"; inputValues: Float32Array; cropDescription: string }
  | { kind: "rejected"; reason: string };

type Component = {
  area: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function toGrayscale(rgba: Uint8ClampedArray) {
  const grayscale = new Uint8Array(rgba.length / 4);
  for (let index = 0; index < grayscale.length; index += 1) {
    const rgbaIndex = index * 4;
    grayscale[index] = Math.round(
      rgba[rgbaIndex] * 0.299 + rgba[rgbaIndex + 1] * 0.587 + rgba[rgbaIndex + 2] * 0.114,
    );
  }
  return grayscale;
}

function gaussianBlur(source: Uint8Array, width: number, height: number) {
  const result = new Uint8Array(source.length);
  const kernel = [1, 4, 6, 4, 1];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      for (let kernelY = -2; kernelY <= 2; kernelY += 1) {
        for (let kernelX = -2; kernelX <= 2; kernelX += 1) {
          const sourceX = clamp(x + kernelX, 0, width - 1);
          const sourceY = clamp(y + kernelY, 0, height - 1);
          sum += source[sourceY * width + sourceX] * kernel[kernelX + 2] * kernel[kernelY + 2];
        }
      }
      result[y * width + x] = Math.round(sum / 256);
    }
  }
  return result;
}

function otsuThreshold(source: Uint8Array) {
  const histogram = new Uint32Array(256);
  source.forEach((value) => { histogram[value] += 1; });
  const total = source.length;
  let totalIntensity = 0;
  histogram.forEach((count, value) => { totalIntensity += value * count; });

  let backgroundWeight = 0;
  let backgroundIntensity = 0;
  let bestVariance = -1;
  let bestThreshold = 0;
  for (let threshold = 0; threshold < 256; threshold += 1) {
    backgroundWeight += histogram[threshold];
    if (backgroundWeight === 0) continue;
    const foregroundWeight = total - backgroundWeight;
    if (foregroundWeight === 0) break;
    backgroundIntensity += threshold * histogram[threshold];
    const backgroundMean = backgroundIntensity / backgroundWeight;
    const foregroundMean = (totalIntensity - backgroundIntensity) / foregroundWeight;
    const variance = backgroundWeight * foregroundWeight * (backgroundMean - foregroundMean) ** 2;
    if (variance > bestVariance) {
      bestVariance = variance;
      bestThreshold = threshold;
    }
  }
  return bestThreshold;
}

function erode(source: Uint8Array, width: number, height: number) {
  const result = new Uint8Array(source.length);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let allForeground = true;
      for (let offsetY = -1; offsetY <= 1 && allForeground; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (source[(y + offsetY) * width + x + offsetX] === 0) {
            allForeground = false;
            break;
          }
        }
      }
      result[y * width + x] = allForeground ? 255 : 0;
    }
  }
  return result;
}

function dilate(source: Uint8Array, width: number, height: number) {
  const result = new Uint8Array(source.length);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let anyForeground = false;
      for (let offsetY = -1; offsetY <= 1 && !anyForeground; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (source[(y + offsetY) * width + x + offsetX] !== 0) {
            anyForeground = true;
            break;
          }
        }
      }
      result[y * width + x] = anyForeground ? 255 : 0;
    }
  }
  return result;
}

function openThenClose(source: Uint8Array, width: number, height: number) {
  return erode(dilate(dilate(erode(source, width, height), width, height), width, height), width, height);
}

function findComponents(source: Uint8Array, width: number, height: number) {
  const visited = new Uint8Array(source.length);
  const queue = new Int32Array(source.length);
  const components: Component[] = [];
  const directions = [-1, 0, 1];
  for (let start = 0; start < source.length; start += 1) {
    if (source[start] === 0 || visited[start] !== 0) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    visited[start] = 1;
    let area = 0;
    let left = width;
    let top = height;
    let right = 0;
    let bottom = 0;
    while (head < tail) {
      const current = queue[head++];
      const x = current % width;
      const y = Math.floor(current / width);
      area += 1;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      for (const offsetY of directions) {
        for (const offsetX of directions) {
          if (offsetX === 0 && offsetY === 0) continue;
          const nextX = x + offsetX;
          const nextY = y + offsetY;
          if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
          const next = nextY * width + nextX;
          if (source[next] !== 0 && visited[next] === 0) {
            visited[next] = 1;
            queue[tail++] = next;
          }
        }
      }
    }
    components.push({ area, left, top, right, bottom });
  }
  return components;
}

function binaryCanvas(source: Uint8Array, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to create an image-processing canvas.");
  const imageData = context.createImageData(width, height);
  for (let index = 0; index < source.length; index += 1) {
    const rgbaIndex = index * 4;
    const value = source[index];
    imageData.data[rgbaIndex] = value;
    imageData.data[rgbaIndex + 1] = value;
    imageData.data[rgbaIndex + 2] = value;
    imageData.data[rgbaIndex + 3] = 255;
  }
  context.putImageData(imageData, 0, 0);
  return canvas;
}

function centerDigit(source: Uint8Array, width: number, height: number, component: Component) {
  const padding = Math.max(6, Math.round(Math.max(width, height) * 0.2));
  const left = Math.max(0, component.left - padding);
  const top = Math.max(0, component.top - padding);
  const right = Math.min(width - 1, component.right + padding);
  const bottom = Math.min(height - 1, component.bottom + padding);
  const cropWidth = right - left + 1;
  const cropHeight = bottom - top + 1;
  const cropped = new Uint8Array(cropWidth * cropHeight);
  for (let y = 0; y < cropHeight; y += 1) {
    cropped.set(source.slice((top + y) * width + left, (top + y) * width + left + cropWidth), y * cropWidth);
  }
  const sourceCanvas = binaryCanvas(cropped, cropWidth, cropHeight);
  const canvas = document.createElement("canvas");
  canvas.width = MNIST_SIZE;
  canvas.height = MNIST_SIZE;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Unable to create the MNIST canvas.");
  const scale = INNER_DIGIT_SIZE / Math.max(component.right - component.left + 1, component.bottom - component.top + 1);
  const scaledWidth = Math.max(1, Math.round((component.right - component.left + 1) * scale));
  const scaledHeight = Math.max(1, Math.round((component.bottom - component.top + 1) * scale));
  context.imageSmoothingEnabled = true;
  context.drawImage(sourceCanvas, 0, 0, cropWidth, cropHeight, (MNIST_SIZE - scaledWidth) / 2, (MNIST_SIZE - scaledHeight) / 2, scaledWidth, scaledHeight);

  const firstPass = context.getImageData(0, 0, MNIST_SIZE, MNIST_SIZE).data;
  let mass = 0;
  let sumX = 0;
  let sumY = 0;
  for (let y = 0; y < MNIST_SIZE; y += 1) {
    for (let x = 0; x < MNIST_SIZE; x += 1) {
      const value = firstPass[(y * MNIST_SIZE + x) * 4];
      mass += value;
      sumX += x * value;
      sumY += y * value;
    }
  }
  if (mass === 0) throw new Error("No digit pixels remain after centering.");
  const shifted = document.createElement("canvas");
  shifted.width = MNIST_SIZE;
  shifted.height = MNIST_SIZE;
  const shiftedContext = shifted.getContext("2d", { willReadFrequently: true });
  if (!shiftedContext) throw new Error("Unable to center the MNIST canvas.");
  shiftedContext.imageSmoothingEnabled = true;
  shiftedContext.drawImage(canvas, MNIST_SIZE / 2 - sumX / mass, MNIST_SIZE / 2 - sumY / mass);
  const centered = shiftedContext.getImageData(0, 0, MNIST_SIZE, MNIST_SIZE).data;
  const values = new Float32Array(MNIST_SIZE * MNIST_SIZE);
  for (let index = 0; index < values.length; index += 1) values[index] = centered[index * 4] / 255;
  return values;
}

/** Browser-compatible equivalent of the experimental OpenCV digit pipeline. */
export function preprocessMnistWrittenDigit(video: HTMLVideoElement, canvas: HTMLCanvasElement): MnistDigitPreprocessResult {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || !video.videoWidth || !video.videoHeight) return { kind: "rejected", reason: "Camera frame is unavailable" };

  const insetX = Math.round(video.videoWidth * 0.12);
  const insetY = Math.round(video.videoHeight * 0.12);
  const sourceWidth = video.videoWidth - insetX * 2;
  const sourceHeight = video.videoHeight - insetY * 2;
  canvas.width = WORKING_SIZE;
  canvas.height = WORKING_SIZE;
  // No horizontal mirror: MNIST expects normal left-to-right paper writing.
  context.drawImage(video, insetX, insetY, sourceWidth, sourceHeight, 0, 0, WORKING_SIZE, WORKING_SIZE);
  const grayscale = toGrayscale(context.getImageData(0, 0, WORKING_SIZE, WORKING_SIZE).data);
  const blurred = gaussianBlur(grayscale, WORKING_SIZE, WORKING_SIZE);
  const threshold = otsuThreshold(blurred);
  const binary = new Uint8Array(blurred.length);
  for (let index = 0; index < binary.length; index += 1) binary[index] = blurred[index] <= threshold ? 255 : 0;
  const cleaned = openThenClose(binary, WORKING_SIZE, WORKING_SIZE);
  const inkArea = cleaned.reduce((count, value) => count + (value !== 0 ? 1 : 0), 0);
  const totalArea = WORKING_SIZE * WORKING_SIZE;
  if (inkArea < totalArea * 0.003) return { kind: "rejected", reason: "No digit detected" };
  if (inkArea > totalArea * 0.62) return { kind: "rejected", reason: "Ink area too large" };

  const minimumArea = totalArea * 0.008;
  const maximumArea = totalArea * 0.5;
  const borderMargin = Math.max(3, Math.round(WORKING_SIZE * 0.02));
  const components = findComponents(cleaned, WORKING_SIZE, WORKING_SIZE);
  const candidates = components.filter((component) => {
    const width = component.right - component.left + 1;
    const height = component.bottom - component.top + 1;
    const ratio = width / height;
    return component.area >= minimumArea && component.area <= maximumArea && width >= 10 && height >= 12 && ratio >= 0.1 && ratio <= 3.5;
  }).sort((first, second) => second.area - first.area);
  if (!candidates.length) return { kind: "rejected", reason: "Digit too small" };
  const digit = candidates[0];
  const touchesBorder = digit.left <= borderMargin || digit.top <= borderMargin || digit.right >= WORKING_SIZE - borderMargin || digit.bottom >= WORKING_SIZE - borderMargin;
  if (touchesBorder) return { kind: "rejected", reason: "Digit touches border" };
  if (candidates[1] && candidates[1].area >= digit.area * 0.35) return { kind: "rejected", reason: "Multiple marks detected" };
  const digitWidth = digit.right - digit.left + 1;
  const digitHeight = digit.bottom - digit.top + 1;
  if (digit.area / (digitWidth * digitHeight) < 0.035) return { kind: "rejected", reason: "Digit too faint" };

  return {
    kind: "accepted",
    inputValues: centerDigit(cleaned, WORKING_SIZE, WORKING_SIZE, digit),
    cropDescription: `unmirrored source crop x=${insetX}, y=${insetY}, ${sourceWidth}×${sourceHeight}; processed at ${WORKING_SIZE}×${WORKING_SIZE} and centered to 28×28`,
  };
}
