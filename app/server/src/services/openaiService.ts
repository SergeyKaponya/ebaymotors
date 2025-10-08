import OpenAI from 'openai';
import { CompatibilityEntry, OCRResult } from '../domain/models';

interface VehicleContext {
  make?: string;
  model?: string;
  year?: string | number;
  vin?: string;
}

export interface OpenAIListingParams {
  ocr: OCRResult;
  partNumber?: string;
  existingTitle?: string;
  existingDescription?: string;
  compatibility?: CompatibilityEntry[];
  vehicle?: VehicleContext;
}

export interface OpenAIListingResult {
  title: string;
  description: string;
  suggestedPrices: number[];
  usedRealOpenAI: boolean;
  model?: string;
  meta?: Record<string, unknown>;
}

let cachedClient: OpenAI | null = null;

export function getOpenAIClient(apiKey: string): OpenAI {
  if (cachedClient) return cachedClient;
  cachedClient = new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined
  });
  return cachedClient;
}

function buildTools() {
  const connectorsRaw =
    process.env.OPENAI_MCP_CONNECTORS ||
    process.env.OPENAI_CONNECTORS ||
    '';

  const connectors = connectorsRaw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return connectors.map(connector => ({ type: 'mcp' as const, connector }));
}

const MOCK_FALLBACK = {
  title: (vehicleInfo: string, partNumber: string, existingTitle?: string) =>
    existingTitle || `${vehicleInfo} Component - OEM ${partNumber}`,
  description: (vehicleInfo: string, partNumber: string, existingDescription?: string) =>
    existingDescription ||
    `Mock description for ${vehicleInfo} (part ${partNumber}). Add real details after enabling OpenAI API key.`,
  suggestedPrices: () => [59.99, 64.99, 79.99]
};

export async function generateWithOpenAI(params: OpenAIListingParams): Promise<OpenAIListingResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const partNumber = params.partNumber || params.ocr.partNumber || 'GEN-1234';
  const vehicleInfo = formatVehicleInfo(params.vehicle, params.ocr.vehicleInfo);

  if (!apiKey) {
    return {
      title: MOCK_FALLBACK.title(vehicleInfo, partNumber, params.existingTitle),
      description: MOCK_FALLBACK.description(vehicleInfo, partNumber, params.existingDescription),
      suggestedPrices: MOCK_FALLBACK.suggestedPrices(),
      usedRealOpenAI: false,
      model: 'mock-local'
    };
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  const temperature = process.env.OPENAI_TEMPERATURE
    ? Number(process.env.OPENAI_TEMPERATURE)
    : 0.4;
  const tools = buildTools();

  const client = getOpenAIClient(apiKey);

  const compatibilitySummary = (params.compatibility || [])
    .map(entry => `${entry.year} ${entry.make} ${entry.model} (${entry.verified ? 'verified' : 'unverified'})`)
    .join('\n');

  const detectedTexts = (params.ocr.detectedTexts || []).map((line, index) => `${index + 1}. ${line}`).join('\n');
  const vehicleDetails = buildVehicleDetail(params.vehicle);

  const prompt = [
    `You create concise, high-conversion eBay Motors part listings.`,
    `Vehicle info: ${vehicleInfo}`,
    vehicleDetails ? `Vehicle details:\n${vehicleDetails}` : '',
    `Part number: ${partNumber}`,
    `OCR extracted text:\n${params.ocr.rawText || 'N/A'}`,
    detectedTexts ? `OCR detected lines:\n${detectedTexts}` : '',
    params.existingTitle ? `Existing title: ${params.existingTitle}` : '',
    params.existingDescription ? `Existing description: ${params.existingDescription}` : '',
    compatibilitySummary ? `Existing compatibility entries:\n${compatibilitySummary}` : 'No compatibility provided.',
    `Return polished strings focused on fitment, condition, and selling points.`,
    `Suggested prices must be an array of 2-3 realistic USD prices ordered ascending.`
  ].filter(Boolean).join('\n\n');

  try {
    const response = await client.responses.create({
      model,
      temperature,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'text',
              text: 'You are an assistant helping automotive parts sellers prepare eBay Motors listings. Keep the tone professional and factual.'
            }
          ]
        },
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }]
        }
      ],
      tools: tools.length ? tools : undefined,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'listing_suggestion',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['title', 'description', 'suggestedPrices'],
            properties: {
              title: { type: 'string', minLength: 10, maxLength: 110 },
              description: { type: 'string', minLength: 50, maxLength: 2000 },
              suggestedPrices: {
                type: 'array',
                minItems: 1,
                maxItems: 3,
                items: { type: 'number' }
              }
            }
          },
          strict: true
        }
      }
    });

    const rawText = response.output_text;
    if (!rawText) {
      throw new Error('OpenAI response did not include output_text');
    }

    const parsed = JSON.parse(rawText);
    const suggestedPrices = Array.isArray(parsed.suggestedPrices) && parsed.suggestedPrices.length
      ? parsed.suggestedPrices
          .map((value: number) => Number(value))
          .filter((n: number) => Number.isFinite(n))
      : MOCK_FALLBACK.suggestedPrices();

    return {
      title: parsed.title || MOCK_FALLBACK.title(vehicleInfo, partNumber, params.existingTitle),
      description: parsed.description || MOCK_FALLBACK.description(vehicleInfo, partNumber, params.existingDescription),
      suggestedPrices: suggestedPrices.length ? suggestedPrices : MOCK_FALLBACK.suggestedPrices(),
      usedRealOpenAI: true,
      model: response.model || model,
      meta: {
        response_id: response.id,
        usage: response.usage,
        appliedTools: tools.map(t => t.connector)
      }
    };
  } catch (err) {
    console.error('OpenAI generation failed, falling back to mock', err);
    return {
      title: MOCK_FALLBACK.title(vehicleInfo, partNumber, params.existingTitle),
      description: MOCK_FALLBACK.description(vehicleInfo, partNumber, params.existingDescription),
      suggestedPrices: MOCK_FALLBACK.suggestedPrices(),
      usedRealOpenAI: false,
      model,
      meta: {
        error: err instanceof Error ? err.message : String(err),
        attemptedModel: model,
        appliedTools: tools.map(t => t.connector)
      }
    };
  }
}

