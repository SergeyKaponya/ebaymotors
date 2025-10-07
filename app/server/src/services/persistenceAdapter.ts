import { store } from './store';
import { getPrisma } from './prisma';
import { ListingDraft, Vehicle, CompatibilityEntry } from '../domain/models';

// Map Prisma Listing to ListingDraft shape
function mapListing(l: any): ListingDraft {
  return {
    id: l.id,
    status: l.status === 'PUBLISHED' ? 'published' : 'draft',
    title: l.title || undefined,
    description: l.description || undefined,
    price: l.price || undefined,
    priceWithDelivery: l.priceWithDelivery || undefined,
    freeDelivery: l.freeDelivery || false,
    part: {
      partNumber: l.partNumber || undefined,
      oeOemNumber: l.oemNumber || undefined,
      manufacturerPartNumber: l.manufacturerPartNumber || undefined,
      interchangePartNumber: l.interchangePartNumber || undefined,
      fitmentType: l.fitmentType || undefined,
      placement: l.placement || undefined,
      warrantyType: l.warrantyType || undefined,
      warrantyDuration: l.warrantyDuration || undefined,
      surfaceFinish: l.surfaceFinish || undefined,
      color: l.color || undefined,
      material: l.material || undefined,
      countryManufacture: l.countryManufacture || undefined,
      conditionTags: l.conditionTags ? l.conditionTags.split(',').filter(Boolean) : []
    },
    ocr: l.ocrPartNumber ? {
      partNumber: l.ocrPartNumber || undefined,
      vehicleInfo: l.ocrVehicleInfo || undefined,
      rawText: l.ocrRawText || undefined,
      confidence: l.ocrConfidence || undefined
    } : undefined,
    ai: l.aiTitle || l.aiDescription ? {
      title: l.aiTitle || undefined,
      description: l.aiDescription || undefined,
      suggestedPrices: l.suggestedPrices ? JSON.parse(l.suggestedPrices) : undefined
    } : undefined,
    compatibility: (l.compatibility || []).map((c: any) => ({
      id: c.id,
      year: c.year,
      make: c.make,
      model: c.model,
      verified: c.verified,
      source: c.source || undefined,
      sourceUrl: c.sourceUrl || undefined
    })),
    imageFilenames: (l.media || []).sort((a: any,b: any)=>a.position-b.position).map((m: any) => m.originalName),
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    publishedAt: l.publishedAt ? l.publishedAt.toISOString() : undefined,
    shipping: { method: undefined, cost: undefined, handlingTimeDays: undefined, domestic: true, international: false },
    vehicleId: l.vehicleId || undefined,
    vehicleSnapshot: undefined,
  };
}

export const persistence = {
  async listDrafts(): Promise<ListingDraft[]> {
    const prisma = getPrisma();
    if (!prisma) return store.listDrafts();
    const listings = await prisma.listing.findMany({
      where: { status: 'DRAFT' },
      include: { compatibility: true, media: true }
    });
    return listings.map(mapListing);
  },
  async createDraft(data: Partial<ListingDraft>): Promise<ListingDraft> {
    const prisma = getPrisma();
    if (!prisma) return store.createListingDraft(data);
    const created = await prisma.listing.create({ data: {
      title: data.title || null,
      description: data.description || null,
      price: data.price || null,
      priceWithDelivery: data.priceWithDelivery || null,
      freeDelivery: data.freeDelivery || false,
      partNumber: data.part?.partNumber || null,
      conditionTags: data.part?.conditionTags?.join(',') || null,
      ocrPartNumber: data.ocr?.partNumber || null,
      ocrVehicleInfo: data.ocr?.vehicleInfo || null,
      ocrRawText: data.ocr?.rawText || null,
      ocrConfidence: data.ocr?.confidence || null,
      aiTitle: data.ai?.title || null,
      aiDescription: data.ai?.description || null,
      suggestedPrices: data.ai?.suggestedPrices ? JSON.stringify(data.ai.suggestedPrices) : null,
    }, include: { compatibility: true, media: true }});
    return mapListing(created);
  }
};
