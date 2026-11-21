# Kamba Web

The Next.js web marketplace for Kamba.

## Stack
- Next.js App Router
- React
- TypeScript
- Responsive CSS aligned with the existing Kamba mobile design tokens (forest green, warm paper, restrained brass).

## Local development

1. Install Node.js 20 or later.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_API_URL` to the backend API origin.
4. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The API client appends `/api/v1` to the configured backend origin. The default is `https://api.kamba.ng`.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

## Current implementation

- Next.js App Router foundation.
- Public homepage with live backend shop, product and service catalogues.
- Product search/catalogue page.
- Shop directory and shop detail page.
- Product detail page.
- Service directory.
- Cookie-based email/password registration and login through a same-origin backend proxy.
- Username availability checks, referral code support, account dashboard and logout.
- Responsive layout and Kamba visual language.
- GitHub Actions validation workflow.

Authentication, cart and checkout, Paystack, buyer order management, vendor dashboards, provider dashboards and admin operations remain integration milestones. The backend is authoritative for prices, fees, stock, permissions and payment state.
