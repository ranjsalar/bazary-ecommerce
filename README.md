# Bazary.iq — E-commerce for Iraq & Kurdistan Region

A full-stack e-commerce web app built with **Next.js (App Router) + TypeScript**, targeting
customers in Iraq and the KRG. Cash on delivery, per-city delivery fees in IQD, and a
complete admin dashboard.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Prisma 6 + PostgreSQL (local dev via Docker) |
| Auth | NextAuth.js v4 (credentials, JWT sessions, role-based) |
| Cart state | Zustand (persisted to localStorage) |
| Validation | Zod (shared client + server schemas) |

## Getting started

Requires [Docker](https://www.docker.com/) for the local PostgreSQL database.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    For local dev the defaults work as-is.
#    Generate a real NEXTAUTH_SECRET for anything public:
#    openssl rand -base64 32

# 3. Start PostgreSQL (Docker, defined in docker-compose.yml)
docker compose up -d

# 4. Apply migrations
npm run db:migrate      # = prisma migrate dev

# 5. Seed sample data (products, categories, delivery fees, users)
npm run db:seed         # = prisma db seed

# 6. Run
npm run dev             # http://localhost:3000
```

### Environment variables (`.env`)

| Variable | Purpose | Dev default |
|---|---|---|
| `DATABASE_URL` | Prisma connection string | `postgresql://postgres:devpassword@localhost:5433/bazary` |
| `NEXTAUTH_URL` | Base URL of the app | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | JWT signing secret | change in production |

The compose file publishes Postgres on host port **5433** (not the default 5432) to avoid
clashing with a natively installed PostgreSQL. Data persists in the `bazary_pgdata` Docker
volume; `docker compose down -v` wipes it.

### Health check

`GET /api/health` returns `{ "status": "ok", "database": "up" }` (HTTP 200) when the app
and its database connection are healthy, and HTTP 500 when the DB check fails — suitable
for container/orchestrator probes.

### Seeded logins

| Role | Email | Password |
|---|---|---|
| Admin | `admin@store.iq` | `admin1234` |
| Customer | `customer@example.com` | `customer1234` |

Seeded delivery fees: Sulaymaniyah 3,000 · Erbil 4,000 · Halabja 4,000 · Baghdad 5,000 ·
Duhok 5,000 · Kirkuk 5,000 · Basra 6,000 · Mosul 6,000 IQD.

## Features

### Storefront
- Homepage with hero banner, category grid, featured products, new arrivals
- Product listing with category / price / search filters, sorting, pagination
- Product detail with image gallery, variants (size/color), stock display
- Cart (add/remove/update, persists across sessions via localStorage)
- Checkout collecting full name, **WhatsApp number (+964 validated & normalized)**,
  governorate/city dropdown (26 Iraq + KRG cities), district, landmark, address & order notes
- **Delivery fee auto-calculated from the selected city** (server-side lookup).
  Cities without an active fee **cannot check out** — no silent 0-fee orders.
- Cash on delivery (payment fields structured so a gateway can be added later)
- Order confirmation page with full summary (items + delivery fee + total)
- Guest checkout supported; orders are linked to the account when signed in

### Auth
- Register (name, email, Iraqi phone, password) with zod validation
- Email verification via 6-digit code (mock delivery — logged to the server console;
  shown in the UI in dev mode)
- Login / logout, forgot-password + reset-link flow (mock delivery, same pattern)
- Protected routes via server-side session guards; `ADMIN` role gate on `/admin`

### Account area
- Order history with status badges and a per-order status tracker
- Profile editing (name, phone) and password change

### Admin dashboard (`/admin`)
- Overview: revenue / orders / pending / customers / products stat tiles,
  30-day revenue and orders charts, latest orders table
- **Products**: create/edit/delete, multi-image upload, stock, categories (inline create),
  featured & visibility toggles
- **Orders**: filter by status, detail view, status updates
  (pending → confirmed → shipped → delivered / cancelled), WhatsApp deep-link to customer
- **Delivery fees**: add/edit/delete per-city fees in IQD, active/inactive toggle,
  warning list of cities that still have no fee
- **Customers**: registered users with order counts and totals

## Money & i18n conventions

- All prices are **integer IQD** (no fractional dinars) — `Int` columns, formatted by
  `src/lib/format.ts`.
- UI ships in English but is **RTL-ready**: `<html dir>` is driven by `src/lib/i18n.ts`
  and all component spacing uses logical CSS properties (`ms-/me-/ps-/pe-/start-/end-`),
  so adding Kurdish Sorani / Arabic later only requires translations + a locale switch.

## Useful scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run start      # serve production build
npm run db:migrate # prisma migrate dev
npm run db:seed    # seed sample data
npm run db:studio  # browse the database in Prisma Studio
```

## Project structure (high level)

```
prisma/
  schema.prisma        # User, Product, Category, Order, OrderItem, DeliveryFee, …
  seed.ts              # sample data + demo logins
src/
  lib/                 # prisma client, auth options, zod schemas, constants (cities), IQD format, i18n
  store/cart.ts        # zustand cart (persisted)
  components/
    ui/                # Button, Input, Select, Textarea, Badge, Spinner
    storefront/        # Navbar, Footer, ProductCard, filters, gallery, add-to-cart
    account/           # profile forms, order status badge
    admin/             # nav, charts, product form, delivery fee manager, order status control
  app/
    (auth)/            # login, register, verify, forgot/reset password
    (store)/           # home, products, cart, checkout, confirmation, account
    admin/             # overview, products, orders, delivery-fees, customers
    api/               # auth, register/verify/reset, delivery-fee, orders, admin/*
```

## Notes / future work

- **Payments**: orders carry `paymentMethod` / `paymentStatus`; plug a gateway in by
  adding a provider step at checkout and updating those fields.
- **Mock messaging**: `src/lib/mock-mail.ts` is the single seam for email/SMS/WhatsApp —
  replace its two functions with a real provider.
- **Image uploads** go to `public/uploads/` (dev-friendly). For production, swap the
  storage inside `src/app/api/admin/upload/route.ts` for S3/R2 — the `{ url }` response
  contract stays the same.
