import { AISuggestionData, CompatibilityEntry, OCRResult } from '../domain/models';

export interface OpenAIListingParams {
  ocr: OCRResult;
  partNumber?: string;
  existingTitle?: string;
  existingDescription?: string;
  compatibility?: CompatibilityEntry[];
}

export interface OpenAIListingResult {
  title: string;
  description: string;
  suggestedPrices: number[];
  usedRealOpenAI: boolean;
  model?: string;
  meta?: Record<string, unknown>;
}

// NOTE: This is a stub. Real implementation will call OpenAI's API (gpt-4.1 / o4-mini or similar)
export async function generateWithOpenAI(params: OpenAIListingParams): Promise<OpenAIListingResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const partNumber = params.partNumber || params.ocr.partNumber || 'GEN-1234';
  const vehicleInfo = params.ocr.vehicleInfo || 'Unknown Vehicle';

  if (!apiKey) {
    // Mock path
    return {
      title: params.existingTitle || `${vehicleInfo} Component - OEM ${partNumber}`,
      description: params.existingDescription || `Mock description for ${vehicleInfo} (part ${partNumber}). Add real details after enabling OpenAI API key.`,
      suggestedPrices: [59.99, 64.99, 79.99],
      usedRealOpenAI: false,
      model: 'mock-local'
    };
  }

  // Placeholder real-call simulation
  // In future: fetch('https://api.openai.com/v1/responses', { headers: { Authorization: `Bearer ${apiKey}` }, body: ... })
  await new Promise(r=>setTimeout(r, 600));
  return {
    title: `${vehicleInfo} Premium Component - OEM ${partNumber}`,
    description: `Automatically generated using OpenAI model for ${vehicleInfo}, part ${partNumber}. Include condition, mileage, and warranty details here.`,
    suggestedPrices: [62.5, 69.0, 81.0],
    usedRealOpenAI: true,
    model: 'gpt-4.1-stub',
    meta: { tokensEstimated: 320 }
  };
}
