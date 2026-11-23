This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

 
## Local development prototype

Create `.env.local` with `NEXT_PUBLIC_KAMBA_MOCK_MODE=true` and `NEXT_PUBLIC_API_URL=http://localhost:9001` for local UI development. The mock adapter is enabled only when Next.js runs in development mode; production builds ignore the flag and use the real API service.

The prototype includes sample Nigerian marketplace data, local cart/order state, and simulated login/registration. Use `vendor@kamba.demo` to enter the vendor demo role; any non-empty password is accepted in mock mode. A buyer demo can use any email and non-empty password. Mock authentication is not identity verification.

Checkout remains payment-pending. No Paystack charge, real transfer, vendor payout or phone OTP is performed. Pickup code transitions are local prototype state only. QR generation and production vendor pickup verification remain blocked on a dedicated backend contract.


## Brand token source

The website's light theme is aligned to the current mobile app token source at `MyVendor-Global-Ltd/kamba-frontend/src/theme/tokens.js`:
- Background `#F6F5EF`, surface `#FFFDF8`, text `#1C2A21`
- Primary accent `#24543B`, strong accent `#173D2A`, soft accent `#E8F0E9`
- Gold `#B68B3B`, gold soft `#F3EBD9`
- Space Grotesk for display and Plus Jakarta Sans for UI text

The web logo follows the mobile bag-mark + lowercase wordmark direction. Legacy CSS utility names are aliases to these approved tokens, not separate palettes.
