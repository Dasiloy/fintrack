# OCR Receipt Extraction — End-to-End Flow

## Context

The scan flow UI at `/finances/transactions/scan` already exists and is fully built: three steps
(Upload → Scanning → Review), a scan-line animation, the review form, and the submission call to
`transaction.create`. What does not exist yet is everything behind the scanning step. The
`ScanningStep` component currently simulates the wait with a 3.5-second `setTimeout` and returns
empty extracted data. This document describes how to wire up the real backend.

---

## What the Flow Looks Like End-to-End

### Phase 1 — Upload

```
Browser                         API Gateway                    AI Service (BullMQ)
──────                          ───────────                    ───────────────────

POST /upload/receipt ─────────►  1. upload file to Cloudinary
  { file: <image|pdf> }           2. create OCRDraft (PENDING)
                                   3. enqueue OCR_EXTRACTION_JOB ─────────────────►
                        ◄─────── { draftId }                       pick up job
                                                                    mark PROCESSING
                                                                    call vision model
                                                                    update OCRDraft
                                                                      (COMPLETED | FAILED)
```

### Phase 2 — Real-time notification (SSE + Redis Pub/Sub)

```
Browser                         API Gateway                    Redis         AI Service
──────                          ───────────                    ─────         ──────────

GET /draft/:draftId/stream ───►  SUBSCRIBE ocr:{draftId} ────► channel
  (EventSource, open)            (waiting…)                    │
                                                               │◄── PUBLISH ocr:{draftId}
                                  event received ◄─────────────┘    (after DB write)
◄── data: { status, amount,      send SSE event
            date, merchant, … }  close connection
close EventSource
step → Review
```

### Phase 3 — Confirm

```text
Browser                         API Gateway
──────                          ───────────

POST /transaction ────────────►  create Transaction
  { source: "OCR",               set OCRDraft.confirmedAt
    sourceId: draftId,  ◄─────── { transaction }
    amount, date, … }
navigate → /finances/transactions
```

The frontend opens the SSE stream immediately after receiving `draftId` from Phase 1. The
connection stays open — no polling, no retries — until the AI service publishes to the Redis
channel after writing the result. The gateway relays that one event and closes the stream.
If no event arrives within 60 seconds, the client closes the `EventSource` and surfaces an error.

---

## Storage — Cloudinary

File storage already uses Cloudinary (the profile image upload endpoint uses the same
`upload_stream` helper in `UploadService`). Receipt uploads follow the same pattern:

- **Path prefix**: `fintrack/receipts/{userId}/{draftId}` — ties the stored object to the user for
  any future access control, and uses the draft ID (generated before the upload) so the path is
  deterministic without a round-trip.
- **Resource types**: `image` for JPEG/PNG/WEBP; `raw` for PDF files (Cloudinary stores PDFs as
  raw, not image — the distinction matters when fetching).
- **Return value used**: only the `secure_url` is stored on `OCRDraft.imageKey`. The processor
  fetches the file from that URL or passes it directly to the vision API.

Cloudinary is not involved after upload. The processor fetches the file once; after that the draft
holds the extracted data and the image URL is only kept for the receipt thumbnail shown in
`ScanningStep`.

---

## The OCRDraft Record

`OCRDraft` (already in the Prisma schema) serves as the coordination primitive:

| Field           | Purpose                                                                      |
| --------------- | ---------------------------------------------------------------------------- |
| `id`            | The `draftId` the client opens an SSE stream for, later passed as `sourceId` |
| `imageKey`      | Cloudinary `secure_url` — unique index so duplicate uploads are caught       |
| `status`        | State machine: `PENDING → PROCESSING → COMPLETED / FAILED`                   |
| `amount`        | Extracted amount (null until COMPLETED)                                      |
| `date`          | Extracted transaction date (defaults to upload date on failure)              |
| `merchant`      | Extracted merchant name (nullable)                                           |
| `description`   | Extracted line-item description or receipt title (nullable)                  |
| `confidence`    | Model-reported extraction confidence 0–1 (nullable)                          |
| `failureReason` | Human-readable reason stored when status = FAILED                            |
| `rawData`       | Full model JSON response stored as-is for debugging                          |
| `confirmedAt`   | Set when the user confirms the draft — used to skip re-confirmation          |

