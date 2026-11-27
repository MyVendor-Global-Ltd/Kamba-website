import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalDocumentLayout } from '@/components/legal/legal-document-layout'
import { ArrowUpRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Help and Frequently Asked Questions',
  description: 'Answers about buying, selling, product orders, service requests, Kamba fees, pickup and local delivery in Nigeria.',
  alternates: { canonical: '/faq' },
}

const sections = [
  { id: 'getting-started', label: 'Getting started' },
  { id: 'buyers', label: 'Buying on Kamba' },
  { id: 'fees', label: 'Fees and payments' },
  { id: 'delivery', label: 'Delivery and pickup' },
  { id: 'services', label: 'Services and quotations' },
  { id: 'vendors', label: 'Selling on Kamba' },
  { id: 'trust', label: 'Trust and privacy' },
]
const questions = [
  { id: 'what-is-kamba', group: 'getting-started', q: 'What is Kamba?', a: 'Kamba helps people discover nearby stores, shop for products and find local service providers. It is designed around local communities, including university areas, so buyers can connect with businesses close to where they live, study or work.' },
  { id: 'where', group: 'getting-started', q: 'Where does Kamba operate?', a: 'Kamba is built for the Nigerian market and is expanding by local area. Product delivery depends on configured routes and zones. If a delivery route is not available at checkout, choose pickup where offered or contact the store to understand its own fulfilment options.' },
  { id: 'account', group: 'getting-started', q: 'Do I need an account to browse?', a: 'You can explore public stores, products and services without placing an order. You need to sign in for account actions such as checkout, service requests and vendor management.' },
  { id: 'same-day', group: 'buyers', q: 'Can Kamba deliver on the same day?', a: 'Kamba is designed to make nearby fulfilment faster, and a local order may be delivered the same day when the store, route and an approved provider are available. It is not a universal guarantee. Delivery hours, provider availability, route coverage and the time an order is paid all affect timing.' },
  { id: 'delivery-cost', group: 'fees', q: 'How much does delivery cost?', a: 'There is no single delivery price for every Nigerian location. Kamba-managed delivery is quoted from the configured pickup and destination zones. The delivery charge appears separately at checkout before you pay. If a route cannot be priced, delivery should be shown as unavailable rather than given an estimated or invented amount.' },
  { id: 'platform-fee', group: 'fees', q: 'What is Kamba’s current platform fee?', a: 'As at 27 November 2026, the active product-order platform fee is 5% of the product subtotal. It is added to the buyer’s total and shown separately at checkout. This is a Kamba platform fee, not VAT. The setting can be changed, so the fee shown in your checkout is the one that applies to a new transaction.' },
  { id: 'free', group: 'fees', q: 'Is Kamba free to use?', a: 'Browsing and creating a basic account are free. The current product-order platform fee and any available delivery charge are shown before payment. Vendors do not need to buy a paid subscription to create an account in the current flow; transaction-related fees may apply where disclosed.' },
  { id: 'who-delivers', group: 'delivery', q: 'Who delivers my order?', a: 'For Kamba-managed delivery, the dispatch system matches the paid order with an approved delivery provider who is available, covers the destination city and state, and has capacity. Delivery providers are independent participants on Kamba, not automatically employees of the store.' },
  { id: 'provider-contact', group: 'delivery', q: 'How are delivery providers contacted?', a: 'Kamba creates a time-limited assignment offer for one matching approved provider at a time. The provider can accept or decline; an offer expires after five minutes if it is not accepted, after which another eligible provider may be considered. Once a provider accepts, their name and contact number become available to the buyer in the authorised order view. Their number is not published on public listings.' },
  { id: 'delivery-hours', group: 'delivery', q: 'What time does Kamba-managed delivery operate?', a: 'The initial platform delivery window is 8:00 a.m. to 6:00 p.m. West Africa Time. A university-specific schedule can override the platform default. Orders that cannot be assigned before the applicable closing time may wait for the next eligible window.' },
  { id: 'pickup', group: 'delivery', q: 'How does pickup work?', a: 'Choose pickup at checkout when the store offers it. The vendor prepares the paid order and marks it ready. Kamba then reveals the private pickup address to the buyer and provides a one-time QR/code pass. The vendor scans the QR or enters the six-digit code to verify collection. The pass expires 24 hours after the order is marked ready and locks after five incorrect attempts.' },
  { id: 'address', group: 'delivery', q: 'Will everyone see a vendor’s home or pickup address?', a: 'No. Vendors can keep their exact business location private. For a ready pickup order, the buyer receives the pickup address in that order only. A home-based vendor can choose to show a separate street or landmark label instead of the full residential address.' },
  { id: 'product-vs-service', group: 'services', q: 'What is the difference between a product order and a service request?', a: 'A product order is for an item sold by a store. A service request is for work a provider may accept, schedule or quote. A service request can be a booking request or a quotation request. It is not the same as buying a stocked product, and accepting a quotation does not itself pay the provider.' },
  { id: 'quote', group: 'services', q: 'How do service quotations work?', a: 'Describe what you need and send a quotation request. The provider can reply with an amount and scope of work. Review the details before accepting or declining. If the provider accepts a booking request, you can agree a schedule through the request flow. Keep the agreed details in Kamba.' },
  { id: 'service-payment', group: 'services', q: 'Can I pay for a service through Kamba?', a: 'Only when a hosted payment option is presented for that service request. Accepting a quote does not start a payment. Service payment availability depends on the configured payment flow and provider; do not send money based only on a quote status.' },
  { id: 'vendor-type', group: 'vendors', q: 'Can I sell products and offer services from the same business?', a: 'Yes, a business can be set up for products, services or both. Kamba separates the workflows: Manage Store is for the storefront, products and product orders; Manage Services is for service listings, booking requests and quotations.' },
  { id: 'create-store', group: 'vendors', q: 'How do I list a product?', a: 'A product listing belongs to a product storefront. First make sure your vendor account includes a store, then open Manage Store and choose Products → Add a product. A service-only account should use Manage Services; it should not be sent through product listing screens that require a store.' },
  { id: 'edit-business', group: 'vendors', q: 'Where do I edit my business profile and location?', a: 'Open the Vendor workspace and choose Business profile. Business identity and location settings are managed centrally so you do not have to enter the same address separately for the store and service listing. Your location settings control what appears publicly.' },
  { id: 'reviews', group: 'trust', q: 'Can I rate or follow a service provider?', a: 'Verified ratings, reviews and provider-follow features are not yet connected across the current service directory. Kamba should only show a rating when it comes from real, eligible review data; an empty rating area does not mean a provider has a perfect score.' },
  { id: 'verified', group: 'trust', q: 'What does a verified badge mean?', a: 'A badge indicates the verification level recorded for that account or business. It does not guarantee service quality, product condition, availability or a particular transaction outcome. Read the listing and request details before proceeding.' },
  { id: 'privacy', group: 'trust', q: 'How does Kamba protect my information?', a: 'Kamba uses account, order, location and service-request information to operate the platform and complete the transaction you choose. Details are shared with the relevant vendor, assigned delivery provider or payment and infrastructure provider only as needed for that flow. Read the full Privacy Policy for the detail.' },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: questions.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
}

