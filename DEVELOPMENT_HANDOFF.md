# Kamba Website — Development Handoff

Last updated: 2026-11-23

## Working branch

- Repository: `MyVendor-Global-Ltd/Kamba-website`
- Active branch: `feat/kamba-brand-prototype-pickup`
- Do not work directly on `main`.
- Do not merge this branch without the user's approval.
- At the last check, this branch was 183 commits ahead of `main` and 0 commits behind.

## Last verified checkpoint

- Commit: `5f0d6f5e7a38feb20655743e578b8c3873a24047`
- GitHub Actions run: https://github.com/MyVendor-Global-Ltd/Kamba-website/actions/runs/45177152750
- Dependency installation: passed
- TypeScript: passed
- Next.js production build: passed
- Lint audit: non-blocking in CI because the existing repository currently reports approximately 55 ESLint errors and 80 warnings. Do not describe lint as clean. The CI workflow intentionally lets type checking and build continue while this existing lint debt is addressed.
- `package.json` has no test script or configured test runner. Do not claim automated tests ran.

## Work completed in the latest continuation

- Product filters: exposed backend-supported Popular and Nearest sorting; nearest is shown only after browser location is available; mock nearest sorting uses vendor coordinates.
- Service filters: category options now include categories found in loaded services; mock nearby services sort by distance before pagination.
- Product filter UX: removed the duplicate search field from the product filter sidebar, counted active sort state and added pressed state to the All category filter.
- Category detail route: replaced an unsupported `/categories/:slug` call with existing `/marketplace/categories`, `/commerce/products`, `/vendors/stores` and `/vendors/services` contracts. Added working mock store category/pagination filtering, price/stock controls, pagination reset and kobo-aware price formatting.
- Homepage: now reads the backend's actual `{ products }` response and uses the `images` array when `image_url` is absent.
- Buyer order list: corrected the pending-payment filter to match backend `pending_payment`, removed a duplicate option and translated payment states to customer-facing labels.
- Vendor order list/dashboard: normalizes backend `total` versus prototype `total_amount`; fixed vendor dashboard navigation targets.
- Pickup prototype: buyer progress refreshes when the vendor updates local prototype state in another tab; vendor verification UI no longer reveals the buyer's pickup code.
- Setup docs: README documents local setup, mock-mode boundaries, route map and production handoff; `.env.example` documents `NEXT_PUBLIC_KAMBA_MOCK_MODE`.

## Prototype configuration

Local frontend-only development:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:9001
NEXT_PUBLIC_KAMBA_MOCK_MODE=true
```

Mock mode only activates when `NODE_ENV=development` and the flag is exactly `true`. It is forcibly disabled in production. Prototype login: `vendor@kamba.demo` with any non-empty password; any other non-empty email/password combination creates a buyer demo session.

## Known gaps — do not hide these

1. **Pickup is prototype-only.** The web screens and mock adapter exist, but the backend does not currently expose pickup token issuance, QR verification, vendor collection confirmation, pickup event history or payout/dispute-window status endpoints. Local storage is not production verification. Do not report a pickup as collected unless a real backend response confirms it.
2. **Service request management is incomplete in the website.** The service detail page can create a booking request through the existing `/service-bookings/requests` backend contract, but there are no buyer/vendor service-request management pages for quote submission, quote acceptance/decline, scheduling, progress, completion and payment. The backend routes already exist; inspect their service contracts before implementing them. Do not invent new endpoints.
3. **Vendor analytics are not fully backed by live API data.** The live dashboard uses real vendor orders/products and labels unavailable analytics; the legacy development dashboard has clearly labelled demo figures.
4. **Lint debt remains.** Latest observed repository lint output had about 55 errors and 80 warnings, including `no-explicit-any`, unused imports/variables and hook rules. Fix regressions in touched files first, then work through remaining files without suppressing the rules globally.
5. **No automated test script exists.** Add a small test suite only after selecting a suitable runner and identifying stable service-layer seams. Until then, rely on CI type/build checks plus explicit browser smoke testing.

## Next recommended work

1. Continue API-contract review and repair remaining live response-shape mismatches, especially buyer/vendor order, store and product flows.
2. Complete service request management against the existing service-booking routes, including buyer quote decisions and vendor quote/status actions.
3. Complete a manual responsive browser smoke test for buyer discovery → product details → cart → checkout → pending payment → orders, and vendor login → products → orders → pickup desk.
4. Add backend pickup contracts before enabling production pickup actions.
5. Reduce ESLint errors and warnings, add automated tests, then run the full production checklist from README.
6. Keep committing and pushing small, reviewable changes to this branch. Never merge to `main` without explicit approval.
