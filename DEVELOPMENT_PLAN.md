# Paint Brand Platform — Development Plan

> **Read this file before starting any session with Claude Code.**  
> It is the single source of truth for architecture decisions, coding conventions, and phased delivery.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & AWS Services](#2-tech-stack--aws-services)
3. [Coding Standards](#3-coding-standards)
4. [Project Structure](#4-project-structure)
5. [Theme & Design System](#5-theme--design-system)
6. [Architecture Patterns](#6-architecture-patterns)
7. [AWS Setup Instructions](#7-aws-setup-instructions)
8. [Development Phases](#8-development-phases)
9. [Claude Code Instructions](#9-claude-code-instructions)

---

## 1. Project Overview

A marketing and operations platform for a paint brand, built entirely on AWS. The system covers:

- **Public landing page** — SEO-first, section-based, ISR-powered
- **Booking system** — color advisory appointments (1-on-1)
- **CRM** — client/contact management (email as primary key)
- **Reviews** — moderated review system, publicly displayed on landing
- **Admin dashboard** — single admin, no-code landing editor

**Domain model summary:**
- One admin user (owner)
- Clients book color advisory appointments
- Client record is auto-created on first booking (email = PK)
- Reviews are submitted publicly, approved by admin before appearing on landing
- Landing sections are toggled and edited from the dashboard (no code required)

---

## 2. Tech Stack & AWS Services

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Hosting / CI-CD | AWS Amplify |
| CDN | AWS CloudFront |
| DNS | AWS Route 53 |
| Auth | AWS Cognito (single admin, `USER_PASSWORD_AUTH`) |
| Database | AWS DynamoDB (DocumentClient, single-table per domain) |
| Email | AWS SES (transactional, HTML templates inline) |
| Storage | AWS S3 (presigned PUT, served via CloudFront) |
| Styling | Tailwind CSS v4 (theme configured in `index.css`) |
| Linting | ESLint + Prettier |

**No Firebase. No Cloudinary. No third-party auth.**

---

## 3. Coding Standards

These rules apply to every file in the project. Claude Code must follow them unconditionally.

### 3.1 Language & Documentation

- All code, comments, and JSDoc must be written in **English**.
- Every exported function, component, type, and constant must have a JSDoc comment.
- Inline comments are required for non-obvious logic.

```ts
/**
 * Retrieves all available calendar slots for a given date.
 * Returns slots with status null and isAvailable true.
 */
export async function getAvailableSlots(date: string): Promise<CalendarSlot[]> {
  // Filter by date using GSI to avoid full table scan
  return slotRepository.findAvailableByDate(date);
}
```

### 3.2 Colors — Theme Only

**Never use Tailwind color utilities directly (red-500, green-200, etc.).**  
Always use semantic CSS variables defined in `src/app/globals.css`.

```tsx
// ❌ Wrong
<div className="bg-red-500 text-white">Error</div>

// ✅ Correct
<div className="bg-danger text-on-danger">Error</div>
```

Every color used in JSX must map to a variable declared in the theme. See [Section 5](#5-theme--design-system).

### 3.3 Component Rules

- **UI primitives** (`Button`, `Modal`, `Snackbar`, `Toggle`, `Badge`, `Input`, `Select`, `Card`) must live in `src/components/ui/` and be reusable — no business logic inside.
- Every UI component must accept a `className?: string` prop for extension.
- Use `forwardRef` on all input-like primitives.
- No business logic in page components — pages compose feature components and call service functions.

### 3.4 Architecture Layers

```
Page / Route Handler
      ↓
  Service layer         ← business logic, orchestration
      ↓
Repository layer        ← DynamoDB calls, data mapping
      ↓
  AWS SDK client        ← DynamoDB DocumentClient, SES, S3
```

- **Repositories** only contain DynamoDB / AWS SDK calls. No business logic.
- **Services** contain business logic and orchestration. They call repositories and other services. Never import AWS SDK directly.
- **API Routes** call services only. They handle HTTP concerns (request parsing, response shaping, auth guard).
- **Pages** are Server Components by default. They call services directly (server-side) or fetch from API routes (client-side).

### 3.5 API Response Shape

Every API route must return this shape:

```ts
// Success
{ success: true; data: T }

// Error
{ success: false; error: string; code?: string }
```

### 3.6 Error Handling

- All repository methods must wrap SDK calls in try/catch and throw typed errors.
- Services must propagate errors with context (`throw new Error('slotService.book: slot not found')`).
- API routes must return consistent error responses — never let unhandled exceptions reach the client.

### 3.7 Auth Guard Pattern

```ts
// In every protected API route:
const user = await verifySession(request);
if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
```

---

## 4. Project Structure

```
paint-brand-site/
├── docs/
│   ├── DEVELOPMENT_PLAN.md          ← this file
│   ├── aws-amplify-setup.md
│   ├── aws-cognito-setup.md
│   ├── aws-dynamodb-setup.md
│   ├── aws-ses-setup.md
│   ├── aws-s3-cloudfront-setup.md
│   └── aws-route53-setup.md
│
├── public/
│   └── images/
│
├── src/
│   ├── app/
│   │   ├── (admin)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx            # Auth guard → redirect to /login
│   │   │       ├── page.tsx              # KPI overview
│   │   │       ├── calendar/
│   │   │       │   ├── page.tsx          # Slot management
│   │   │       │   └── bookings/
│   │   │       │       └── page.tsx      # Booking table + status + Snackbar
│   │   │       ├── contacts/
│   │   │       │   ├── page.tsx          # CRM list
│   │   │       │   └── [email]/
│   │   │       │       └── page.tsx      # Contact detail + booking history
│   │   │       ├── reviews/
│   │   │       │   └── page.tsx          # Moderation queue
│   │   │       └── landing/
│   │   │           └── page.tsx          # Section editor (toggle + content fields)
│   │   │
│   │   ├── (public)/
│   │   │   ├── page.tsx                  # Landing — SSG + ISR, SEO-first
│   │   │   └── agendar/
│   │   │       └── page.tsx              # Public booking page
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   ├── calendar/
│   │   │   │   ├── slots/route.ts
│   │   │   │   ├── slots/[id]/route.ts
│   │   │   │   ├── slots/bulk/route.ts
│   │   │   │   └── bookings/
│   │   │   │       ├── route.ts
│   │   │   │       └── [id]/route.ts
│   │   │   ├── contacts/
│   │   │   │   ├── route.ts
│   │   │   │   └── [email]/route.ts
│   │   │   ├── reviews/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── landing/route.ts
│   │   │   └── media/
│   │   │       ├── presign/route.ts
│   │   │       └── list/route.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                        # Reusable primitives — no business logic
│   │   │   │   ├── index.ts               # Re-exports all UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Textarea.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Snackbar.tsx
│   │   │   │   ├── Toggle.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Spinner.tsx
│   │   │   │   └── Rating.tsx
│   │   │   │
│   │   │   ├── landing/                   # One component per landing section
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── AboutSection.tsx
│   │   │   │   ├── ProductsSection.tsx
│   │   │   │   ├── GallerySection.tsx
│   │   │   │   ├── ReviewsSection.tsx
│   │   │   │   ├── BookingCtaSection.tsx
│   │   │   │   └── ContactSection.tsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── SectionEditor.tsx
│   │   │       ├── SlotManager.tsx
│   │   │       ├── BookingTable.tsx
│   │   │       ├── ContactCard.tsx
│   │   │       └── ReviewModerationCard.tsx
│   │   │
│   │   ├── layout.tsx
│   │   └── globals.css                    # Tailwind theme + CSS variables
│   │
│   └── lib/
│       ├── auth/
│       │   └── verifySession.ts           # Validates Cognito JWT from httpOnly cookie
│       ├── aws/
│       │   ├── dynamodb.ts                # DocumentClient singleton
│       │   ├── ses.ts                     # sendEmail() wrapper
│       │   └── s3.ts                      # presignedPutUrl(), listObjects()
│       ├── repositories/
│       │   ├── slotRepository.ts
│       │   ├── contactRepository.ts
│       │   ├── reviewRepository.ts
│       │   └── landingConfigRepository.ts
│       ├── services/
│       │   ├── bookingService.ts
│       │   ├── contactService.ts
│       │   ├── reviewService.ts
│       │   ├── landingService.ts
│       │   └── emailService.ts
│       ├── types/
│       │   ├── Slot.ts
│       │   ├── Booking.ts
│       │   ├── Contact.ts
│       │   ├── Review.ts
│       │   └── LandingConfig.ts
│       └── utils/
│           ├── dateTime.ts
│           ├── seo.ts                     # generateMetadata + JSON-LD builders
│           └── apiResponse.ts             # Typed success/error response helpers
│
├── amplify.yml
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 5. Theme & Design System

### 5.1 Configure Tailwind in `tailwind.config.ts`

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Map Tailwind utilities to CSS variables
        // Usage: className="bg-primary text-on-primary"
        primary:        'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        secondary:      'var(--color-secondary)',
        accent:         'var(--color-accent)',
        surface:        'var(--color-surface)',
        background:     'var(--color-background)',
        border:         'var(--color-border)',

        // Text
        'text-primary':   'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted':     'var(--color-text-muted)',
        'on-primary':     'var(--color-on-primary)',
        'on-accent':      'var(--color-on-accent)',

        // Semantic states
        success:    'var(--color-success)',
        warning:    'var(--color-warning)',
        danger:     'var(--color-danger)',
        info:       'var(--color-info)',
        'on-success': 'var(--color-on-success)',
        'on-warning': 'var(--color-on-warning)',
        'on-danger':  'var(--color-on-danger)',
        'on-info':    'var(--color-on-info)',
      },
      fontFamily: {
        sans:    'var(--font-sans)',
        heading: 'var(--font-heading)',
      },
      borderRadius: {
        sm:  'var(--radius-sm)',
        md:  'var(--radius-md)',
        lg:  'var(--radius-lg)',
        xl:  'var(--radius-xl)',
      },
      boxShadow: {
        card:    'var(--shadow-card)',
        modal:   'var(--shadow-modal)',
        button:  'var(--shadow-button)',
      },
    },
  },
};

export default config;
```

### 5.2 Define all tokens in `src/app/globals.css`

```css
@import "tailwindcss";

:root {
  /* ─── Brand palette ─────────────────────────────────────── */
  /* Replace these hex values to retheme the entire app */
  --color-primary:        #1A1A2E;   /* Deep navy — headers, CTAs */
  --color-primary-dark:   #0F0F1A;   /* Darker variant for hover */
  --color-secondary:      #16213E;   /* Slightly lighter navy */
  --color-accent:         #E94560;   /* Brand highlight — buttons, links */
  --color-background:     #F8F7F4;   /* Off-white page background */
  --color-surface:        #FFFFFF;   /* Cards, modals */
  --color-border:         #E2E0DA;   /* Dividers, input borders */

  /* ─── Text ──────────────────────────────────────────────── */
  --color-text-primary:   #1A1A2E;
  --color-text-secondary: #4A4A68;
  --color-text-muted:     #9090A8;
  --color-on-primary:     #FFFFFF;   /* Text on primary bg */
  --color-on-accent:      #FFFFFF;   /* Text on accent bg */

  /* ─── Semantic states ───────────────────────────────────── */
  --color-success:    #2D7D46;
  --color-warning:    #B45309;
  --color-danger:     #B91C1C;
  --color-info:       #1D4ED8;
  --color-on-success: #FFFFFF;
  --color-on-warning: #FFFFFF;
  --color-on-danger:  #FFFFFF;
  --color-on-info:    #FFFFFF;

  /* ─── Typography ────────────────────────────────────────── */
  --font-sans:    'Inter', system-ui, sans-serif;
  --font-heading: 'Playfair Display', Georgia, serif;

  /* ─── Radii ─────────────────────────────────────────────── */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 20px;

  /* ─── Shadows ───────────────────────────────────────────── */
  --shadow-card:   0 1px 3px rgb(0 0 0 / 0.08), 0 1px 2px rgb(0 0 0 / 0.06);
  --shadow-modal:  0 20px 60px rgb(0 0 0 / 0.15);
  --shadow-button: 0 1px 2px rgb(0 0 0 / 0.10);

  /* ─── Spacing scale (optional overrides) ────────────────── */
  --section-padding-y: 5rem;
  --section-padding-x: 1.5rem;
}
```

**To retheme the app:** change only the hex values in `:root`. Never touch component files.

---

## 6. Architecture Patterns

### 6.1 Repository Layer

```ts
// src/lib/repositories/slotRepository.ts

import { docClient } from '@/lib/aws/dynamodb';
import { GetCommand, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import type { CalendarSlot } from '@/lib/types/Slot';

const TABLE = process.env.NEXT_DYNAMODB_TABLE_SLOTS!;

/**
 * Finds all available slots for a given date.
 * Uses GSI `date-startTime-index` to avoid full scans.
 */
export async function findAvailableByDate(date: string): Promise<CalendarSlot[]> {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'date-startTime-index',
    KeyConditionExpression: '#date = :date',
    FilterExpression: 'isAvailable = :true',
    ExpressionAttributeNames: { '#date': 'date' },
    ExpressionAttributeValues: { ':date': date, ':true': true },
  }));
  return (result.Items ?? []) as CalendarSlot[];
}
```

### 6.2 Service Layer

```ts
// src/lib/services/bookingService.ts

import * as slotRepository from '@/lib/repositories/slotRepository';
import * as contactRepository from '@/lib/repositories/contactRepository';
import { emailService } from '@/lib/services/emailService';
import type { CreateBookingInput } from '@/lib/types/Booking';

/**
 * Books a slot and auto-upserts the contact record.
 * Runs as a DynamoDB transaction — both writes succeed or neither does.
 */
export async function createBooking(input: CreateBookingInput): Promise<void> {
  const slot = await slotRepository.findById(input.slotId);
  if (!slot || !slot.isAvailable) throw new Error('bookingService.createBooking: slot unavailable');

  await slotRepository.bookSlot(input);              // sets status='pending', embeds contact data
  await contactRepository.upsert(input);             // creates or updates contact record
  await emailService.sendBookingConfirmation(input); // SES email to client
  await emailService.sendBookingNotification(input); // SES email to admin
}
```

### 6.3 DynamoDB Tables

#### `slots` table

| Field | Type | Notes |
|---|---|---|
| `slotId` | PK (string) | UUID |
| `date` | GSI PK (string) | `YYYY-MM-DD` |
| `startTime` | GSI SK (string) | `HH:MM` |
| `endTime` | string | |
| `isAvailable` | boolean | false when booked |
| `status` | string \| null | `null` = free, `pending`, `confirmed`, `cancelled` |
| `contactEmail` | string | FK → contacts PK |
| `name`, `phone`, `message` | string | Embedded booking data |
| `meetLink` | string | Advisory meeting URL |
| `bookedAt` | string | ISO 8601 |

#### `contacts` table

| Field | Type | Notes |
|---|---|---|
| `email` | PK (string) | Unique identifier |
| `name`, `phone`, `company` | string | |
| `tags` | string[] | Admin-defined labels |
| `notes` | string | Admin notes |
| `totalBookings` | number | Auto-incremented on upsert |
| `lastBookingAt` | string | ISO 8601 |
| `createdAt`, `updatedAt` | string | ISO 8601 |

#### `reviews` table

| Field | Type | Notes |
|---|---|---|
| `reviewId` | PK (string) | UUID |
| `status` | GSI PK (string) | `pending`, `approved`, `rejected` |
| `createdAt` | GSI SK (string) | ISO 8601, used to sort moderation queue |
| `contactEmail`, `authorName` | string | |
| `rating` | number | 1–5 |
| `body` | string | Review text |

#### `landing_config` table

| Field | Type | Notes |
|---|---|---|
| `sectionId` | PK (string) | `hero`, `about`, `products`, `gallery`, `reviews`, `booking_cta`, `contact` |
| `enabled` | boolean | Admin toggles per section |
| `order` | number | Controls render order |
| `content` | map | JSON blob — shape varies per section |

---

## 7. AWS Setup Instructions

> Each file below is a standalone setup guide. Follow them in order for a new environment.

---

### `docs/aws-amplify-setup.md`

```markdown
# AWS Amplify Setup

## Prerequisites
- AWS account with admin IAM user
- Node.js 20+
- GitHub repository connected

## Steps

### 1. Create Amplify App
1. Open AWS Console → Amplify → **New app → Host web app**
2. Connect your GitHub repository and select the branch (e.g. `main`)
3. Framework detection: select **Next.js - SSR**
4. Click **Save and deploy**

### 2. Configure build spec (amplify.yml)
Place this file in the root of the repository:

\`\`\`yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - yarn install --frozen-lockfile
    build:
      commands:
        - yarn build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
      - .yarn/cache/**/*
\`\`\`

### 3. Add environment variables
In Amplify Console → App settings → Environment variables, add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` |
| `NEXT_AWS_REGION` | `us-east-1` |
| `NEXT_COGNITO_USER_POOL_ID` | from Cognito setup |
| `NEXT_COGNITO_CLIENT_ID` | from Cognito setup |
| `NEXT_DYNAMODB_TABLE_SLOTS` | `paint-slots` |
| `NEXT_DYNAMODB_TABLE_CONTACTS` | `paint-contacts` |
| `NEXT_DYNAMODB_TABLE_REVIEWS` | `paint-reviews` |
| `NEXT_DYNAMODB_TABLE_LANDING` | `paint-landing-config` |
| `NEXT_SES_FROM_EMAIL` | `noreply@yourdomain.com` |
| `NEXT_SES_ADMIN_EMAIL` | `admin@yourdomain.com` |
| `NEXT_S3_BUCKET_NAME` | `paint-brand-media` |
| `NEXT_S3_CLOUDFRONT_URL` | `https://xxxx.cloudfront.net` |
| `NEXT_SESSION_COOKIE_NAME` | `paint_session` |

### 4. IAM permissions for Amplify service role
Attach a custom policy to the Amplify service role:

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["dynamodb:*"], "Resource": "arn:aws:dynamodb:*:*:table/paint-*" },
    { "Effect": "Allow", "Action": ["ses:SendEmail", "ses:SendRawEmail"], "Resource": "*" },
    { "Effect": "Allow", "Action": ["s3:GetObject","s3:PutObject","s3:DeleteObject","s3:ListBucket"], "Resource": ["arn:aws:s3:::paint-brand-media","arn:aws:s3:::paint-brand-media/*"] },
    { "Effect": "Allow", "Action": ["cognito-idp:AdminInitiateAuth","cognito-idp:AdminGetUser"], "Resource": "*" }
  ]
}
\`\`\`

### 5. Enable SSR
In Amplify Console → Hosting → SSR, ensure it is enabled for Next.js App Router.
```

---

### `docs/aws-cognito-setup.md`

```markdown
# AWS Cognito Setup

## Purpose
Single admin user authentication. Amplify verifies the JWT from the session cookie
on every protected request using Cognito's JWKS endpoint.

## Steps

### 1. Create User Pool
1. Console → Cognito → **Create user pool**
2. Sign-in options: **Email**
3. Password policy: minimum 8 chars, require uppercase + number
4. MFA: optional (recommended for production)
5. No self-registration — admin creates users manually
6. Pool name: `paint-brand-admin`

### 2. Create App Client
1. Inside the pool → App clients → **Add app client**
2. App type: **Other**
3. Name: `paint-brand-server`
4. Auth flows: enable **ALLOW_ADMIN_USER_PASSWORD_AUTH**
5. No client secret (server-side Next.js calls)
6. Save the **User Pool ID** and **App Client ID**

### 3. Create admin user
\`\`\`bash
aws cognito-idp admin-create-user \
  --user-pool-id <POOL_ID> \
  --username admin@yourdomain.com \
  --temporary-password "TempPass1!" \
  --message-action SUPPRESS

aws cognito-idp admin-set-user-password \
  --user-pool-id <POOL_ID> \
  --username admin@yourdomain.com \
  --password "YourFinalPassword1!" \
  --permanent
\`\`\`

### 4. verifySession implementation
\`\`\`ts
// src/lib/auth/verifySession.ts
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { cookies } from 'next/headers';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.NEXT_COGNITO_USER_POOL_ID!,
  tokenUse: 'id',
  clientId: process.env.NEXT_COGNITO_CLIENT_ID!,
});

export async function verifySession() {
  const cookieStore = cookies();
  const token = cookieStore.get(process.env.NEXT_SESSION_COOKIE_NAME!)?.value;
  if (!token) return null;
  try {
    return await verifier.verify(token);
  } catch {
    return null;
  }
}
\`\`\`

Install: \`yarn add aws-jwt-verify\`
```

---

### `docs/aws-dynamodb-setup.md`

```markdown
# AWS DynamoDB Setup

## Create tables via AWS CLI

### slots table
\`\`\`bash
aws dynamodb create-table \
  --table-name paint-slots \
  --attribute-definitions \
    AttributeName=slotId,AttributeType=S \
    AttributeName=date,AttributeType=S \
    AttributeName=startTime,AttributeType=S \
  --key-schema AttributeName=slotId,KeyType=HASH \
  --global-secondary-indexes '[{
    "IndexName": "date-startTime-index",
    "KeySchema": [
      {"AttributeName":"date","KeyType":"HASH"},
      {"AttributeName":"startTime","KeyType":"RANGE"}
    ],
    "Projection": {"ProjectionType":"ALL"}
  }]' \
  --billing-mode PAY_PER_REQUEST
\`\`\`

### contacts table
\`\`\`bash
aws dynamodb create-table \
  --table-name paint-contacts \
  --attribute-definitions AttributeName=email,AttributeType=S \
  --key-schema AttributeName=email,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
\`\`\`

### reviews table
\`\`\`bash
aws dynamodb create-table \
  --table-name paint-reviews \
  --attribute-definitions \
    AttributeName=reviewId,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=reviewId,KeyType=HASH \
  --global-secondary-indexes '[{
    "IndexName": "status-createdAt-index",
    "KeySchema": [
      {"AttributeName":"status","KeyType":"HASH"},
      {"AttributeName":"createdAt","KeyType":"RANGE"}
    ],
    "Projection": {"ProjectionType":"ALL"}
  }]' \
  --billing-mode PAY_PER_REQUEST
\`\`\`

### landing_config table
\`\`\`bash
aws dynamodb create-table \
  --table-name paint-landing-config \
  --attribute-definitions AttributeName=sectionId,AttributeType=S \
  --key-schema AttributeName=sectionId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
\`\`\`

### Seed landing sections
\`\`\`bash
aws dynamodb batch-write-item --request-items '{
  "paint-landing-config": [
    {"PutRequest":{"Item":{"sectionId":{"S":"hero"},"enabled":{"BOOL":true},"order":{"N":"1"},"content":{"M":{}}}}},
    {"PutRequest":{"Item":{"sectionId":{"S":"about"},"enabled":{"BOOL":true},"order":{"N":"2"},"content":{"M":{}}}}},
    {"PutRequest":{"Item":{"sectionId":{"S":"products"},"enabled":{"BOOL":true},"order":{"N":"3"},"content":{"M":{}}}}},
    {"PutRequest":{"Item":{"sectionId":{"S":"gallery"},"enabled":{"BOOL":false},"order":{"N":"4"},"content":{"M":{}}}}},
    {"PutRequest":{"Item":{"sectionId":{"S":"reviews"},"enabled":{"BOOL":false},"order":{"N":"5"},"content":{"M":{}}}}},
    {"PutRequest":{"Item":{"sectionId":{"S":"booking_cta"},"enabled":{"BOOL":true},"order":{"N":"6"},"content":{"M":{}}}}},
    {"PutRequest":{"Item":{"sectionId":{"S":"contact"},"enabled":{"BOOL":true},"order":{"N":"7"},"content":{"M":{}}}}}
  ]
}'
\`\`\`
```

---

### `docs/aws-ses-setup.md`

```markdown
# AWS SES Setup

## Steps

### 1. Verify your domain
1. Console → SES → Verified identities → **Create identity**
2. Choose **Domain**, enter your domain (e.g. `yourdomain.com`)
3. Add the DKIM and TXT records to Route 53 (auto-populate if using Route 53)
4. Wait for verification (usually < 5 minutes with Route 53)

### 2. Verify sending email address
1. Verify `noreply@yourdomain.com` as an email identity
2. Verify `admin@yourdomain.com` to receive notifications

### 3. Request production access
By default SES is in sandbox — you can only send to verified addresses.
1. Console → SES → Account dashboard → **Request production access**
2. Fill in use case (transactional booking confirmations)
3. AWS approves in 24–48 hours

### 4. SES wrapper implementation
\`\`\`ts
// src/lib/aws/ses.ts
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const client = new SESv2Client({ region: process.env.NEXT_AWS_REGION });

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/** Sends a transactional email via SES. Always uses the verified FROM address. */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  await client.send(new SendEmailCommand({
    FromEmailAddress: process.env.NEXT_SES_FROM_EMAIL,
    Destination: { ToAddresses: [to] },
    Content: {
      Simple: {
        Subject: { Data: subject },
        Body: { Html: { Data: html } },
      },
    },
  }));
}
\`\`\`
```

---

### `docs/aws-s3-cloudfront-setup.md`

```markdown
# AWS S3 + CloudFront Setup

## S3 Bucket

### 1. Create bucket
\`\`\`bash
aws s3api create-bucket \
  --bucket paint-brand-media \
  --region us-east-1
\`\`\`

### 2. Block all public access (CloudFront OAC handles delivery)
\`\`\`bash
aws s3api put-public-access-block \
  --bucket paint-brand-media \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
\`\`\`

## CloudFront Distribution

### 3. Create distribution with OAC
1. Console → CloudFront → **Create distribution**
2. Origin domain: `paint-brand-media.s3.us-east-1.amazonaws.com`
3. Origin access: **Origin access control (OAC)** → Create new OAC
4. Viewer protocol policy: **Redirect HTTP to HTTPS**
5. Cache policy: **CachingOptimized**
6. Price class: choose per your audience geography
7. After creation, copy the **S3 bucket policy** that CloudFront shows and apply it to the bucket

### 4. Presigned PUT in API route
\`\`\`ts
// src/lib/aws/s3.ts
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = new S3Client({ region: process.env.NEXT_AWS_REGION });

/** Returns a presigned URL for direct browser-to-S3 upload. Expires in 5 minutes. */
export async function getPresignedPutUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.NEXT_S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 300 });
}

/** Returns the public CloudFront URL for a given S3 key. */
export function getPublicUrl(key: string): string {
  return `${process.env.NEXT_S3_CLOUDFRONT_URL}/${key}`;
}
\`\`\`
```

---

### `docs/aws-route53-setup.md`

```markdown
# AWS Route 53 Setup

## Steps

### 1. Register or transfer domain
- Console → Route 53 → **Register domain** (or transfer if already owned)

### 2. Create hosted zone
If domain is already registered elsewhere:
1. Route 53 → Hosted zones → **Create hosted zone**
2. Enter your domain name
3. Copy the 4 NS records to your domain registrar

### 3. Point domain to Amplify
1. In Amplify Console → App settings → **Domain management**
2. Add your custom domain
3. Amplify generates a CloudFront distribution and an SSL certificate (ACM)
4. Add the CNAME records Amplify shows you to your Route 53 hosted zone

### 4. SSL / HTTPS
ACM certificate is provisioned automatically by Amplify. No manual steps required.
DNS validation records are added automatically if using Route 53.
```

---

## 8. Development Phases

Each phase is a **shippable deliverable** that can go live independently.

---

### Phase 1 — Landing Page (Deliverable ✓)

**Goal:** A fully deployed, SEO-optimized public landing page with hard-coded content ready to be replaced by Phase 4's admin editor.

**Includes:**
- Project setup: Next.js 16, Tailwind v4, ESLint, Prettier
- `globals.css` with full CSS variable theme
- `tailwind.config.ts` with semantic color mapping
- All UI primitives: `Button`, `Input`, `Modal`, `Snackbar`, `Toggle`, `Badge`, `Card`, `Spinner`, `Rating`
- Landing sections as static components (content as props):
  - `HeroSection` — headline, subtitle, CTA button, background image
  - `AboutSection` — brand story, photo
  - `ProductsSection` — grid of paint lines (name, description, image)
  - `GallerySection` — masonry/grid of project photos from S3
  - `ReviewsSection` — placeholder (no reviews yet)
  - `BookingCtaSection` — persuasive text + CTA button
  - `ContactSection` — phone, email, address, contact form (no backend yet)
- `generateMetadata` with full OG, Twitter cards, canonical URL
- `LocalBusiness` + `Product` JSON-LD schema blocks
- `sitemap.ts` and `robots.ts`
- Amplify deploy + Route 53 + CloudFront + S3 setup
- `revalidate = 3600` (ISR ready for Phase 4)

**AWS required:** Amplify, CloudFront, S3, Route 53

**Done when:** The landing loads at `https://yourdomain.com`, scores 90+ on Lighthouse SEO, and passes Core Web Vitals.

---

### Phase 2 — Booking System (Deliverable ✓)

**Goal:** Clients can book a color advisory appointment. Admin can manage slots and view bookings. Emails are sent automatically.

**Includes:**
- Cognito user pool + `verifySession.ts`
- Admin login page (`/login`)
- Dashboard layout with auth guard
- DynamoDB tables: `paint-slots`
- `slotRepository.ts` + `bookingService.ts`
- API routes: `GET/POST /api/calendar/slots`, `PATCH/DELETE /api/calendar/slots/[id]`, `POST /api/calendar/slots/bulk`, `GET/POST /api/calendar/bookings`, `PATCH /api/calendar/bookings/[id]`
- Public booking page (`/agendar`) with slot picker and form
- Admin calendar page: slot creation (single + bulk), slot management
- Admin bookings page: table, status update, Snackbar feedback
- SES email templates: booking confirmation (client) + notification (admin)
- `emailService.ts` + SES wrapper

**AWS required:** + Cognito, DynamoDB, SES

**Done when:** A visitor can book a slot, both parties receive email, and admin can update booking status.

---

### Phase 3 — CRM & Reviews (Deliverable ✓)

**Goal:** Admin has a full contact history. Clients can submit reviews. Admin approves before they appear on landing.

**Includes:**
- DynamoDB tables: `paint-contacts`, `paint-reviews`
- `contactRepository.ts` + `reviewRepository.ts`
- `contactService.ts` + `reviewService.ts`
- Auto-upsert contact on booking (adds to Phase 2's `bookingService`)
- API routes: `GET/POST /api/contacts`, `GET/PATCH/DELETE /api/contacts/[email]`, `GET/POST /api/reviews`, `PATCH /api/reviews/[id]`
- Admin contacts list + contact detail page (booking history, notes, tags)
- Admin reviews moderation queue (approve/reject)
- `ReviewsSection` now renders approved reviews fetched from DynamoDB (ISR)
- `revalidatePath('/')` called on review approval to regenerate landing

**Done when:** Contact records are auto-created on booking, admin can add notes and tags, and approved reviews appear on the landing within seconds.

---

### Phase 4 — Landing Editor (Deliverable ✓)

**Goal:** Admin can toggle and edit every landing section without writing code.

**Includes:**
- DynamoDB table: `paint-landing-config` (seeded with 7 sections)
- `landingConfigRepository.ts` + `landingService.ts`
- API routes: `GET /api/landing`, `PUT /api/landing`
- `SectionEditor` admin component: toggle enable, edit text fields, update image (presigned S3 upload)
- S3 presigned upload: `GET /api/media/presign`, `GET /api/media/list`
- Landing `page.tsx` refactored to fetch config from DynamoDB at build/revalidate time
- `revalidatePath('/')` on every save in the editor
- Admin media library modal

**Done when:** Admin saves a section change and the landing reflects it within seconds.

---

## 9. Claude Code Instructions

> Paste this block at the start of every Claude Code session.

```
You are working on a Next.js 15 + AWS platform for a paint brand.
The full plan is in docs/DEVELOPMENT_PLAN.md. Read it before writing any code.

Current phase: [PHASE NUMBER AND NAME]
Current task: [SPECIFIC TASK]

Mandatory rules — no exceptions:
1. All code and comments in English.
2. Never use Tailwind color classes directly (no red-500, green-200, etc.).
   Always use semantic classes from the theme: bg-primary, text-danger, etc.
3. All colors are defined as CSS variables in src/app/globals.css.
   To change the theme, only edit the hex values in :root — never touch component files.
4. Every exported function, component, and type must have a JSDoc comment.
5. Architecture layers must be respected:
   - Repositories: DynamoDB/S3/SES calls only, no business logic.
   - Services: business logic and orchestration, imports repositories only.
   - API Routes: HTTP concerns only, imports services only.
   - Pages: composition only, no direct AWS SDK imports.
6. All UI components (Button, Modal, Snackbar, etc.) live in src/components/ui/.
   They must be stateless, accept className prop, and have no business logic.
7. All API responses must follow: { success: boolean; data?: T; error?: string }
8. Every protected API route must start with:
   const user = await verifySession(request);
   if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
9. Do not use Firebase, Cloudinary, or any auth library other than aws-jwt-verify + Cognito.
10. ISR: The landing page (app/(public)/page.tsx) must have export const revalidate = 3600.
    Call revalidatePath('/') from any service that modifies content shown on the landing.
```

---

*Last updated: Phase 1 kickoff*  
*Next review: after Phase 1 delivery*
