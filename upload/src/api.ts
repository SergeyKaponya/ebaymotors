// Frontend API helper for server integration
// Adjust baseURL if backend served separately
const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export interface GenerateResponse {
  ok: boolean;
  ocr?: any;
  ai?: { title?: string; description?: string; suggestedPrices?: number[] };
  compatibility?: any[];
  inferredPartNumber?: string;
  images?: string[];
  error?: string;
}

export async function generateListing(form: {
  images: File[];
  vehicle?: { make?: string; model?: string; year?: string | number; vin?: string };
  partNumber?: string;
  existingCompatibility?: any[];
}): Promise<GenerateResponse> {
  const fd = new FormData();
  form.images.forEach(f => fd.append('images', f));
  if (form.vehicle) fd.append('vehicle', JSON.stringify(form.vehicle));
  if (form.partNumber) fd.append('partNumber', form.partNumber);
  if (form.existingCompatibility) fd.append('existingCompatibility', JSON.stringify(form.existingCompatibility));

  const res = await fetch(`${BASE_URL}/listings/generate`, { method: 'POST', body: fd });
  return res.json();
}

export async function analyzeOCR(images: File[]): Promise<GenerateResponse> {
  const fd = new FormData();
  images.forEach(image => fd.append('images', image));
  const res = await fetch(`${BASE_URL}/listings/ocr`, { method: 'POST', body: fd });
  return res.json();
}

export async function fetchVehicles() {
  const res = await fetch(`${BASE_URL}/vehicles`);
  return res.json();
}

export async function createVehicle(data: { make: string; model: string; year: number; vin?: string; }) {
  const res = await fetch(`${BASE_URL}/vehicles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchDrafts() {
  const res = await fetch(`${BASE_URL}/listings/drafts`);
  return res.json();
}

export async function saveDraft(draft: any) {
  const res = await fetch(`${BASE_URL}/listings/drafts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft)
  });
  return res.json();
}

export async function updateListing(id: string, patch: any) {
  const res = await fetch(`${BASE_URL}/listings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  });
  return res.json();
}

export async function publishListing(id: string) {
  const res = await fetch(`${BASE_URL}/listings/${id}/publish`, { method: 'POST' });
  return res.json();
}
