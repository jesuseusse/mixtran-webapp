# Phase 5 — Sistema de Cotizaciones

> Append this plan to `docs/DEVELOPMENT_PLAN.md` and update `CLAUDE.md` Phase table.
> Follow every rule in `CLAUDE.md` — this plan adds only quote-specific constraints.

---

## Additional non-negotiable rules for this phase

| Rule | Detail |
|---|---|
| **Mobile-first** | Every component starts at 375px. Desktop is an enhancement. No horizontal scroll — ever. |
| **No RFC label** | Use `Número de Registro Fiscal` in UI. The data field is `taxId`. Placeholder shows example: "RFC, RIF, NIT…" |
| **localStorage always** | Every change in the wizard and config form auto-saves to localStorage before touching DynamoDB. |
| **Config gate** | `quoteService.createQuote()` throws `QUOTE_CONFIG_MISSING` if `paint-quote-config` has no `main` item. The wizard checks this on mount and redirects to settings if missing. |
| **Folio format** | `${prefix}${String(n).padStart(4, '0')}` — e.g., `COT-0001`. Counter is atomic in DynamoDB. |
| **Discount per line** | Each `QuoteItem` has its own `discountPercent: number`. No global discount field. |
| **PDF gate** | The "Generar PDF" button is disabled until the quote status is not `draft` and config exists. |
| **Client email** | Optional field. Never required for saving or PDF generation. |
| **Currency** | Stored as `{ code: string; symbol: string; label: string }`. Dropdown with common currencies + freetext option. |

---

## New DynamoDB tables

### `paint-quote-config`
**Env var:** `NEXT_DYNAMODB_TABLE_QUOTE_CONFIG`

| Attribute | Type | Notes |
|---|---|---|
| `configId` | String | PK. Always `"main"`. |
| `businessName` | String | Printed on PDF header. |
| `taxId` | String | Número de Registro Fiscal (RFC, RIF, NIT…). |
| `taxIdLabel` | String | Label shown on PDF: "RFC", "RIF", etc. |
| `address` | String | Fiscal address, multi-line ok. |
| `phone` | String | |
| `email` | String | |
| `logoUrl` | String | CloudFront URL from S3. Optional. |
| `currency` | Map | `{ code, symbol, label }`. E.g. `{ code: "MXN", symbol: "$", label: "Peso mexicano" }` |
| `ivaPercent` | Number | Default: 16. Configurable. |
| `defaultValidityDays` | Number | Default: 15. |
| `folioPrefix` | String | Default: `"COT-"`. |
| `lastFolioNumber` | Number | Atomic counter. Starts at 0. |
| `defaultNotes` | String | Pre-filled in every new quote. |
| `termsText` | String | Printed at the bottom of the PDF. |
| `bankDetails` | String | Optional. Printed on PDF if present. |
| `updatedAt` | String | ISO timestamp. |

GSI: none needed (single item).

---

### `paint-quote-catalog`
**Env var:** `NEXT_DYNAMODB_TABLE_QUOTE_CATALOG`

| Attribute | Type | Notes |
|---|---|---|
| `productId` | String | PK. UUID v4. |
| `name` | String | Indexed for autocomplete. |
| `description` | String | Optional. Pre-fills line item description. |
| `unit` | String | "pza", "lt", "kg", "m²", "hr", "svc", etc. |
| `unitPrice` | Number | Default price suggestion. Editable per quote. |
| `category` | String | Optional grouping. |
| `usageCount` | Number | Incremented on each use. Sort by this for autocomplete ranking. |
| `createdAt` | String | ISO timestamp. |
| `updatedAt` | String | ISO timestamp. |

GSI: none required initially. Autocomplete does client-side filter on a full Scan (catalog stays small). Add `name-index` GSI only if catalog exceeds ~500 items.

---

### `paint-quotes`
**Env var:** `NEXT_DYNAMODB_TABLE_QUOTES`

