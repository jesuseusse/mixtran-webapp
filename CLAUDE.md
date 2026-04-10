# CLAUDE.md — Paint Brand Platform

> This file is read automatically by Claude Code on every session.
> It is the single source of truth for rules, conventions, and context.
> Full architecture plan: docs/DEVELOPMENT_PLAN.md

---

## Project

Paint brand marketing and operations platform built entirely on AWS.
Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · AWS Amplify + DynamoDB + Cognito + SES + S3

**Current phase:** Phase 3 — CRM + Reviews  
**Update this line** when moving to the next phase.

---

## Non-negotiable rules

### Language

**Two separate concerns — never mix them up:**

| Layer | Language | Examples |
|---|---|---|
| Code | English | variable names, function names, type names, JSDoc, inline comments |
| UI copy | Spanish | headings, body text, CTAs, labels, placeholders, error messages, alt text |

- All identifiers, JSDoc, and comments are English — always.
- All user-visible strings are Spanish — always. No translations, no English copy in the UI.
- `lang="es"` on the `<html>` tag in `layout.tsx`.
- OG locale: `es_MX`. `sitemap.ts` and metadata use Spanish descriptions.

### Colors — theme only
```
❌ className="bg-red-500 text-green-200 border-blue-300"
✅ className="bg-danger text-on-danger border-border"
```
Every color must map to a CSS variable in `src/app/globals.css`.
To retheme: change hex values in `:root` only. Never touch component files.

### Architecture layers — strict separation
```
Page / API Route  →  Service  →  Repository  →  AWS SDK client
```
- **Repository** (`src/lib/repositories/`): DynamoDB / S3 / SES calls only. No business logic.
- **Service** (`src/lib/services/`): Business logic and orchestration. Imports repositories only. Never imports AWS SDK directly.
- **API Route** (`src/app/api/`): HTTP concerns only (parse request, call service, return response). No business logic.
- **Page** (`src/app/`): Composition only. Calls services server-side or API routes client-side. No AWS SDK imports.

### API response shape — always
```ts
// Success
{ success: true; data: T }

// Error
{ success: false; error: string; code?: string }
```

### Auth guard — every protected API route must start with
```ts
const user = await verifySession(request);
if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
```

### UI components
- All primitives (Button, Modal, Snackbar, Toggle, Badge, Input, Select, Card, Spinner, Rating) live in `src/components/ui/`.
- They must be stateless, accept `className?: string`, and contain zero business logic.
- Use `forwardRef` on all input-like primitives.
- Re-export everything from `src/components/ui/index.ts`.

### Documentation
- Every exported function, component, and type must have a JSDoc comment.
- Inline comments required for non-obvious logic.

### ISR — landing page
- `src/app/(public)/page.tsx` must have `export const revalidate = 3600`.
- Call `revalidatePath('/')` from any service that modifies content shown on the landing (review approval, landing config update).

### No external auth or storage libs
- No Firebase. No Cloudinary. No Supabase. No NextAuth.
- Auth: AWS Cognito + `aws-jwt-verify` only.
- Storage: AWS S3 with presigned URLs.
- Email: AWS SES only.

---

## Theme tokens (do not hardcode hex in components)

```
bg-primary        text-primary        → brand navy
bg-secondary      text-secondary      → lighter navy
bg-accent         text-accent         → brand highlight
bg-surface                            → white cards
bg-background                         → off-white page
bg-border                             → dividers

text-text-primary                     → main body text
text-text-secondary                   → supporting text
text-text-muted                       → hints, placeholders
text-on-primary                       → text on primary bg
text-on-accent                        → text on accent bg

bg-success  text-on-success
bg-warning  text-on-warning
bg-danger   text-on-danger
bg-info     text-on-info
```

---

## AWS services in use

All server-side env vars use the `NEXT_` prefix. Only truly public values use `NEXT_PUBLIC_`.

| Service | Env var prefix | Purpose |
|---|---|---|
| Amplify | — | Hosting + CI/CD |
| Cognito | `NEXT_COGNITO_*` | Admin auth (JWT → httpOnly cookie) |
| DynamoDB | `NEXT_DYNAMODB_TABLE_*` | All data tables |
| SES | `NEXT_SES_*` | Transactional email |
| S3 | `NEXT_S3_*` | Media storage |
| CloudFront | `NEXT_S3_CLOUDFRONT_URL` | Media CDN |

---

## DynamoDB tables

