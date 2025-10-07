import { OCRResult } from '../domain/models';
import type { Express } from 'express';

// Heuristic confidence from text length
function estimateConfidence(text: string): number {
  const len = text.trim().length;
  if (len < 10) return 40;
  if (len < 30) return 65;
  if (len < 80) return 80;
  return 90;
}

async function runTesseract(files: Array<Express.Multer.File>): Promise<OCRResult> {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker();
    let combined = '';
    // Process first up to 3 images to limit latency
    for (const f of files.slice(0,3)) {
      const { data } = await worker.recognize(f.buffer);
      combined += (combined ? '\n---\n' : '') + data.text;
    }
    await worker.terminate();
    const confidence = estimateConfidence(combined);
    // Try to extract part number pattern (simple regex sample)
    const match = combined.match(/([A-Z0-9]{2,}-[A-Z0-9-]{3,})/i);
    return {
      partNumber: match ? match[1].toUpperCase() : undefined,
      vehicleInfo: undefined,
      rawText: combined,
      confidence
    };
  } catch (e) {
    return { rawText: 'OCR ERROR: ' + (e as Error).message, confidence: 0 };
  }
}

// Placeholder / fallback OCR service with optional tesseract
export async function runOCROnImages(files: Array<Express.Multer.File>): Promise<OCRResult> {
  if (process.env.USE_TESSERACT === '1' && files.length) {
    const real = await runTesseract(files);
    if (real.rawText && !real.rawText.startsWith('OCR ERROR')) return real;
  }
  const seed = files[0]?.originalname || 'UNKNOWN';
  return {
    partNumber: `SIM-${seed.substring(0,4).toUpperCase()}-XYZ`,
    vehicleInfo: '2018-2022 Chevrolet Equinox',
    rawText: 'SIMULATED OCR TEXT\nP/N: ' + seed + '\nFRONT LEFT DRIVER SIDE',
    confidence: 90 + Math.floor(Math.random()*5)
  };
}