| Attribute | Type | Notes |
|---|---|---|
| `quoteId` | String | PK. UUID v4. |
| `quoteNumber` | String | e.g. `COT-0001`. Generated at creation. |
| `status` | String | `draft \| sent \| accepted \| rejected \| expired` |
| `clientName` | String | |
| `clientCompany` | String | Optional. |
| `clientTaxId` | String | Optional. Número de Registro Fiscal del cliente. |
| `clientEmail` | String | **Optional**. |
| `clientPhone` | String | Optional. |
| `clientAddress` | String | Optional. |
| `items` | List | Array of `QuoteItem` maps (see type below). |
| `subtotal` | Number | Sum of all line totals before IVA. |
| `ivaPercent` | Number | Snapshot of config IVA at creation time. |
| `ivaAmount` | Number | Computed. |
| `total` | Number | subtotal + ivaAmount. |
| `currency` | Map | Snapshot of config currency at creation time. |
| `validUntil` | String | ISO date. |
| `notes` | String | Visible on PDF. |
| `pdfS3Key` | String | S3 key of generated PDF. Null until generated. |
| `pdfGeneratedAt` | String | ISO timestamp. |
| `createdAt` | String | ISO timestamp. |
| `updatedAt` | String | ISO timestamp. |

GSI: `status-createdAt-index` — PK: `status`, SK: `createdAt` — for filtered list queries.

---

## Types  (`src/lib/types/`)

### `QuoteConfig.ts`
```ts
export interface CurrencyOption {
  code: string;   // "MXN"
  symbol: string; // "$"
  label: string;  // "Peso mexicano"
}

export interface QuoteConfig {
  configId: 'main';
  businessName: string;
  taxId: string;
  taxIdLabel: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  currency: CurrencyOption;
  ivaPercent: number;
  defaultValidityDays: number;
  folioPrefix: string;
  lastFolioNumber: number;
  defaultNotes?: string;
  termsText?: string;
  bankDetails?: string;
  updatedAt: string;
}

export type UpdateQuoteConfigInput = Omit<QuoteConfig, 'configId' | 'lastFolioNumber' | 'updatedAt'>;
```

### `QuoteCatalogItem.ts`
```ts
export interface QuoteCatalogItem {
  productId: string;
  name: string;
  description?: string;
  unit: string;
  unitPrice: number;
  category?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateCatalogItemInput = Pick<QuoteCatalogItem,
  'name' | 'description' | 'unit' | 'unitPrice' | 'category'
>;
```

### `Quote.ts`
```ts
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface QuoteItem {
  lineId: string;       // UUID — stable key for React rendering
  productId?: string;   // null if typed manually (not from catalog)
  name: string;
  description?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number; // 0–100. Per-line.
  lineTotal: number;    // quantity * unitPrice * (1 - discountPercent/100)
}

export interface Quote {
  quoteId: string;
  quoteNumber: string;
  status: QuoteStatus;
  clientName: string;
  clientCompany?: string;
  clientTaxId?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  items: QuoteItem[];
  subtotal: number;
  ivaPercent: number;
  ivaAmount: number;
  total: number;
  currency: CurrencyOption;
  validUntil: string;
  notes?: string;
  pdfS3Key?: string;
  pdfGeneratedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateQuoteInput = Omit<Quote,
  'quoteId' | 'quoteNumber' | 'subtotal' | 'ivaAmount' | 'total' |
  'pdfS3Key' | 'pdfGeneratedAt' | 'createdAt' | 'updatedAt'
>;

export type UpdateQuoteInput = Partial<CreateQuoteInput> & { status?: QuoteStatus };

export interface QuoteListFilters {
  status?: QuoteStatus;
  search?: string;       // matches clientName or quoteNumber
  from?: string;         // ISO date
  to?: string;           // ISO date
}
```

---

## Repository layer  (`src/lib/repositories/`)

### `quoteConfigRepository.ts`
```
getConfig()                  → QuoteConfig | null
upsertConfig(input)          → QuoteConfig
incrementFolioAndGet()       → number   // atomic ADD :1 ReturnValues UPDATED_NEW
```

