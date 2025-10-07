# Roadmap

> Living document. Priorities may shift as requirements clarify.

## Phase 1 – Foundation (Current)
- [x] Initial React + Vite frontend
- [x] Express TypeScript backend with in‑memory store
- [x] Draft listings (create/update)
- [x] OCR & AI stubs (simulate latency + structured output)
- [x] Basic compatibility inference
- [x] LAN accessibility for backend

## Phase 2 – Persistence & Data Quality
- [ ] Introduce Prisma + SQLite (dev) / Postgres (prod)
- [ ] Migrations & seed script (sample vehicles / parts)
- [ ] Separate tables: vehicles, listings, listing_versions, media_assets, compatibility_entries
- [ ] Transactional draft publish
- [ ] Soft delete & version history (listing_versions)

## Phase 3 – Media Handling
- [ ] Switch from memory uploads to disk or S3 (presigned URLs)
- [ ] Image processing pipeline (sharp) – resize & optimize
- [ ] Main image selection & ordering persistence
- [ ] Duplicate image detection (hash/perceptual hash)

## Phase 4 – Real OCR & AI
- [ ] Integrate Tesseract.js or WASM OCR worker (queue based)
// NOTE: Initial optional integration via env USE_TESSERACT implemented.
- [ ] Fallback: external OCR API (configurable provider)
- [ ] OpenAI real calls (prompt templates, temperature config)
- [ ] Prompt versioning & audit (store prompt + response chunks)
- [ ] AI failure retry/backoff & error taxonomy
- [ ] Guardrails: profanity / PII filters (basic)

## Phase 5 – eBay Integration
- [ ] OAuth flow for user’s eBay account
- [ ] Map internal fields -> eBay Listing schema
- [ ] Create draft on eBay, sync status
- [ ] Publish & revise flows
- [ ] Fee estimate + pricing guidance (if API supports)

## Phase 6 – UX Productivity Enhancements
- [ ] Bulk import (CSV / XLSX) -> staged drafts
- [ ] Bulk generate AI titles/descriptions
- [ ] Keyboard shortcuts (focus next field, apply AI, save)
- [ ] Inline diff when AI overwrites manual edits
- [ ] Smart field suggestions (autocomplete brands, placements)

## Phase 7 – Search & Intelligence
- [ ] Local embedding store (part descriptions) for retrieval augmentation
- [ ] Similar part detection (semantic) to suggest pricing
- [ ] Aggregated pricing stats (min/avg/max per partNumber)
- [ ] Fitment expansion rules (year ranges -> enumerated years)

## Phase 8 – Reliability & Observability
- [ ] Structured logging (pino) + request IDs
- [ ] Metrics (Prometheus + Grafana) – latency, queue depth, OCR time
- [ ] Alerts (error rate > threshold)
- [ ] Rate limiting (per IP / per user)
- [ ] Input validation (zod) across all endpoints

## Phase 9 – Security & Access
- [ ] AuthN: JWT (username + password / OAuth provider)
- [ ] AuthZ: role-based (operator, reviewer, admin)
- [ ] CSRF protection for browser POSTs (if session-based)
- [ ] Secure headers (helmet), strict CORS origin allowlist

## Phase 10 – Advanced Listing Intelligence
- [ ] Condition scoring model (heuristic + future ML)
- [ ] Automatic shipping cost suggestion (dimensional weight + region)
- [ ] Marketplace performance analytics dashboard
- [ ] Part interchange mapping enrichment (external catalogs)

## Phase 11 – Scalability & Architecture
- [ ] Extract OCR & AI into worker processes (BullMQ + Redis)
- [ ] API Gateway / versioned API surface
- [ ] Horizontal scaling guidelines (stateless app + shared storage)

## Phase 12 – Quality & Testing
- [ ] Unit tests (services, utils)
- [ ] Integration tests (supertest) for critical endpoints
- [ ] Visual regression for key UI flows
- [ ] Load test (k6) for generate & publish endpoints
- [ ] Test data anonymization tooling

## Cross-Cutting Improvements
- Developer Experience: shared type package (backend + frontend)
- Error Handling: unified error envelope & codes
- Internationalization: i18n scaffold (EN/RU)
- Accessibility: audit & component adjustments
- Performance budget: initial render < 2s on mid-range mobile

## Nice-to-Have / Stretch
- Offline draft editing (Service Worker + IndexedDB sync)
- Multi-tenant (org/company separation)
- Real-time collaboration (WebSocket presence / conflict resolution)
- Pricing recommendations via external APIs (eBay sold items)

## Status Legend
- [x] Done
- [ ] Planned / not started
- (~) In progress

Update cadence: adjust after each significant feature merge.