The status moves from PENDING to PROCESSING the moment the OCR processor picks up the job, before
the vision call starts. The SSE stream does not observe these intermediate states — it only fires
once, when the processor publishes to the Redis channel on completion or failure. The status field
on `OCRDraft` is the durable record of what happened; the Pub/Sub message is ephemeral and only
matters while the stream is open.

---

## API Gateway — New Endpoints

### POST /upload/receipt

Sits in the existing `UploadController`. Accepts a `multipart/form-data` body with a single `file`
field; validates file type (image/\* or PDF) and size (matches the existing `MAX_FILE_SIZE` cap).

The handler sequence:
1. Generates a `draftId` before the Cloudinary upload so the Cloudinary path can embed it.
2. Uploads the buffer to Cloudinary — `resource_type: 'image'` for images, `'raw'` for PDFs.
3. Creates an `OCRDraft` row with `status: PENDING`, `imageKey: secure_url`, `date: now()`.
4. Enqueues an `OCR_EXTRACTION_JOB` with the payload `{ draftId, userId, imageUrl, isPdf }`.
5. Returns `{ draftId }`.

Steps 3 and 4 can fail independently: if the DB write fails the queue job is never sent; if the
enqueue fails the draft sits PENDING forever. Wrap both in a try/catch and delete the Cloudinary
object on failure (`cloudinary.v2.uploader.destroy`). A cron that marks stale PENDING drafts
FAILED after N minutes is the safety net for orphaned jobs (add later).

### GET /transaction/draft/:draftId/stream

This is the SSE endpoint. NestJS does not have a built-in SSE decorator for this pattern, so it
uses a raw `@Res() res: Response` approach rather than `@Sse()`:

```
res.setHeader('Content-Type', 'text/event-stream')
res.setHeader('Cache-Control', 'no-cache')
res.setHeader('Connection', 'keep-alive')
res.flushHeaders()
```

After setting up the headers, the handler:

1. Validates the draft exists and belongs to the authenticated user (404 otherwise).
2. Checks whether the draft is already COMPLETED or FAILED — if so, immediately sends the final
   event and closes the connection. This handles the race where the job finishes before the
   browser opens the stream.
3. Subscribes to the Redis Pub/Sub channel `ocr:{draftId}` using a dedicated Redis subscriber
   client. The main Redis client used for caching cannot be put into subscribe mode — a separate
   connection is required. The subscriber client is injected as a second `REDIS_SUBSCRIBER`
   provider in the module.
4. When a message arrives on the channel, sends it as an SSE `data:` event and closes the
   connection. The payload is the serialised draft state: `{ status, amount, date, merchant,
   description, failureReason }`.
5. Cleans up the subscription when the client disconnects early (`req.on('close', unsubscribe)`).

The connection is intentionally short-lived: it opens, waits for one event, closes. The gateway
adds a 55-second server-side timeout on the SSE handler: if no Pub/Sub message arrives within that
window, it sends an explicit `{ status: "FAILED", failureReason: "timeout" }` event and closes the
connection. This is 5 seconds shorter than the client's 60-second `EventSource` timeout so the
server always closes the stream before the client gives up. The gateway timeout is just a
last-resort fallback — the real protection against runaway token consumption lives in the AI
service processor (see below).

---

## The OCR Worker (AI Service)

The processor lives in the AI service, next to `ClassificationModule`. It consumes the
`OCR_QUEUE` and handles `OCR_EXTRACTION_JOB`.

### Why the AI service?

The classification processor already lives there and follows the same pattern: pick up a BullMQ
job, call a model, write a result to the DB. The model resolver, embedding repos, and
LangchainService are already wired globally. Adding an OCR module follows the exact same
registration pattern as `ClassificationModule`.

### What the processor does

1. **Mark PROCESSING**: Updates `OCRDraft.status = PROCESSING` immediately before any model call.
   This is a durable write — if the SSE stream reconnects mid-flight it can read PROCESSING from
   the DB rather than stale PENDING.

2. **Download the file as binary**: Fetches the file from Cloudinary using the stored `imageKey`
   URL and reads it into a `Buffer`. Passing the URL directly to the model would require the
   model to make an outbound HTTP request — which may not be possible from within the model
   provider's infrastructure, adds round-trip latency, and is entirely unnecessary since we
   already have the bytes. The downloaded buffer is converted to base64 and sent as `inlineData`
   in the model request. This applies equally to images and PDFs; both Gemini 2.5 Flash and
   Claude Sonnet support PDFs as native inline content, so no PDF→image conversion step is
   needed.