### `quoteCatalogRepository.ts`
```
findAll()                    → QuoteCatalogItem[]
findById(productId)          → QuoteCatalogItem | null
create(input)                → QuoteCatalogItem
update(productId, input)     → QuoteCatalogItem
delete(productId)            → void
incrementUsage(productId)    → void   // atomic ADD usageCount :1
```

### `quoteRepository.ts`
```
findAll(filters)             → Quote[]
findById(quoteId)            → Quote | null
create(quote)                → Quote
update(quoteId, input)       → Quote
delete(quoteId)              → void
updatePdfKey(quoteId, key)   → void
```

---

## Service layer  (`src/lib/services/`)

### `quoteConfigService.ts`
```
getConfig()                  → QuoteConfig | null
saveConfig(input)            → QuoteConfig
getNextFolioNumber()         → string   // calls incrementFolioAndGet(), formats COT-0001
```

### `quoteCatalogService.ts`
```
getAllItems()                 → QuoteCatalogItem[]
addItem(input)               → QuoteCatalogItem
updateItem(id, input)        → QuoteCatalogItem
deleteItem(id)               → void
// Auto-creates catalog entry when a manually-typed item is saved in a quote
upsertFromQuoteItem(item)    → void
```

### `quoteService.ts`
```
getQuotes(filters)           → Quote[]
getQuote(id)                 → Quote
createQuote(input)           → Quote   // throws QUOTE_CONFIG_MISSING if no config
updateQuote(id, input)       → Quote
deleteQuote(id)              → void
updateStatus(id, status)     → Quote
// Compute helpers (pure, no DB):
computeLineTotal(item)       → number
computeTotals(items, ivaPct) → { subtotal, ivaAmount, total }
```

### `quotePdfService.ts`
```
generateAndUpload(quoteId)   → string  // returns CloudFront URL
// Internally:
//   1. getQuote(quoteId)
//   2. getConfig()
//   3. @react-pdf/renderer → Buffer
//   4. S3 PutObject to quotes/pdfs/{quoteId}.pdf
//   5. quoteRepository.updatePdfKey(quoteId, s3Key)
//   6. return CloudFront URL
```

---

## API Routes  (`src/app/api/`)

All routes are admin-only — every handler starts with `verifySession`.
All responses use `{ success: true; data: T }` / `{ success: false; error: string; code?: string }`.

| Method | Route | Handler | Notes |
|---|---|---|---|
| GET | `/api/quotes/config` | quoteConfigService.getConfig | Returns null if unconfigured |
| PATCH | `/api/quotes/config` | quoteConfigService.saveConfig | Full upsert |
| POST | `/api/quotes/config/logo` | S3 presigned PUT URL | Same pattern as `/api/media/upload` |
| GET | `/api/quotes/catalog` | quoteCatalogService.getAllItems | Sorted by usageCount desc |
| POST | `/api/quotes/catalog` | quoteCatalogService.addItem | |
| PATCH | `/api/quotes/catalog/[productId]` | quoteCatalogService.updateItem | |
| DELETE | `/api/quotes/catalog/[productId]` | quoteCatalogService.deleteItem | |
| GET | `/api/quotes` | quoteService.getQuotes | Accepts `?status=&search=&from=&to=` |
| POST | `/api/quotes` | quoteService.createQuote | Returns `QUOTE_CONFIG_MISSING` if needed |
| GET | `/api/quotes/[quoteId]` | quoteService.getQuote | |
| PATCH | `/api/quotes/[quoteId]` | quoteService.updateQuote | |
| DELETE | `/api/quotes/[quoteId]` | quoteService.deleteQuote | |
| PATCH | `/api/quotes/[quoteId]/status` | quoteService.updateStatus | `{ status }` body |
| POST | `/api/quotes/[quoteId]/pdf` | quotePdfService.generateAndUpload | Returns `{ url }` — CloudFront signed URL, TTL 10 min |

---

