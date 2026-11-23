# Kamba Website

Kamba is a Nigerian hyperlocal marketplace connecting buyers with local products, stores, services and vendors. This repository contains the Next.js web experience; it integrates with the existing Kamba backend and does not introduce a second backend or database.

## Stack

- Next.js App Router, React and TypeScript
- Tailwind CSS 4
- Space Grotesk (display) and Plus Jakarta Sans (interface)
- Existing Kamba REST API under `/api/v1`
- A development-only mock adapter for frontend work when the backend is unavailable

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm ci
```

Create `.env.local` in the repository root:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:9001
NEXT_PUBLIC_KAMBA_MOCK_MODE=true
```

Start the website:

```bash
npm run dev
```

Open http://localhost:3000.

The mock adapter is enabled only when both `NODE_ENV=development` and `NEXT_PUBLIC_KAMBA_MOCK_MODE=true`. It is forcibly inactive in production builds. Mock data and simulated actions are for interface testing only.

### Prototype accounts

- Vendor: `vendor@kamba.demo` with any non-empty password.
- Buyer: any email address with any non-empty password.
- Registration accepts a development-only buyer account.
- The phone OTP prototype accepts `000000`; it does not send an SMS or verify an identity.

These sessions are stored locally in the browser and are not real accounts. Clear the browser's local storage to reset the demo session, cart, prototype orders and pickup records.

## Connect to the real backend

Set the API origin to the running backend and disable mock mode:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:9001
NEXT_PUBLIC_KAMBA_MOCK_MODE=false
```

The API client appends `/api/v1` to application paths such as `/commerce/products`. Paths beginning with `/api/` are sent directly to the API origin. Authentication requests use credentialed cookies; the backend and web origin must therefore have compatible CORS and cookie settings.

For testing on a physical Android device, use the development computer's LAN IP instead of `localhost` for the API origin, and ensure both devices are on the same network.

## Core routes

| Area | Routes |
| --- | --- |
| Discovery | `/`, `/marketplace`, `/marketplace/products`, `/marketplace/services`, `/marketplace/stores`, `/marketplace/category/[slug]`, `/search` |
| Product/store/service details | `/marketplace/products/[id]`, `/marketplace/stores/[slug]`, `/marketplace/services/[slug]` |
| Buyer | `/cart`, `/checkout`, `/checkout/payment`, `/orders`, `/orders/[id]`, `/orders/[id]/track`, `/orders/[id]/pickup`, `/service-requests`, `/account` |
| Authentication | `/auth/login`, `/auth/register`, `/auth/forgot-password`, OTP and profile steps |
| Vendor | `/vendor/onboard`, `/vendor/dashboard`, `/vendor/products`, `/vendor/products/new`, `/vendor/products/[id]`, `/vendor/orders`, `/vendor/service-requests`, `/vendor/pickup`, `/vendor/payments`, `/vendor/profile` |

## Development prototype boundaries

The mock adapter lives in `src/lib/mock-api.ts`; API selection is centralised in `src/lib/api.ts`. UI components should call the shared API/auth services rather than embedding mock responses.

- Product, store and service discovery uses Nigerian sample listings. Product filters support keyword, category, price, stock, city in mock mode and coordinate-based nearby filtering. Nearest product sorting is available after location permission is granted.
- Cart, checkout and order records persist in local browser storage for prototype navigation.
- Checkout does not collect money. Payment remains pending; no Paystack charge, vendor transfer or payout is simulated.
- Vendor product create, edit and archive actions use the existing commerce API contract in live mode and the mock adapter in prototype mode.
- Pickup codes, QR passes, collection state and the 24-hour display are prototype-only local state. No real pickup verification or payout release occurs.
- Vendor pickup verification endpoints and a production pickup-token/QR contract are not currently exposed by the backend. The production screens intentionally show this limitation rather than reporting a false success.
- Delivery quotes require the backend's configured university/zone coverage. The mock prototype intentionally directs users to pickup when no delivery configuration is present.
- Vendor onboarding in prototype mode records a local demo submission only; it does not perform liveness or identity verification.

## Brand tokens

The website uses the mobile app token source at `MyVendor-Global-Ltd/kamba-frontend/src/theme/tokens.js`.

- Background: `#F6F5EF`; surface: `#FFFDF8`; text: `#1C2A21`
- Primary green: `#24543B`; strong green: `#173D2A`; soft green: `#E8F0E9`
- Gold: `#B68B3B`; soft gold: `#F3EBD9`
- Space Grotesk for display; Plus Jakarta Sans for interface text

Legacy CSS utility names are aliases to the approved green/warm-neutral tokens, not additional brand colours.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```

GitHub Actions runs the same lint audit, TypeScript check and production build for feature branches and pull requests. The lint step currently reports existing repository lint debt without blocking the type check or production build; that debt should be reduced before production handoff.

## Production handoff checklist

- Configure the production API origin and disable mock mode.
- Confirm backend CORS, cookie domain, secure-cookie and HTTPS settings for the deployed website domain.
- Configure production image hosts and storage URLs.
- Confirm payment provider credentials and webhook URLs in the backend; never put secret credentials in `NEXT_PUBLIC_*` variables.
- Implement and test backend pickup token issuance, QR verification, collection confirmation, dispute-window and payout-status contracts before enabling production pickup actions.
- Test buyer, vendor and admin permissions against real backend accounts.
- Run the production build and a complete browser/mobile smoke test against the production API before launch.