function FAQGroup({ id, title, intro }: { id: string; title: string; intro: string }) {
  const items = questions.filter(item => item.group === id)
  return <section id={id} className="scroll-mt-28 border-b border-border pb-9">
    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Kamba help / {String(sections.findIndex(item => item.id === id) + 1).padStart(2, '0')}</p>
    <h2>{title}</h2><p>{intro}</p>
    <div className="mt-5 divide-y divide-border border-y border-border">
      {items.map(item => <details key={item.id} className="group py-4">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left font-semibold text-text-primary marker:hidden [&::-webkit-details-marker]:hidden">{item.q}<span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border text-sm font-normal text-text-tertiary transition-transform group-open:rotate-45">+</span></summary>
        <p className="max-w-3xl pr-8 pt-3 text-sm leading-7 text-text-secondary">{item.a}</p>
      </details>)}
    </div>
  </section>
}

export default function FAQPage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }} />
    <LegalDocumentLayout eyebrow="Kamba / Help centre" title={<>Good questions.<br /><span className="text-primary">Straight answers.</span></>} lead="A practical guide to shopping locally, listing a business, requesting a service, paying the right fees and getting an order to your door or pickup point." updated="27 November 2026" sections={sections}>
      <FAQGroup id="getting-started" title="Start with Kamba." intro="The basics of the platform, where it operates and what you can do without an account." />
      <FAQGroup id="buyers" title="Buying nearby." intro="What to expect when you browse local stores and place a product order." />
      <FAQGroup id="fees" title="Know what you pay." intro="The current platform fee, delivery charges and how checkout shows the final amount." />
      <FAQGroup id="delivery" title="From checkout to handover." intro="How Kamba-managed delivery, provider assignment, pickup and private addresses work." />
      <FAQGroup id="services" title="Find a service. Agree the work." intro="How booking requests, quotations and service payments differ from product orders." />
      <FAQGroup id="vendors" title="Build your business on Kamba." intro="How store and service workspaces stay separate, and where business settings live." />
      <FAQGroup id="trust" title="Trust, ratings and privacy." intro="What verification means and how account and transaction information is handled." />
      <div className="rounded-2xl bg-secondary/40 p-6 sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Still need help?</p><h2 className="mt-2 font-display text-2xl font-bold text-text-primary">The answer should be easy to find.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">If your question is about a specific order or service request, open that record first so you can refer to its current status. You can also review the full <Link href="/terms" className="font-semibold text-primary underline underline-offset-4">Terms</Link> and <Link href="/privacy" className="font-semibold text-primary underline underline-offset-4">Privacy Policy</Link>.</p></div>
    </LegalDocumentLayout>
  </>
}
