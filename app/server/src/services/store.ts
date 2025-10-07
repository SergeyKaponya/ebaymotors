import { ListingDraft, StoreShape, Vehicle } from '../domain/models';
// Use global crypto if available (Node 19+) else fallback to require
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

// Simple in-memory store (singleton)
class InMemoryStore implements StoreShape {
  vehicles: Map<string, Vehicle> = new Map();
  listings: Map<string, ListingDraft> = new Map();

  createVehicle(data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Vehicle {
    const id = uuid();
    const now = new Date().toISOString();
    const vehicle: Vehicle = { id, createdAt: now, updatedAt: now, ...data };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  listVehicles(): Vehicle[] {
    return Array.from(this.vehicles.values()).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  }

  getVehicle(id: string): Vehicle | undefined { return this.vehicles.get(id); }

  createListingDraft(partial: Partial<ListingDraft>): ListingDraft {
    const id = uuid();
    const now = new Date().toISOString();
    const draft: ListingDraft = {
      id,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      shipping: { domestic: true, international: false },
      part: {},
      compatibility: [],
      imageFilenames: [],
      ...partial,
    };
    this.listings.set(id, draft);
    return draft;
  }

  updateListing(id: string, patch: Partial<ListingDraft>): ListingDraft | undefined {
    const existing = this.listings.get(id);
    if (!existing) return undefined;
    const updated: ListingDraft = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.listings.set(id, updated);
    return updated;
  }

  getListing(id: string): ListingDraft | undefined { return this.listings.get(id); }

  listDrafts(): ListingDraft[] {
    return Array.from(this.listings.values()).filter(l=>l.status==='draft').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  }

  publishListing(id: string): ListingDraft | undefined {
    const existing = this.listings.get(id);
    if (!existing) return undefined;
    if (existing.status === 'published') return existing;
    existing.status = 'published';
    existing.publishedAt = new Date().toISOString();
    existing.updatedAt = existing.publishedAt;
    this.listings.set(id, existing);
    return existing;
  }
}

export const store = new InMemoryStore();