## Dashboard pages  (`src/app/(admin)/dashboard/quotes/`)

### `/dashboard/quotes` — Lista de cotizaciones

**Component:** `QuoteList.tsx`  
**Mobile layout:** Cards stacked vertically, NOT a table. Each card shows: folio, client, total, status badge, date, action menu.  
**Desktop layout:** Table with columns: Folio · Cliente · Total · Estado · Fecha · Acciones.

Filter bar (`QuoteFilterBar.tsx`) sits above the list:
- Status selector (pill buttons, not a dropdown — fits mobile)
- Search input (quoteNumber or clientName)
- Date range (from / to) — collapsed behind a "Filtros" toggle on mobile

**Behavior:**
- Filters update URL query params (`?status=sent&search=Maria`)
- On mount, reads query params and applies filters
- Empty state with CTA to create first quote

---

### `/dashboard/quotes/new` — Wizard de creación

**Component:** `QuoteWizard.tsx`

5 steps rendered as a vertical stepper on mobile (top progress indicator, one step visible at a time) and a two-column layout on desktop (steps list left, active step right).

**localStorage key:** `quote_wizard_draft`  
Auto-save: `useEffect` on every state change → `localStorage.setItem('quote_wizard_draft', JSON.stringify(wizardState))`  
On mount: read from localStorage and restore state.  
On successful save: `localStorage.removeItem('quote_wizard_draft')`

On mount, checks if config exists. If not, shows a banner:
> "Antes de crear una cotización, configura los datos de tu negocio." → [Ir a Configuración]

#### Step 1 — Cliente
Fields: Nombre del cliente (required) · Empresa · Número de Registro Fiscal · Email (**optional**) · Teléfono · Dirección  
Mobile: single-column stack. No tables.

#### Step 2 — Productos
**Component:** `QuoteItemEditor.tsx`  
Each line item is a card on mobile (not a table row):
```
[Producto / servicio  ▾ autocomplete     ]
[Cant.  ] [Unidad ] [Precio  ] [Dto. %  ]
                              Total: $0.00
                                   [✕ Eliminar]
```
Desktop: table with columns Producto · Cant · Unidad · Precio Unit. · Dto. % · Total · ✕

**ProductAutocomplete:** `<input>` with dropdown list filtered client-side from catalog. Selecting populates name, unit, unitPrice. Typing a new name that doesn't match catalog will create a new catalog entry on save.

"+ Agregar producto" button appends a new empty card.

All math is done in JS — no server roundtrip for totals.

#### Step 3 — Montos
Read-only summary:
- Lista de líneas con totales
- Subtotal
- IVA (configIvaPercent %)
- **Total**

Plus: `<select>` to override IVA % for this quote only (pre-filled from config).  
Vigencia: `<select>` with 7/15/30/60/90 days or custom date picker.

No horizontal scroll. Responsive two-column summary on desktop, single-column on mobile.

#### Step 4 — Notas y términos
Textarea for notes (pre-filled from `config.defaultNotes`).  
Read-only preview of `config.termsText` — link to settings to edit.

