import { OCRResult } from '../domain/models';
import { pickLikelyPartNumber } from './openaiService';

interface VehicleContext {
  make?: string;
  model?: string;
  year?: string | number;
  vin?: string;
}

interface InferParams {
  ocr: OCRResult;
  providedPartNumber?: string;
  vehicle?: VehicleContext;
}

interface CandidateScore {
  value: string;
  normalized: string;
  score: number;
}

const IGNORED_TOKENS = new Set([
  'GENUINE',
  'PART',
  'ASSEMBLY',
  'ASSY',
  'OEM',
  'QUALITY',
  'FRONT',
  'REAR',
  'LEFT',
  'RIGHT',
  'DRIVER',
  'PASSENGER',
  'SIDE',
  'UPPER',
  'LOWER',
  'FIT',
  'FOR',
  'LHD',
  'RHD'
]);

const PRIMARY_PATTERN = /(?<![A-Z0-9])([A-Z0-9]{2,}(?:[-_/][A-Z0-9]{2,})+)(?![A-Z0-9])/gi;
const SECONDARY_PATTERN = /(?<![A-Z0-9])([A-Z][A-Z0-9]{4,})(?![A-Z0-9])/gi;

function normalizeCandidate(raw: string): string {
  return raw.trim().toUpperCase();
}

function cleanCandidate(raw: string): string {
  return normalizeCandidate(raw).replace(/[^A-Z0-9-_/]/g, '');
}

function looksValidPartNumber(value: string): boolean {
  if (!value) return false;
  const upper = normalizeCandidate(value);
  if (upper.length < 4 || upper.length > 24) return false;
  if (!/[A-Z]/.test(upper) || !/[0-9]/.test(upper)) return false;
  if (!/^[A-Z0-9\-_/]+$/.test(upper)) return false;
  if (IGNORED_TOKENS.has(upper)) return false;
  return true;
}

function scoreCandidate(raw: string): CandidateScore {
  const normalized = cleanCandidate(raw);
  if (!normalized) return { value: raw, normalized, score: -Infinity };

  let score = 0;
  if (normalized.includes('-') || normalized.includes('_') || normalized.includes('/')) score += 4;
  if (/[A-Z]/.test(normalized) && /\d/.test(normalized)) score += 4;
  if (/^[A-Z0-9\-_/]{6,18}$/.test(normalized)) score += 2;
  if (/^\d+$/.test(normalized)) score -= 3;
  if (IGNORED_TOKENS.has(normalized)) score -= 5;

  const lengthBonus = Math.max(0, Math.min(normalized.length - 6, 6));
  score += lengthBonus;

  return { value: raw, normalized, score };
}

function extractCandidatesFromText(text: string, accumulator: Set<string>) {
  let match: RegExpExecArray | null;
  while ((match = PRIMARY_PATTERN.exec(text))) {
    const candidate = match[1];
    if (looksValidPartNumber(candidate)) accumulator.add(cleanCandidate(candidate));
  }
  PRIMARY_PATTERN.lastIndex = 0;

  while ((match = SECONDARY_PATTERN.exec(text))) {
    const candidate = match[1];
    if (looksValidPartNumber(candidate)) accumulator.add(cleanCandidate(candidate));
  }
  SECONDARY_PATTERN.lastIndex = 0;

  // Handle P/N style prefixes
  const pnMatch = text.match(/P\/N[:\s-]+([A-Z0-9\-_/]+)/i);
  if (pnMatch && looksValidPartNumber(pnMatch[1])) {
    accumulator.add(cleanCandidate(pnMatch[1]));
  }
}

function collectCandidates(ocr: OCRResult): string[] {
  const set = new Set<string>();
  const add = (value?: string) => {
    if (!value) return;
    const cleaned = cleanCandidate(value);
    if (looksValidPartNumber(cleaned)) set.add(cleaned);
  };

  add(ocr.partNumber);
  (ocr.detectedTexts || []).forEach(txt => {
    extractCandidatesFromText(txt, set);
  });
  if (ocr.rawText) {
    extractCandidatesFromText(ocr.rawText, set);
  }

  return Array.from(set);
}

function pickHeuristicCandidate(candidates: string[]): string | undefined {
  if (!candidates.length) return undefined;
  const scored = candidates
    .map(value => scoreCandidate(value))
    .filter(item => Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score);
  return scored[0]?.normalized;
}

export async function inferPartNumber(params: InferParams): Promise<string | undefined> {
  if (params.providedPartNumber) {
    return cleanCandidate(params.providedPartNumber);
  }

  const candidates = collectCandidates(params.ocr);
  const heuristic = pickHeuristicCandidate(candidates);

  if (!process.env.OPENAI_API_KEY || !candidates.length) {
    return heuristic || params.ocr.partNumber;
  }

  const openaiResult = await pickLikelyPartNumber({
    candidates,
    vehicle: params.vehicle,
    rawText: params.ocr.rawText,
    fallback: heuristic || params.ocr.partNumber
  });

  return openaiResult.partNumber || heuristic || params.ocr.partNumber;
}
