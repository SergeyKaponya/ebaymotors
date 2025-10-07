import { AISuggestionData, CompatibilityEntry, OCRResult } from '../domain/models';
import { generateWithOpenAI } from './openaiService';
const uuid = () => {
  try {
    // @ts-ignore
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      // @ts-ignore
      return crypto.randomUUID();
    }
  } catch {}
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { randomUUID } = require('crypto');
  return randomUUID();
};

export interface AIGenerateParams {
  ocr: OCRResult;
  partNumber?: string;
  existingCompatibility?: CompatibilityEntry[];
}

export interface AIGenerateResult {
  ai: AISuggestionData;
  compatibility: CompatibilityEntry[];
  inferredPartNumber?: string;
}

export async function generateListingData(params: AIGenerateParams): Promise<AIGenerateResult> {
  const partNumber = params.partNumber || params.ocr.partNumber || 'GEN-1234';
  const vehicleInfo = params.ocr.vehicleInfo || 'Unknown Vehicle';

  const title = `${vehicleInfo} Component - OEM ${partNumber}`;
  const description = `High-quality automotive component for ${vehicleInfo}. Part number ${partNumber}. Inspected and verified. Auto-generated description.`;

  const compatibility: CompatibilityEntry[] = params.existingCompatibility?.length
    ? params.existingCompatibility
    : vehicleInfo.includes(' ') ? [{
  id: uuid(),
        year: vehicleInfo.split(' ')[0],
        make: vehicleInfo.split(' ')[1],
        model: vehicleInfo.split(' ').slice(2).join(' ') || 'Model',
        verified: false
      }] : [];

  // Get AI (mock or real) suggestions
  const aiRaw = await generateWithOpenAI({
    ocr: params.ocr,
    partNumber,
    existingTitle: title,
    existingDescription: description,
    compatibility
  });

  return {
    ai: {
      title: aiRaw.title,
      description: aiRaw.description,
      suggestedPrices: aiRaw.suggestedPrices
    },
    compatibility,
    inferredPartNumber: partNumber
  };
}
