
  # Used Car Part Listings Interface

  Figma design: https://www.figma.com/design/fJ13aoFfWR8uCoeqvaoGAT/Used-Car-Part-Listings-Interface

  Goal: ускорить формирование карточек eBay Motors запчастей с помощью OCR + AI (OpenAI) и автоматического заполнения полей.

  ## High-Level Flow
  1. Оператор выбирает/вводит исходный автомобиль и загружает фото детали.
  2. Бэкенд выполняет OCR (stub сейчас) и извлекает part number / vehicle info.
  3. AI слой (mock или OpenAI при наличии ключа) формирует заголовок, описание, цены и совместимость.
  4. Пользователь редактирует поля и сохраняет драфт.
  5. (В будущем) публикация в eBay через API.

  ## Repo Structure
  ```
  upload/            # Frontend (Vite + React + shadcn/ui components)
    src/
      api.ts         # API helper to backend
      components/    # UI components (ListingCreator etc.)
  app/server/        # Backend (Express TS) with OCR/AI stubs
    src/domain/      # Type models
    src/services/    # store, aiService, ocrService, openaiService
    src/routes/      # vehicles, listings
  ```

  ## Backend Summary
  Endpoints (see `app/server/README.md` for details):
  - POST /api/listings/generate (multipart) — OCR + AI suggestions
  - CRUD: /api/vehicles, /api/listings/drafts, /api/listings/:id, publish

  In-memory store: легко заменить на БД.

  ## Frontend Summary
  Main component `ListingCreator` — управляет состоянием изображений, OCR результатами, AI подсказками и сохранением драфтов.

  Key calls (`src/api.ts`):
  - generateListing(images, vehicle, partNumber)
  - saveDraft(draftPayload)
  - fetchDrafts(), fetchVehicles(), createVehicle()

  ## Running Frontend (Dev)
  ```
  cd upload
  npm install
  npm run dev
  ```
  Default dev server: http://localhost:5173 (Vite)

  ## Running Backend (Dev)
  ```
  cd app/server
  npm install
  cp .env.example .env   # optional edit
  npm run dev
  ```
  Default API base: http://localhost:4000/api

  Configure frontend base URL via `VITE_API_BASE` (.env in `upload/`):
  ```
  VITE_API_BASE=http://localhost:4000/api
  ```

  ## Environment Variables
Backend:
```
OPENAI_API_KEY= # optional for future real AI calls
OPENAI_MODEL=gpt-4.1-mini
OPENAI_TEMPERATURE=0.4
OPENAI_BASE_URL=
OPENAI_MCP_CONNECTORS=
PORT=4000
```

  Frontend:
  ```
  VITE_API_BASE=http://localhost:4000/api
  ```

  ## Draft Payload (saveDraft)
  ```
  {
    title?, description?, price?, priceWithDelivery?, freeDelivery?,
    shipping: { method?, cost?, handlingTimeDays?, domestic?, international? },
    part: { partNumber?, conditionTags[], manufacturerPartNumber?, ... },
    ocr?, ai?, compatibility[]
  }
  ```

  ## Current Limitations
  - OCR & AI — заглушки (рандомизированы)
  - Нет постоянного хранилища (исчезает при рестарте)
  - Нет аутентификации / авторизации
  - Публикация на eBay не реализована

  ## Roadmap (short list)
  1. Persist DB (SQLite + Prisma)
  2. Реальный OCR (tesseract.js / локальная модель)
  3. OpenAI integration (batch prompt, retry/backoff)
  4. Listing version history & audit
  5. eBay Trading / Sell API integration
  6. User auth + roles
  7. Background jobs / queue (BullMQ) для heavy OCR
  8. Rate limiting & input validation (zod)

  ## Development Tips
  - При обновлении модели: вынести в отдельный модуль типов для общего использования фронтом (генерация типов через tRPC/ OpenAPI — future).
  - Следите за размером multipart (сейчас 10MB * 20 файлов лимит памяти).

  ## License
  Internal prototype / TBD.
  
