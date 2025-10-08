import { AISuggestionData, CompatibilityEntry, OCRResult } from '../domain/models';
import { generateWithOpenAI } from './openaiService';
import { inferPartNumber } from './partNumberResolver';
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
  vehicle?: {
    make?: string;
    model?: string;
    year?: string | number;
    vin?: string;
  };
  existingCompatibility?: CompatibilityEntry[];
}

export interface AIGenerateResult {
  ai: AISuggestionData;
  compatibility: CompatibilityEntry[];
  inferredPartNumber?: string;
}

export async function generateListingData(params: AIGenerateParams): Promise<AIGenerateResult> {
  const inferredPartNumber = await inferPartNumber({
    ocr: params.ocr,
    providedPartNumber: params.partNumber,
    vehicle: params.vehicle
  });

  const partNumber = inferredPartNumber || params.ocr.partNumber || 'GEN-1234';
  const vehicleInfo = deriveVehicleInfo(params.vehicle, params.ocr.vehicleInfo);

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
    vehicle: params.vehicle,
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

function deriveVehicleInfo(
  vehicle: AIGenerateParams['vehicle'],
  fallback?: string
): string {
  if (!vehicle) return fallback || 'Unknown Vehicle';
  const parts = [
    vehicle.year ? String(vehicle.year) : null,
    vehicle.make || null,
    vehicle.model || null
  ].filter(Boolean);
  if (parts.length) {
    return parts.join(' ');
  }
  return fallback || 'Unknown Vehicle';
}
