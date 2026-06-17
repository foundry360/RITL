# Functional Coffee | RITL

Premium functional wellness landing page with Stripe Embedded Checkout.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- Stripe Embedded Checkout

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Configure Stripe keys in `.env.local`:
   - Get test keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Optionally create products/prices and set `STRIPE_PRICE_FOCUS_COFFEE` and `STRIPE_PRICE_MATCHA`
   - Without price IDs, checkout uses dynamic `price_data` (works in test mode)

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
│   ├── product/            # ProductCard, CheckoutButton, EmbeddedCheckout
│   ├── sections/           # Landing page sections
│   └── ui/                 # Button, Accordion, FadeIn primitives
└── lib/
    └── stripe/             # Server/client Stripe utilities + product data
```

## Stripe Setup

1. Create two products in Stripe Dashboard (Focus Coffee $48, Matcha $52)
2. Copy Price IDs to `.env.local`
3. Enable Embedded Checkout in Stripe settings if required
4. Use test card `4242 4242 4242 4242` for testing

## Design System

Monochrome editorial luxury: near-black backgrounds, steel silver accents, typography-driven hierarchy. No earthy tones or bright colors.