| Table | Env var | PK |
|---|---|---|
| `paint-slots` | `NEXT_DYNAMODB_TABLE_SLOTS` | `slotId` |
| `paint-contacts` | `NEXT_DYNAMODB_TABLE_CONTACTS` | `email` |
| `paint-reviews` | `NEXT_DYNAMODB_TABLE_REVIEWS` | `reviewId` |
| `paint-landing-config` | `NEXT_DYNAMODB_TABLE_LANDING` | `sectionId` |

---

## Landing sections (Phase 1 — static content as props)

| Component | File | Section ID |
|---|---|---|
| HeroSection | `src/components/landing/HeroSection.tsx` | `hero` |
| AboutSection | `src/components/landing/AboutSection.tsx` | `about` |
| ProductsSection | `src/components/landing/ProductsSection.tsx` | `products` |
| GallerySection | `src/components/landing/GallerySection.tsx` | `gallery` |
| ReviewsSection | `src/components/landing/ReviewsSection.tsx` | `reviews` |
| BookingCtaSection | `src/components/landing/BookingCtaSection.tsx` | `booking_cta` |
| ContactSection | `src/components/landing/ContactSection.tsx` | `contact` |

In Phase 4 these receive props from DynamoDB via `landingService.getSections()`.
In Phase 1 content is hardcoded as props — component signatures must already accept the props shape so Phase 4 requires zero refactor.

---

## Phases

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Landing page (SSG + ISR, SEO, all UI primitives) | ✅ Complete |
| 2 | Booking system (Cognito, calendar, SES emails) | ✅ Complete |
| 3 | CRM + Reviews (contacts auto-upsert, moderation) | 🔄 In progress |
| 4 | Landing editor (DynamoDB config, S3 media, revalidation) | ⏳ Pending |

**Update status column** as phases complete.

---

## Phase 1 checklist

Complete these in order. Check each one when done.

- [x] `npm create next-app` with TypeScript + Tailwind + App Router + ESLint
- [x] `src/app/globals.css` — full CSS variable theme (all tokens in `:root`)
- [x] `tailwind.config.ts` — semantic color mapping to CSS variables
- [x] `src/components/ui/Button.tsx` + all UI primitives
- [x] `src/components/ui/index.ts` — re-exports
- [x] `src/components/landing/HeroSection.tsx`
- [x] `src/components/landing/AboutSection.tsx`
- [x] `src/components/landing/ProductsSection.tsx`
- [x] `src/components/landing/GallerySection.tsx`
- [x] `src/components/landing/ReviewsSection.tsx`
- [x] `src/components/landing/BookingCtaSection.tsx`
- [x] `src/components/landing/ContactSection.tsx`
- [x] `src/app/(public)/page.tsx` — composes sections, `revalidate = 3600`
- [x] `src/lib/utils/seo.ts` — `generateMetadata` helper + JSON-LD builders
- [x] `generateMetadata` in landing page (OG, Twitter cards, canonical)
- [x] `LocalBusiness` + `Product` JSON-LD `<script>` in landing
- [x] `src/app/sitemap.ts`
- [x] `src/app/robots.ts`
- [x] `amplify.yml` — build spec
- [ ] Deploy to Amplify + custom domain via Route 53
- [ ] Lighthouse SEO score ≥ 90
- [ ] Core Web Vitals pass

---

## Phase 2 checklist

