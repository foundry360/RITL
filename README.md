# Functional Coffee | RITL

Premium functional wellness landing page with Stripe Embedded Checkout.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- Stripe Payment Element (custom checkout form)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Configure Stripe in `.env.local`:
   - Get test keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Run `npm run stripe:setup` to create products/prices and write Price IDs to `.env.local`
   - Run `npm run stripe:verify` to confirm the connection

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── api/checkout/       # Stripe session creation
│   ├── checkout/           # Embedded checkout + success
│   ├── products/           # Product detail pages
│   ├── privacy-policy/
│   ├── return-policy/
│   ├── shipping-policy/
│   ├── faqs/
│   └── support/
├── components/
│   ├── layout/             # Header, Footer, PolicyLayout
│   ├── product/            # ProductCard, CheckoutButton, PaymentForm
│   ├── sections/           # Landing page sections
│   └── ui/                 # Button, Accordion, FadeIn primitives
└── lib/
    └── stripe/             # Server/client Stripe utilities + product data
```

## Stripe Setup

1. Copy `.env.example` to `.env.local` and add your Stripe test keys
2. Run `npm run stripe:setup` to create catalog products and recurring prices in Stripe
3. Run `npm run stripe:verify` to validate keys and price IDs
4. Start the app and visit `/api/stripe/status` to confirm live pricing is loaded
5. Use test card `4242 4242 4242 4242` for checkout

Displayed prices are loaded from Stripe when price IDs are configured. Prices refresh every 60 seconds, on tab focus, and immediately when Stripe sends price webhooks to `/api/stripe/webhook`.

## Design System

Monochrome editorial luxury: near-black backgrounds, steel silver accents, typography-driven hierarchy. No earthy tones or bright colors.
