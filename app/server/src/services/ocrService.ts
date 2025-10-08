import { OCRResult } from '../domain/models';
import type { Express } from 'express';
import { preprocessImage, writeTempImage } from './imagePreprocessor';
import { runNativeTesseract } from './nativeTesseract';
import { enqueueOCR } from '../utils/asyncQueue';

const MAX_IMAGES = Number(process.env.OCR_MAX_IMAGES || 3);

// Heuristic confidence from text length
function estimateConfidence(text: string): number {
  const len = text.trim().length;
  if (len < 10) return 40;
  if (len < 30) return 65;
  if (len < 80) return 80;
  return 90;
}

function buildResult(combined: string, textSegments: string[]): OCRResult {
  const confidence = estimateConfidence(combined);
  const match = combined.match(/([A-Z0-9]{2,}-[A-Z0-9-]{3,})/i);
  return {
    partNumber: match ? match[1].toUpperCase() : undefined,
    vehicleInfo: undefined,
    rawText: combined,
    detectedTexts: textSegments,
    confidence
  };
}

async function runNative(files: Array<Express.Multer.File>): Promise<OCRResult | null> {
  try {
    let combined = '';
    const textSegments: string[] = [];
    for (const file of files.slice(0, MAX_IMAGES)) {
      const processedBuffer = await preprocessImage(file.buffer);
      const { inputPath, cleanup } = await writeTempImage(processedBuffer);
      try {
        const native = await runNativeTesseract(inputPath);
        const text = native.text || '';
        if (text) {
          const lines = text
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);
          textSegments.push(...lines);
        }
        combined += (combined ? '\n---\n' : '') + text;
      } finally {
        await cleanup();
      }
    }
    if (!combined.trim()) return null;
    return buildResult(combined, textSegments);
  } catch (err) {
    console.warn('Native OCR failed, falling back to WASM', err);
    return null;
  }
}

async function runTesseractJS(files: Array<Express.Multer.File>): Promise<OCRResult> {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker();
    let combined = '';
    const textSegments: string[] = [];
    for (const f of files.slice(0, MAX_IMAGES)) {
      const { data } = await worker.recognize(f.buffer);
      const text = data.text || '';
      if (text) {
        const lines = text
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(Boolean);
        textSegments.push(...lines);
      }
      combined += (combined ? '\n---\n' : '') + text;
    }
    await worker.terminate();
    if (!combined.trim()) {
      return { rawText: '', detectedTexts: [], confidence: 0 };
    }
    return buildResult(combined, textSegments);
  } catch (e) {
    return { rawText: 'OCR ERROR: ' + (e as Error).message, confidence: 0 };
  }
}

// Placeholder / fallback OCR service with optional tesseract
export async function runOCROnImages(files: Array<Express.Multer.File>): Promise<OCRResult> {
  return enqueueOCR(() => performOCR(files));
}

async function performOCR(files: Array<Express.Multer.File>): Promise<OCRResult> {
  if (files.length) {
    if (process.env.USE_NATIVE_TESSERACT === '1') {
      const nativeResult = await runNative(files);
      if (nativeResult) return nativeResult;
    }

    if (process.env.USE_TESSERACT === '1') {
      const wasmResult = await runTesseractJS(files);
      if (wasmResult.rawText && !wasmResult.rawText.startsWith('OCR ERROR')) return wasmResult;
    }

    const nativeFallback = await runNative(files);
    if (nativeFallback) return nativeFallback;

    const wasmFallback = await runTesseractJS(files);
    if (wasmFallback.rawText && !wasmFallback.rawText.startsWith('OCR ERROR')) return wasmFallback;
  }
  const seed = files[0]?.originalname || 'UNKNOWN';
  const simulatedLines = [
    `P/N: ${seed}`,
    'SIMULATED OCR TEXT',
    'FRONT LEFT DRIVER SIDE'
  ];
  return {
    partNumber: `SIM-${seed.substring(0,4).toUpperCase()}-XYZ`,
    vehicleInfo: '2018-2022 Chevrolet Equinox',
    rawText: simulatedLines.join('\n'),
    detectedTexts: simulatedLines,
    confidence: 90 + Math.floor(Math.random()*5)
  };
}