#### Step 5 — Revisión y guardar
Full quote preview in card format (not PDF yet — that's generated separately).  
"Guardar cotización" → POST `/api/quotes` → redirects to `/dashboard/quotes/[quoteId]`  
"Guardar como borrador" → same endpoint, status = `draft`

---

### `/dashboard/quotes/[quoteId]` — Vista de cotización

Shows the full quote in read-only card layout.  
Action bar (sticky bottom on mobile):
- [Cambiar estado ▾] — dropdown: enviada / aceptada / rechazada / expirada
- [Generar PDF] — disabled if status = `draft` OR config missing. Calls `POST /api/quotes/[quoteId]/pdf` → triggers browser download via the returned CloudFront URL.
- [Editar] — returns to wizard pre-filled (reads from DB, not localStorage)
- [Eliminar] — with confirmation modal

"Generar PDF" replaces itself with "Descargar PDF" if `pdfGeneratedAt` is set, and also shows the generation date.

---

### `/dashboard/quotes/settings` — Configuración

**Component:** `QuoteConfigForm.tsx`  
**localStorage key:** `quote_config_draft`  
Auto-save same pattern as wizard.

Sections (stacked on mobile, two columns on desktop):

**Datos del emisor**
- Nombre del negocio
- Tipo de Registro Fiscal (input: label to show, e.g., "RFC") + Número de Registro Fiscal
- Dirección
- Teléfono · Email

**Logo**
- Upload via presigned URL (same as `GalleryEditor.tsx` pattern)
- Preview thumbnail

**Configuración de cotizaciones**
- Moneda: `<select>` with common options + "Otra (manual)" option that reveals two inputs (símbolo + código). Pre-built list:

```ts
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'MXN', symbol: '$',  label: 'Peso mexicano' },
  { code: 'USD', symbol: '$',  label: 'Dólar estadounidense' },
  { code: 'EUR', symbol: '€',  label: 'Euro' },
  { code: 'COP', symbol: '$',  label: 'Peso colombiano' },
  { code: 'VES', symbol: 'Bs', label: 'Bolívar venezolano' },
  { code: 'ARS', symbol: '$',  label: 'Peso argentino' },
  { code: 'CLP', symbol: '$',  label: 'Peso chileno' },
  { code: 'PEN', symbol: 'S/', label: 'Sol peruano' },
  { code: 'BRL', symbol: 'R$', label: 'Real brasileño' },
  { code: 'OTHER', symbol: '', label: 'Otra (manual)' },
];
```

- IVA %: number input (0–100)
- Vigencia por defecto: number input (días)
- Prefijo de folio: text input ("COT-", "PRE-", etc.)

**Textos por defecto**
- Notas por defecto (textarea)
- Términos y condiciones (textarea)
- Datos bancarios (textarea, optional)

"Guardar configuración" → PATCH `/api/quotes/config` → success snackbar.

**Catalog manager** — accessible from a tab or section within settings:
- List of saved products (cards on mobile)
- Edit / Delete per item
- "+ Agregar producto" form

---

## localStorage strategy

| Key | Content | Cleared when |
|---|---|---|
| `quote_wizard_draft` | Full `WizardState` object | Quote saved successfully |
| `quote_config_draft` | `UpdateQuoteConfigInput` partial | Config saved successfully |
| `quote_catalog_cache` | `QuoteCatalogItem[]` | On every catalog mutation |

All reads use a try/catch — corrupted data falls back to empty state gracefully.

```ts
// Pattern for all localStorage reads
function readDraft<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
```

---

## PDF generation — `quotePdfService.ts`

Uses `@react-pdf/renderer`. Document structure:

```
[Logo + Business info]          [Cotización: COT-0001]
                                [Fecha: ... Vigencia: ...]

DATOS DEL CLIENTE
Nombre | Empresa | Registro Fiscal | Teléfono | Email (if present)

DETALLE
| Producto | Desc | Cant | Unidad | Precio | Dto% | Total |

                    SUBTOTAL   $0,000.00
                    IVA (16%)    $000.00
                    TOTAL      $0,000.00

NOTAS
...

TÉRMINOS Y CONDICIONES
...

DATOS DE PAGO (if bankDetails set)
...
```

S3 path: `quotes/pdfs/{quoteId}.pdf`  
CloudFront URL TTL: 10 minutes (pre-signed via `getSignedUrl`).

The PDF component lives in `src/lib/pdf/QuoteDocument.tsx` — pure `@react-pdf/renderer`, no Tailwind, no CSS variables.

---

## Folio generation — atomic pattern

```ts
// quoteConfigRepository.ts
async incrementFolioAndGet(): Promise<number> {
  const result = await docClient.send(new UpdateCommand({
    TableName: process.env.NEXT_DYNAMODB_TABLE_QUOTE_CONFIG,
    Key: { configId: 'main' },
    UpdateExpression: 'ADD lastFolioNumber :one',
    ExpressionAttributeValues: { ':one': 1 },
    ReturnValues: 'UPDATED_NEW',
  }));
  return result.Attributes!.lastFolioNumber as number;
}

// quoteConfigService.ts
async getNextFolioNumber(): Promise<string> {
  const config = await quoteConfigRepository.getConfig();
  if (!config) throw new Error('QUOTE_CONFIG_MISSING');
  const n = await quoteConfigRepository.incrementFolioAndGet();
  return `${config.folioPrefix}${String(n).padStart(4, '0')}`;
}
```

---

## Mobile-first rules for this phase

- **No `<table>` on mobile.** Quote item editor and quote list use card layouts below `md:` breakpoint.
- **Sticky action bar.** In the wizard and quote detail, action buttons are `fixed bottom-0` on mobile, normal flow on desktop.
- **Touch targets.** All interactive elements minimum 44×44px.
- **No horizontal scroll.** PDF preview in the browser is a simplified HTML card, not an embedded PDF iframe.
- **Step indicator.** Wizard uses pill steps (`1 · 2 · 3 · 4 · 5`) with `overflow-x: auto; white-space: nowrap` — never wraps to two lines.
- **Currency symbol.** Always shown inline next to amount inputs — never in a separate column that causes overflow.

---

## Smoke tests  (`tests/smoke/`)

Add these 5 tests to the existing suite (total becomes 12):

| File | Happy path covered |
|---|---|
| `quote-config.test.ts` | GET `/api/quotes/config` returns null when unconfigured; PATCH saves and returns config |
| `quote-catalog.test.ts` | POST `/api/quotes/catalog` creates item; GET returns list sorted by usageCount |
| `quote-create.test.ts` | POST `/api/quotes` creates quote with correct folio, computed totals, and status=draft |
| `quote-status.test.ts` | PATCH `/api/quotes/[id]/status` transitions draft → sent → accepted |
| `quote-pdf.test.ts` | POST `/api/quotes/[id]/pdf` calls S3 PutObject (mocked) and returns CloudFront URL |

All 5 must pass with zero AWS calls (mock DynamoDB and S3 clients same as existing tests).

---

## Dependencies to install

```bash
yarn add @react-pdf/renderer
yarn add uuid
yarn add -D @types/uuid
```

---

## Phase 5 checklist — implement in this order

### A — Foundation
- [ ] Create 3 DynamoDB tables (see table definitions above) + update `docs/aws-dynamodb-setup.md`
- [ ] Add env vars to Amplify Console: `NEXT_DYNAMODB_TABLE_QUOTE_CONFIG`, `NEXT_DYNAMODB_TABLE_QUOTE_CATALOG`, `NEXT_DYNAMODB_TABLE_QUOTES`
- [ ] `yarn add @react-pdf/renderer uuid` + `yarn add -D @types/uuid`
- [ ] `src/lib/types/QuoteConfig.ts` + `CURRENCY_OPTIONS` constant
- [ ] `src/lib/types/QuoteCatalogItem.ts`
- [ ] `src/lib/types/Quote.ts`

### B — Repository layer
- [ ] `src/lib/repositories/quoteConfigRepository.ts`
- [ ] `src/lib/repositories/quoteCatalogRepository.ts`
- [ ] `src/lib/repositories/quoteRepository.ts`

### C — Service layer
- [ ] `src/lib/services/quoteConfigService.ts` (includes getNextFolioNumber)
- [ ] `src/lib/services/quoteCatalogService.ts`
- [ ] `src/lib/services/quoteService.ts` (includes computeLineTotal, computeTotals)
- [ ] `src/lib/pdf/QuoteDocument.tsx` (@react-pdf/renderer component)
- [ ] `src/lib/services/quotePdfService.ts`

### D — API Routes
- [ ] `src/app/api/quotes/config/route.ts` (GET + PATCH)
- [ ] `src/app/api/quotes/config/logo/route.ts` (POST presigned URL)
- [ ] `src/app/api/quotes/catalog/route.ts` (GET + POST)
- [ ] `src/app/api/quotes/catalog/[productId]/route.ts` (PATCH + DELETE)
- [ ] `src/app/api/quotes/route.ts` (GET + POST)
- [ ] `src/app/api/quotes/[quoteId]/route.ts` (GET + PATCH + DELETE)
- [ ] `src/app/api/quotes/[quoteId]/status/route.ts` (PATCH)
- [ ] `src/app/api/quotes/[quoteId]/pdf/route.ts` (POST)

### E — UI Components
- [ ] `src/components/admin/quotes/QuoteStatusBadge.tsx`
- [ ] `src/components/admin/quotes/QuoteFilterBar.tsx`
- [ ] `src/components/admin/quotes/QuoteCard.tsx` (mobile card for list)
- [ ] `src/components/admin/quotes/QuoteList.tsx`
- [ ] `src/components/admin/quotes/ProductAutocomplete.tsx`
- [ ] `src/components/admin/quotes/QuoteItemEditor.tsx` (single line card + desktop row)
- [ ] `src/components/admin/quotes/QuoteWizard.tsx` (orchestrates steps)
- [ ] `src/components/admin/quotes/QuoteConfigForm.tsx`
- [ ] `src/components/admin/quotes/QuoteCatalogManager.tsx`

### F — Dashboard Pages
- [ ] `src/app/(admin)/dashboard/quotes/page.tsx`
- [ ] `src/app/(admin)/dashboard/quotes/new/page.tsx`
- [ ] `src/app/(admin)/dashboard/quotes/[quoteId]/page.tsx`
- [ ] `src/app/(admin)/dashboard/quotes/settings/page.tsx`
- [ ] Add "Cotizaciones" link to existing `dashboard/layout.tsx` sidebar

### G — Tests + Build
- [ ] `tests/smoke/quote-config.test.ts`
- [ ] `tests/smoke/quote-catalog.test.ts`
- [ ] `tests/smoke/quote-create.test.ts`
- [ ] `tests/smoke/quote-status.test.ts`
- [ ] `tests/smoke/quote-pdf.test.ts`
- [ ] `yarn build` passes with zero TypeScript errors
- [ ] All 12 smoke tests pass
- [ ] End-to-end: create config → create quote → change status to sent → generate PDF → download

### H — Update project docs
- [ ] Update `CLAUDE.md` Phase table: Phase 5 → In Progress
- [ ] Update `CLAUDE.md` Phase line: `**Current phase:** Phase 5 — Quote System`
- [ ] Add Phase 5 checklist to `CLAUDE.md`
- [ ] Add new table env vars to the AWS services table in `CLAUDE.md`

---

## Config gate implementation

```ts
// src/lib/services/quoteService.ts
async createQuote(input: CreateQuoteInput): Promise<Quote> {
  const config = await quoteConfigService.getConfig();
  if (!config) {
    throw Object.assign(new Error('Quote config not set up'), { code: 'QUOTE_CONFIG_MISSING' });
  }
  const quoteNumber = await quoteConfigService.getNextFolioNumber();
  // ... rest of creation logic
}

// src/app/api/quotes/route.ts (POST)
} catch (error: unknown) {
  if (error instanceof Error && 'code' in error && error.code === 'QUOTE_CONFIG_MISSING') {
    return NextResponse.json(
      { success: false, error: 'Configura los datos del negocio antes de crear cotizaciones.', code: 'QUOTE_CONFIG_MISSING' },
      { status: 422 }
    );
  }
  throw error;
}
```

---

## Notes for Claude Code sessions

Paste tasks in this format:

```
Implement quoteRepository.ts.
It must expose: findAll(filters), findById(quoteId), create(quote), update(quoteId, input), delete(quoteId), updatePdfKey(quoteId, key).
Use the DocumentClient singleton from src/lib/aws/dynamodb.ts.
Table name from process.env.NEXT_DYNAMODB_TABLE_QUOTES.
No business logic — repository only.
Follow all rules in CLAUDE.md.
```