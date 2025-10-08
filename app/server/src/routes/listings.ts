import { Router, Request, Response } from 'express';
import multer from 'multer';
import { store } from '../services/store';
import { runOCROnImages } from '../services/ocrService';
import { generateListingData } from '../services/aiService';
import { ListingDraft } from '../domain/models';

export const listingsRouter = Router();

// Multer config for this router only (memory)
const upload = multer({ storage: multer.memoryStorage(), limits: { files: 20, fileSize: 10 * 1024 * 1024 } });

// List drafts
listingsRouter.get('/drafts', (req: Request, res: Response) => {
  res.json(store.listDrafts());
});

// Create draft
listingsRouter.post('/drafts', (req: Request, res: Response) => {
  const draft = store.createListingDraft(req.body || {});
  res.status(201).json(draft);
});

// Get listing by id
listingsRouter.get('/:id', (req: Request, res: Response) => {
  const l = store.getListing(req.params.id);
  if (!l) return res.status(404).json({ error: 'Not found' });
  res.json(l);
});

// Update listing
listingsRouter.put('/:id', (req: Request, res: Response) => {
  const updated = store.updateListing(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

// Publish listing
listingsRouter.post('/:id/publish', (req: Request, res: Response) => {
  const published = store.publishListing(req.params.id);
  if (!published) return res.status(404).json({ error: 'Not found' });
  res.json(published);
});

// Generate (OCR + AI) suggestions
listingsRouter.post('/generate', upload.array('images', 20), async (req: Request, res: Response) => {
  try {
    const files = (req.files as any[]) || [];
    const { partNumber } = req.body || {};

    let vehicleData: any;
    const rawVehicle = (req.body || {}).vehicle;
    if (rawVehicle) {
      try {
        vehicleData = typeof rawVehicle === 'string' ? JSON.parse(rawVehicle) : rawVehicle;
      } catch (err) {
        console.warn('Failed to parse vehicle payload', err);
      }
    }

    let compatibilityPayload: any[] = [];
    const rawCompatibility = (req.body || {}).existingCompatibility;
    if (rawCompatibility) {
      try {
        compatibilityPayload = typeof rawCompatibility === 'string'
          ? JSON.parse(rawCompatibility)
          : Array.isArray(rawCompatibility) ? rawCompatibility : [];
      } catch (err) {
        console.warn('Failed to parse compatibility payload', err);
      }
    }

    const ocr = files.length ? await runOCROnImages(files) : {};
    const aiResult = await generateListingData({
      ocr,
      partNumber,
      vehicle: vehicleData,
      existingCompatibility: compatibilityPayload
    });

    res.json({ ok: true, ocr, ...aiResult, images: files.map(f=>f.originalname) });
  } catch (e) {
    console.error('generate error', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// OCR-only endpoint for faster UI feedback
listingsRouter.post('/ocr', upload.array('images', 20), async (req: Request, res: Response) => {
  try {
    const files = (req.files as any[]) || [];
    if (!files.length) {
      return res.status(400).json({ ok: false, error: 'No images uploaded' });
    }

    const ocr = await runOCROnImages(files);
    res.json({ ok: true, ocr });
  } catch (e) {
    console.error('ocr error', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});
