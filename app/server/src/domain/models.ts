// Domain models & types for the eBay Motors listing assistant
// Initial in-memory structures. Later can be extracted to Prisma schema / DB.

export interface Vehicle {
  id: string; // uuid
  make: string;
  model: string;
  year: number;
  vin?: string; // 17 chars optional
  createdAt: string;
  updatedAt: string;
}

export interface CompatibilityEntry {
  id: string; // uuid
  year: string; // could be range like 2018-2022
  make: string;
  model: string;
  verified: boolean;
  source?: string;
  sourceUrl?: string;
}

export interface OCRResult {
  partNumber?: string;
  vehicleInfo?: string; // e.g., "2018-2022 Chevrolet Equinox"
  rawText?: string;
  confidence?: number; // 0-100
}

export interface AISuggestionData {
  title?: string;
  description?: string;
  suggestedPrices?: number[];
}

export interface PartData {
  partNumber?: string;
  conditionTags?: string[]; // ['oem','used'] etc
  manufacturerPartNumber?: string;
  interchangePartNumber?: string;
  oeOemNumber?: string;
  brand?: string;
  placement?: string;
  fitmentType?: string;
  warrantyDuration?: string;
  warrantyType?: string;
  surfaceFinish?: string;
  color?: string;
  material?: string;
  countryManufacture?: string;
}

export interface ListingDraft {
  id: string; // uuid
  vehicleId?: string; // reference to vehicle
  vehicleSnapshot?: Vehicle; // snapshot at creation (optional)
  title?: string;
  description?: string;
  price?: number;
  priceWithDelivery?: number;
  freeDelivery?: boolean;
  shipping: {
    method?: string;
    cost?: number;
    handlingTimeDays?: number;
    domestic?: boolean;
    international?: boolean;
  };
  part: PartData;
  ocr?: OCRResult;
  ai?: AISuggestionData;
  compatibility: CompatibilityEntry[];
  imageFilenames: string[]; // stored names if persisted; for now just original names
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface GenerateRequestPayload {
  vehicle?: Partial<Vehicle> & { id?: string };
  partNumber?: string;
  existingCompatibility?: CompatibilityEntry[];
}

export interface GenerateResponsePayload {
  ocr: OCRResult;
  ai: AISuggestionData;
  compatibility: CompatibilityEntry[];
  inferredPartNumber?: string;
}

export interface StoreShape {
  vehicles: Map<string, Vehicle>;
  listings: Map<string, ListingDraft>;
}

export type ID = string;