export interface PartNumberResolutionParams {
  candidates: string[];
  vehicle?: VehicleContext;
  rawText?: string;
  fallback?: string;
}

export interface PartNumberResolutionResult {
  partNumber?: string;
  confidence: number;
  reasoning?: string;
  usedRealOpenAI: boolean;
}

export async function pickLikelyPartNumber(
  params: PartNumberResolutionParams
): Promise<PartNumberResolutionResult> {
  if (!params.candidates.length) {
    return {
      partNumber: params.fallback,
      confidence: 0,
      usedRealOpenAI: false
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      partNumber: params.fallback || params.candidates[0],
      confidence: 0,
      usedRealOpenAI: false
    };
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  const temperature = process.env.OPENAI_TEMPERATURE
    ? Number(process.env.OPENAI_TEMPERATURE)
    : 0.1;
  const tools = buildTools();
  const client = getOpenAIClient(apiKey);

  const prompt = [
    `You analyze OCR outputs from automotive part labels.`,
    `Select the most probable OEM or manufacturer part number from the candidates.`,
    `Return the single best part number if confident; otherwise leave it empty.`,
    `Candidates:\n${params.candidates.map((c, i) => `${i + 1}. ${c}`).join('\n')}`,
    params.rawText ? `Full OCR text:\n${params.rawText}` : '',
    params.vehicle ? `Vehicle context:\n${buildVehicleDetail(params.vehicle)}` : '',
    `If no candidate appears valid, respond with an empty part number and confidence 0.`,
    `Confidence should be an integer 0-100 indicating certainty.`
  ].filter(Boolean).join('\n\n');

  try {
    const response = await client.responses.create({
      model,
      temperature,
      input: [
        {
          role: 'system',
          content: [{
            type: 'text',
            text: 'You are an expert automotive parts catalog analyst. You only return data you are confident about.'
          }]
        },
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }]
        }
      ],
      tools: tools.length ? tools : undefined,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'part_number_selection',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['partNumber', 'confidence'],
            properties: {
              partNumber: { type: 'string' },
              confidence: { type: 'integer', minimum: 0, maximum: 100 },
              reasoning: { type: 'string' }
            }
          },
          strict: true
        }
      }
    });

    const text = response.output_text;
    if (!text) throw new Error('No output text from OpenAI');
    const parsed = JSON.parse(text);
    const partNumber = typeof parsed.partNumber === 'string' ? parsed.partNumber.trim().toUpperCase() : '';
    const confidence = Number.isInteger(parsed.confidence) ? parsed.confidence : 0;
    const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : undefined;

    return {
      partNumber: partNumber || params.fallback,
      confidence,
      reasoning,
      usedRealOpenAI: true
    };
  } catch (err) {
    console.error('OpenAI part number selection failed, falling back', err);
    return {
      partNumber: params.fallback || params.candidates[0],
      confidence: 0,
      usedRealOpenAI: false,
      reasoning: err instanceof Error ? err.message : String(err)
    };
  }
}

function formatVehicleInfo(vehicle?: VehicleContext, fallback?: string): string {
  if (!vehicle) return fallback || 'Unknown Vehicle';
  const segments = [
    vehicle.year ? String(vehicle.year) : null,
    vehicle.make || null,
    vehicle.model || null
  ].filter(Boolean);
  if (segments.length) return segments.join(' ');
  return fallback || 'Unknown Vehicle';
}

function buildVehicleDetail(vehicle?: VehicleContext): string {
  if (!vehicle) return '';
  return [
    vehicle.year ? `Year: ${vehicle.year}` : '',
    vehicle.make ? `Make: ${vehicle.make}` : '',
    vehicle.model ? `Model: ${vehicle.model}` : '',
    vehicle.vin ? `VIN: ${vehicle.vin}` : ''
  ].filter(Boolean).join('\n');
}