3. **Server-side processing timeout**: The model call is wrapped in a `Promise.race` with a
   45-second deadline — shorter than the gateway's 55-second SSE timeout and well under the
   client's 60-second `EventSource` timeout:

   ```typescript
   Promise.race([
     callVisionModel(binaryData, mimeType, categories),
     sleep(45_000).then(() => { throw new Error('OCR processing timeout') })
   ])
   ```

   If the timeout fires first, the catch block marks the draft FAILED and publishes the failure
   event to Redis immediately, so the SSE stream closes cleanly rather than waiting out the
   remaining 10–15 seconds. This is the primary guard against burning tokens on a hung model
   call. BullMQ's own job `timeout` option (set to 50 seconds) is a secondary guard that kills
   the worker process itself if the `Promise.race` somehow fails to reject.

4. **Vision model call**: Uses `gemini-2.5-flash` (already registered in `ModelRessolver`) with a
   structured output schema and `strict: true`. The prompt instructs the model to extract:

   - `amount` — numeric value only, no currency symbol
   - `date` — ISO `YYYY-MM-DD`
   - `merchant` — business name as it appears on the receipt
   - `description` — top line item or receipt title (e.g. "Grocery shopping")
   - `categorySlug` — best-guess from the user's category list (provided in the prompt)
   - `confidence` — self-reported 0–1

   Supplying the category list in the prompt lets the model guess the category in one shot,
   avoiding a second classification call.

5. **Write result and publish**: On success, updates `OCRDraft` with the extracted fields and
   `status: COMPLETED`. On any error, sets `status: FAILED` and `failureReason`. In both cases,
   after the DB write commits, publishes to `ocr:{draftId}` on Redis Pub/Sub with the full draft
   payload inline. The publish always happens after the write — the gateway reads the result from
   the Pub/Sub message directly without a follow-up DB query.

6. **BullMQ failure hook**: `@OnWorkerEvent('failed')` fires after all retries are exhausted.
   If the draft is still PROCESSING at that point (i.e. the `Promise.race` timeout did not
   already handle it), the hook updates `OCRDraft.status = FAILED` and publishes the failure
   event so the SSE stream closes rather than waiting for the gateway's 55-second timeout.

### Structured output schema (Zod)

```typescript
const ocrSchema = z.object({
  amount: z.number().nullable(),
  date: z.string().nullable(),
  merchant: z.string().nullable(),
  description: z.string().nullable(),
  categorySlug: z.string().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
});
```

Using `buildStructuredChain` with `strict: true` (same as classification) guarantees the model
returns JSON conforming to this schema. Null values are expected — the model may not find all
fields on every receipt, and the review step is designed to handle missing values.

---

## Redis Pub/Sub — Two-Client Pattern

BullMQ uses `ioredis` under the hood and the existing Redis provider (`REDIS_CLIENT`) is already
in subscriber/command mode by virtue of BullMQ managing its own connections internally. The
gateway's caching client is a plain `ioredis` instance in command mode.

For SSE subscriptions the gateway needs a **dedicated subscriber client** (`REDIS_SUBSCRIBER`).
An `ioredis` client enters subscriber mode the moment `subscribe()` is called and can no longer
issue regular commands. The subscriber client is registered as a separate provider in the
transaction module:

```typescript
{
  provide: 'REDIS_SUBSCRIBER',
  useFactory: (configService: ConfigService) =>
    new Redis(configService.getOrThrow('REDIS_URL')),
  inject: [ConfigService],
}
```

Each SSE connection calls `subscriber.subscribe('ocr:{draftId}')` and unsubscribes on close.
Because ioredis multiplexes subscriptions on a single connection, many concurrent SSE streams
share the one subscriber client — there is no connection-per-stream overhead.

The AI service publishes using its own command-mode Redis client (also already present as it
is registered in the BullMQ module config). The publisher client does not need to be dedicated.

---

## tRPC Layer

The SSE stream is not proxied through tRPC — tRPC procedures are request/response and cannot hold
open an event stream. Instead the scanning step opens a native `EventSource` pointing directly at
the gateway URL:

```typescript
// inside ScanningStep, after draftId is received
const es = new EventSource(
  `${process.env.NEXT_PUBLIC_GATEWAY_URL}/api/transaction/draft/${draftId}/stream`,
  { withCredentials: true }
);
es.onmessage = (event) => { /* parse JSON, call onComplete or show error */ };
es.onerror   = () => { /* handle timeout / connection error */ };
```

