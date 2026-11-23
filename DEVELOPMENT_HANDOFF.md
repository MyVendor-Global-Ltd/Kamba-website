# Kamba Website — Development Handoff

Last updated: 2026-11-23

## Working branch

- Repository: `MyVendor-Global-Ltd/Kamba-website`
- Active branch: `feat/kamba-brand-prototype-pickup`
- Do not work directly on `main`.
- Do not merge this branch without the user's approval.
- At the last implementation checkpoint, this branch was 198 commits ahead of `main` and 0 commits behind.

## Last verified checkpoint

- Latest verified implementation commit: `547ff80c5c46318c05c423e638c2f8c9d1fbe927` (mock service-request idempotency)
- Latest deployment status check: Vercel reported `build-rate-limit` for both linked deployments; this is a deployment quota/limit result, not evidence that the new code built successfully. No GitHub Actions run was returned for this commit.
- Latest GitHub Actions verification: https://github.com/MyVendor-Global-Ltd/Kamba-website/actions/runs/45220223386 (commit `547ff80c5c46318c05c423e638c2f8c9d1fbe927`). Dependency installation passed, lint audit completed under the existing non-blocking policy, TypeScript passed, and the Next.js production build passed.
- Vercel status checks for both `kamba-website` and `kamba.store` passed on this implementation commit. This confirms preview deployment checks only; do not treat it as proof of the production custom domain or backend integration.
- `package.json` has no test script or configured test runner. Do not claim automated tests ran.

## Work completed in the latest continuation

- Extended the development mock service-booking adapter: vendors can submit/revise quotes in kobo, buyers can accept/decline a quote, and request status transitions now follow the backend's documented workflow. Changes persist in browser local storage. No real payment is simulated.
- Added buyer `/service-requests` and vendor `/vendor/service-requests` management pages for viewing requests, handling quotes, scheduling accepted work, and updating work progress/completion. Added role-aware header navigation to these pages.
- Compared the web request manager against the actual backend `serviceBookings.js` router, `serviceBooking.controller.js`, `serviceBooking.service.js`, `servicePayment.service.js`, `SERVICE_BOOKINGS_API.md`, `WORKFLOWS_AND_SECURITY.md`, and `serviceBookings.integration.test.js`.
- Fixed the backend list response mismatch: the API exposes flat `service_title` and `buyer_username` fields, not only nested service objects. The UI now displays the actual service title, requester username, service location and scheduled appointment.
- Added the missing vendor actions for accepting/declining direct booking requests and declining quoted requests, plus the buyer cancellation action supported by the backend state machine.
- Updated the prototype mock adapter to enforce buyer/vendor roles and buyer ownership, mirror backend transition rules, validate quote amount/scope, supersede a prior pending quote when a vendor revises it, and honor the `Idempotency-Key` header for duplicate buyer submissions.

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
2. **Service request management is contract-reviewed; browser end-to-end verification remains.** Buyer/vendor request pages now cover request listing, quote decisions/submission, direct booking acceptance/decline, scheduling, work progression and buyer cancellation. The list response shape and mock role/ownership behavior have been aligned with the backend. Backend `main` at `f245a2c` has a successful CI test run (`https://github.com/MyVendor-Global-Ltd/Kamba/actions/runs/44959574608`), including the service-booking integration suite. This is backend test evidence, not a live two-account browser test. Service payment initiation, payment status, buyer completion confirmation and disputes are not integrated in the website. Backend documentation says no production payment provider is live until an approved adapter with verified hold/delayed-settlement capabilities is configured. Do not enable or simulate service payments in mock mode.
3. **Vendor analytics are not fully backed by live API data.** The live dashboard uses real vendor orders/products and labels unavailable analytics; the legacy development dashboard has clearly labelled demo figures.
4. **Lint debt remains.** Latest observed repository lint output had about 55 errors and 80 warnings, including `no-explicit-any`, unused imports/variables and hook rules. Fix regressions in touched files first, then work through remaining files without suppressing the rules globally.
5. **No automated test script exists.** Add a small test suite only after selecting a suitable runner and identifying stable service-layer seams. Until then, rely on CI type/build checks plus explicit browser smoke testing.

## Next recommended work

1. Continue API-contract review and repair remaining live response-shape mismatches, especially buyer/vendor order, store and product flows.
2. Run a two-account browser/API smoke test against the deployed backend (buyer creates booking, vendor sees only incoming requests and accepts/quotes, buyer responds, vendor schedules/updates work, buyer sees final status). Then implement buyer payment status, payment initiation, completion confirmation and dispute UI only when the configured provider adapter is confirmed ready; never fake payment success.
3. Complete a manual responsive browser smoke test for buyer discovery → product details → cart → checkout → pending payment → orders, and vendor login → products → orders → pickup desk.
4. Add backend pickup contracts before enabling production pickup actions.
5. Reduce ESLint errors and warnings, add automated tests, then run the full production checklist from README.
6. Keep committing and pushing small, reviewable changes to this branch. Never merge to `main` without explicit approval.