- [x] `yarn add @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-sesv2 @aws-sdk/client-cognito-identity-provider aws-jwt-verify`
- [x] `src/lib/types/Slot.ts` — CalendarSlot, SlotStatus
- [x] `src/lib/types/Booking.ts` — CreateBookingInput, UpdateBookingStatusInput
- [x] `src/lib/types/Contact.ts` — Contact, UpsertContactInput
- [x] `src/lib/aws/dynamodb.ts` — DocumentClient singleton
- [x] `src/lib/aws/ses.ts` — sendEmail() wrapper
- [x] `src/lib/auth/verifySession.ts` — lazy Cognito JWT verifier
- [x] `src/lib/repositories/slotRepository.ts`
- [x] `src/lib/repositories/contactRepository.ts`
- [x] `src/lib/services/bookingService.ts`
- [x] `src/lib/services/contactService.ts`
- [x] `src/lib/services/emailService.ts` — SES HTML email templates (ES)
- [x] `src/app/api/auth/login/route.ts` + `logout/route.ts`
- [x] `src/app/api/calendar/slots/route.ts` (GET public + POST admin)
- [x] `src/app/api/calendar/slots/[id]/route.ts` (DELETE admin)
- [x] `src/app/api/calendar/slots/bulk/route.ts` (POST admin)
- [x] `src/app/api/calendar/bookings/route.ts` (POST public)
- [x] `src/app/api/calendar/bookings/[id]/route.ts` (PATCH admin)
- [x] `src/app/(public)/agendar/page.tsx` — public booking page
- [x] `src/app/(admin)/login/page.tsx`
- [x] `src/app/(admin)/dashboard/layout.tsx` — auth guard + sidebar
- [x] `src/app/(admin)/dashboard/page.tsx` — KPI overview
- [x] `src/app/(admin)/dashboard/calendar/page.tsx`
- [x] `src/app/(admin)/dashboard/calendar/bookings/page.tsx`
- [x] `src/app/(admin)/dashboard/contacts/page.tsx`
- [x] `src/components/admin/SlotManager.tsx`
- [x] `src/components/admin/BookingTable.tsx`
- [x] `yarn build` passes with zero TypeScript errors
- [x] Create DynamoDB tables (see `docs/aws-dynamodb-setup.md`)
- [x] Create Cognito user pool + admin user (see `docs/aws-cognito-setup.md`)
- [ ] Verify SES domain + request production access (see `docs/aws-ses-setup.md`)
- [ ] Set all NEXT_* env vars in Amplify Console
- [ ] End-to-end test: book a slot → emails arrive → admin confirms

---

## Phase 3 checklist

- [x] `src/lib/types/Review.ts` — Review, ReviewStatus, CreateReviewInput
- [x] `src/lib/repositories/reviewRepository.ts`
- [x] `src/lib/services/reviewService.ts` — submit, approve, reject, delete + revalidatePath('/')
- [x] `src/app/api/contacts/route.ts` (GET admin)
- [x] `src/app/api/contacts/[email]/route.ts` (GET + PATCH admin)
- [x] `src/app/api/reviews/route.ts` (GET admin + POST public)
- [x] `src/app/api/reviews/[id]/route.ts` (PATCH + DELETE admin)
- [x] `src/app/(public)/resenas/page.tsx` — public review submission form
- [x] `src/app/(admin)/dashboard/contacts/[email]/page.tsx` — contact detail + booking history
- [x] `src/app/(admin)/dashboard/reviews/page.tsx` — moderation queue
- [x] `src/components/admin/ContactNotesForm.tsx`
- [x] `src/components/admin/ReviewModerationCard.tsx`
- [x] `src/components/admin/ReviewModerationList.tsx`
- [x] Landing page wired to `reviewService.getApprovedReviews()` (ISR)
- [x] `yarn build` passes with zero TypeScript errors
- [ ] End-to-end test: submit review → admin approves → appears on landing

---

## Smoke tests — mandatory after every modification

After **every code change**, run the smoke test suite before considering the task done:

```bash
yarn test
```

- All 7 tests must pass. If any fail, fix the regression before moving on.
- Tests live in `tests/smoke/`. Each file covers one happy path:
  - `login.test.ts` — POST /api/auth/login
  - `landing.test.ts` — reviewService.getApprovedReviews (landing data layer)
  - `contact-form.test.ts` — POST /api/contacts (public contact form)
  - `booking-form.test.ts` — POST /api/calendar/bookings (public booking form)
  - `slot-create.test.ts` — POST /api/calendar/slots (admin create slot)
  - `bookings-list.test.ts` — bookingService.getAllSlots (admin reservas data layer)
  - `contacts-list.test.ts` — GET /api/contacts (admin contacts list)
- When adding a new feature or route, add the corresponding smoke test **in the same change**.
- Tests run in ~400 ms — no AWS calls are made (all infrastructure is mocked).

---

## How to start a session

Paste the task directly. Example:

```
Implement HeroSection.tsx for the landing page.
It receives: headline (string), subtitle (string), ctaText (string), ctaHref (string), backgroundImageUrl (string).
Follow all rules in CLAUDE.md.
```

No need to re-explain the architecture — Claude Code reads this file automatically.

---

## Package manager

**yarn** (v3 — Berry). Never use npm in this project.

```bash
yarn install         # install dependencies
yarn add <pkg>       # add a dependency
yarn add -D <pkg>    # add a dev dependency
yarn remove <pkg>    # remove a package
```

## Common commands

```bash
yarn dev             # local dev server
yarn build           # production build
yarn lint            # ESLint check
yarn typecheck       # tsc --noEmit

# Deploy (handled by Amplify on git push to main)
git push origin main
```