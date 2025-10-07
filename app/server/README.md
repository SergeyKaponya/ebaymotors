# Backend (Listing Generation API)

This service powers OCR + AI assisted creation of eBay Motors part listings.

## Stack
- Node.js + Express (TypeScript)
- In-memory store (can be replaced later with DB)
- Stub OCR + AI layers (pluggable)

## Environment
Copy `.env.example` to `.env`:
```
OPENAI_API_KEY= # optional, if omitted mock AI is used
PORT=4000
```

## Scripts
```
npm run dev   # ts-node-dev
npm run build # tsc -> dist
npm start     # run compiled
```

## Domain Model (Simplified)
Vehicle:
- id, make, model, year, vin

ListingDraft:
- id, status (draft|published), title, description, price, shipping, part, ocr, ai, compatibility[], imageFilenames[]

## API Endpoints
### Health
GET /health -> { status, time }

### Vehicles
GET /api/vehicles
POST /api/vehicles { make, model, year, vin? }

### Listings / Drafts
GET /api/listings/drafts
POST /api/listings/drafts { ...draftPartial }
GET /api/listings/:id
PUT /api/listings/:id { ...patch }
POST /api/listings/:id/publish

### Generate (OCR + AI)
POST /api/listings/generate (multipart)
Fields:
- images[]: up to 20
- partNumber? string
- vehicle? JSON string { make, model, year, vin }
- existingCompatibility? JSON array

Response sample:
```
{
	ok: true,
	ocr: { partNumber, vehicleInfo, rawText, confidence },
	ai: { title, description, suggestedPrices },
	compatibility: [{ id, year, make, model, verified }],
	inferredPartNumber: "..."
}
```

## Replacing Stubs
- OCR: implement in `services/ocrService.ts`
- AI (OpenAI): implement real API call inside `services/openaiService.ts`

## Production Considerations
- Add persistent DB (SQLite/Postgres via Prisma)
- File storage (S3 / local disk) instead of memory
- Auth (JWT / session)
- Rate limiting & request validation (zod / joi)
- Logging (pino / winston)

## Future
See top-level README for roadmap.
