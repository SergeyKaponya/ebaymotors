import { OCRResult } from '../domain/models';
import type { Express } from 'express';
import { enqueueOCR } from '../utils/asyncQueue';
import { getOpenAIClient } from './openaiService';

const MAX_IMAGES = Number(process.env.OCR_MAX_IMAGES || 3);
const OCR_MODEL =
  process.env.OPENAI_OCR_MODEL ||
  process.env.OPENAI_MODEL ||
  'gpt-4.1-mini';

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round(value);
  if (rounded < 0) return 0;
  if (rounded > 100) return 100;
  return rounded;
}

// Heuristic confidence from text length for fallback when model omits it
function estimateConfidence(text: string): number {
  const len = text.trim().length;
  if (!len) return 0;
  if (len < 10) return 35;
  if (len < 30) return 60;
  if (len < 80) return 80;
  return 90;
}

function extractPartNumber(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const pattern = /([A-Z0-9]{2,}-[A-Z0-9-]{3,})/i;
  const match = text.match(pattern);
  if (match) return match[1].toUpperCase();
  const fallback = text.match(/\b(?=[A-Z0-9-]{5,}\b)(?=.*[A-Z])(?=.*\d)[A-Z0-9-]+\b/);
  return fallback ? fallback[0].toUpperCase() : undefined;
}

function bufferToDataURL(file: Express.Multer.File): string {
  const mime = file.mimetype && file.mimetype.startsWith('image/')
    ? file.mimetype
    : 'image/jpeg';
  const base64 = file.buffer.toString('base64');
  return `data:${mime};base64,${base64}`;
}

function fallbackResult(reason: string, files: Array<Express.Multer.File>): OCRResult {
  const name = files[0]?.originalname || '';
  return {
    rawText: `OCR unavailable: ${reason}`,
    detectedTexts: [],
    confidence: 0,
    partNumber: extractPartNumber(name)
  };
}

async function runOpenAIOCR(files: Array<Express.Multer.File>, apiKey: string): Promise<OCRResult | null> {
  const client = getOpenAIClient(apiKey);
  const temperature = process.env.OPENAI_OCR_TEMPERATURE
    ? Number(process.env.OPENAI_OCR_TEMPERATURE)
    : 0.0;

  const content: any[] = [
    {
      type: 'input_text',
      text: [
        'You are an OCR assistant for automotive part photos.',
        'Extract every legible character, paying attention to part numbers and vehicle identifiers.',
        'Respond ONLY with JSON using this shape:',
        '{',
        '  "rawText": "full text with newlines",',
        '  "detectedTexts": ["short snippets"],',
        '  "partNumber": "uppercase part number or empty string if none",',
        '  "vehicleInfo": "vehicle reference if present",',
        '  "confidence": 0-100 integer representing transcription confidence',
        '}',
        'If nothing is readable, set rawText="" and confidence<=20. Do not include explanatory text outside the JSON.'
      ].join('\n')
    }
  ];

  files.slice(0, MAX_IMAGES).forEach((file, index) => {
    content.push({
      type: 'input_text',
      text: `Image ${index + 1}`
    });
    content.push({
      type: 'input_image',
      image_url: bufferToDataURL(file),
      detail: 'high'
    });
  });

  try {
    const response = await client.responses.create({
      model: OCR_MODEL,
      temperature,
      input: [
        {
          role: 'system',
          content: [{
            type: 'text',
            text: 'You are a meticulous OCR expert. Always return valid JSON according to the requested schema.'
          }]
        },
        {
          role: 'user',
          content
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'ocr_result',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['rawText', 'detectedTexts'],
            properties: {
              rawText: { type: 'string' },
              detectedTexts: {
                type: 'array',
                items: { type: 'string' }
              },
              partNumber: { type: 'string' },
              vehicleInfo: { type: 'string' },
              confidence: {
                type: 'number',
                minimum: 0,
                maximum: 100
              }
            }
          },
          strict: true
        }
      }
    });

    const raw = response.output_text?.trim();
    if (!raw) {
      throw new Error('OpenAI returned empty output_text');
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const rawText = typeof parsed.rawText === 'string' ? parsed.rawText.trim() : '';
    const detectedTexts = Array.isArray(parsed.detectedTexts)
      ? parsed.detectedTexts
          .map(item => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean)
      : rawText
        ? rawText.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
        : [];

    const partNumberFromModel =
      typeof parsed.partNumber === 'string' && parsed.partNumber.trim()
        ? parsed.partNumber.trim().toUpperCase()
        : undefined;

    const vehicleInfo =
      typeof parsed.vehicleInfo === 'string' && parsed.vehicleInfo.trim()
        ? parsed.vehicleInfo.trim()
        : undefined;

    const confidenceSource = typeof parsed.confidence === 'number' ? parsed.confidence : estimateConfidence(rawText);
    const confidence = clampConfidence(confidenceSource);

    return {
      rawText,
      detectedTexts,
      partNumber: partNumberFromModel || extractPartNumber(rawText),
      vehicleInfo,
      confidence
    };
  } catch (error) {
    console.error('OpenAI OCR failed', error);
    return null;
  }
}

export async function runOCROnImages(files: Array<Express.Multer.File>): Promise<OCRResult> {
  return enqueueOCR(() => performOCR(files));
}

async function performOCR(files: Array<Express.Multer.File>): Promise<OCRResult> {
  if (!files.length) {
    return {
      rawText: 'No images provided for OCR',
      detectedTexts: [],
      confidence: 0
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackResult('missing OPENAI_API_KEY environment variable', files);
  }

  const result = await runOpenAIOCR(files, apiKey);
  if (result) {
    return result;
  }

  return fallbackResult('OpenAI OCR request failed; check server logs for details', files);
}
