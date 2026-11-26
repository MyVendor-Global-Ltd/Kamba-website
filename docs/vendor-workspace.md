# Vendor workspace

## Primary navigation

The vendor workspace has two primary destinations:

- **Vendor dashboard** — operational overview, orders, products, analytics and quick actions.
- **Business settings** — vendor contact details, storefront/service editing, pickup information and payout account setup.

Orders and products remain reachable from dashboard actions; they are not duplicated as additional primary profile destinations.

## Onboarding sequence

1. Verify the buyer account's email and phone number.
2. Choose products, services or both.
3. Create the business identity and listing details.
4. Review the submission and provide any required location evidence.

For vendors offering both products and services, the storefront's business name, location, visibility preference and operating hours are reused by the service listing.

## Business location and privacy

The physical business location is captured once and is the saved business location for the planned pickup flow. Exact-address visibility defaults to private. A vendor may explicitly publish it; public store and service responses omit the exact address while it remains private.

The private/public setting controls public display only. The saved location remains available to the vendor record and future fulfilment integration. Buyer-facing pickup-address reveal is not live while pickup collection remains a prototype.

## URL slugs

Store and service slugs are derived from the business identity. The interface displays the generated slug as read-only, and the API independently derives it rather than trusting a client-supplied slug.

## Payout account

Payout account setup uses bank-account resolution and confirmation. The API verifies the account again before creating a payout beneficiary. If the provider is unavailable, the UI must not persist an unverified full account number.

## Pickup collection

The current Pickup desk is still a development prototype. Live QR/token issuance and collection confirmation require a separate backend contract and must not be presented as production-ready.