One new tRPC mutation is still needed:

**`transaction.uploadReceipt`** — sends a `FormData` request to `POST /api/upload/receipt`.
Returns `{ draftId: string }`. The FE calls this when the user accepts a file in the upload step.

The existing `transaction.create` mutation is reused at the review step unchanged — it already
accepts `source: 'OCR'` and `sourceId`. The review step just needs to pass `sourceId: draftId`
and `source: 'OCR'` instead of the generated `trnx_…` ID it currently uses.

---

## Frontend Wiring (What Changes in the Scan UI)

**`scanning_step.tsx`** — replace the `setTimeout` simulation with:

1. Call `transaction.uploadReceipt.mutate(file)` on mount.
2. On mutation success, open an `EventSource` to
   `GET /api/transaction/draft/{draftId}/stream`.
3. On `message` event: parse the JSON payload, call `onComplete(extractedData)` if
   `status === COMPLETED`, or surface the `failureReason` error if `status === FAILED`.
4. Set a 60-second `setTimeout` as a hard timeout — if no event arrives, close the
   `EventSource` and show an error with a "Try again" option.
5. Clean up both the `EventSource` and the timeout in the `useEffect` return.

**`scan_stepper.tsx`** — thread `draftId` through stepper state alongside `ExtractedData` so
`ReviewStep` can read it when submitting.

**`review_step.tsx`** — change `source: 'MANUAL'` to `source: 'OCR'` and `sourceId` from the
generated `trnx_…` value to the `draftId`.

---

## Queue Constants to Add

```typescript
///! OCR EXTRACTION QUEUE
export const OCR_QUEUE = 'OCR_QUEUE';
export const OCR_EXTRACTION_JOB = 'OCR_EXTRACTION_JOB';
```

These go in `packages/types/src/constants/queus.constants.ts`, following the existing naming
convention.

---

## Implementation Order

1. Add `OCR_QUEUE` / `OCR_EXTRACTION_JOB` constants
2. API gateway: receipt upload endpoint (Cloudinary + OCRDraft create + enqueue)
3. API gateway: SSE stream endpoint + `REDIS_SUBSCRIBER` provider
4. AI service: OCR module + processor (mark PROCESSING → call vision → write result → publish)
5. tRPC: `uploadReceipt` mutation
6. Frontend: replace `setTimeout` in `ScanningStep` with upload mutation + `EventSource` stream

---

## Key Design Decisions

**SSE over WebSocket**: the flow is unidirectional — server pushes one event to the client. SSE
is plain HTTP with no protocol upgrade, no sticky-session requirements, and natively supported by
every browser via `EventSource`. WebSocket adds bidirectional complexity that buys nothing here.

**SSE over FCM**: FCM is designed for background/device push and requires the user to have granted
notification permission. The scan flow is a foreground interaction — the user is actively watching
the animation. SSE fires directly into the open tab without any permission prompt.

**SSE over polling**: polling fires 3–4 HTTP requests over 6–8 seconds. SSE is one persistent
connection that closes itself. It is simpler to reason about (one callback, no interval cleanup)
and does not generate unnecessary traffic.

**Publish after DB write**: the processor publishes to Pub/Sub only after the `OCRDraft` DB update
commits. This prevents the gateway from relaying a Pub/Sub message whose data is not yet durable —
the published payload carries all extracted fields inline so the gateway does not need a
follow-up DB read.

**One subscriber client, many subscriptions**: ioredis multiplexes all `subscribe()` calls onto
one TCP connection. Registering `REDIS_SUBSCRIBER` as a singleton provider in the gateway is all
that is needed — concurrent SSE streams do not create additional Redis connections.

**Cloudinary URL passed to the vision API directly (images)**: avoids downloading and re-uploading
through the AI service. Gemini vision accepts public URLs. For PDFs, the AI service downloads once
and converts the first page — receipts are never multi-page documents.

**Single vision call, not classification + vision**: unlike the bank sync flow (token scoring →
AI classification), OCR does extraction and category guessing in one shot. A second classification
call would double latency for a flow the user is watching in real time.

**No draft confirmation endpoint**: the existing `transaction.create` accepts `source: 'OCR'` and
`sourceId: draftId`. Rather than a dedicated confirmation route, the finance service can
fire-and-forget an update to set `confirmedAt` when it creates a transaction with `source === OCR`.
This avoids a round-trip and keeps the FE logic flat.
