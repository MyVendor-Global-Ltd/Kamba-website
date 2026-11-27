import type { Metadata } from 'next'
import Link from 'next/link'

const pageUrl = 'https://www.kamba.ng/sell-online-in-nigeria'

const faqs = [
  {
    question: 'Do I need to build my own website before I can sell online?',
    answer: 'No. You can start with a public storefront on Kamba, add your products or services, and share the store or individual listing links. You can build a separate website later if your business needs one.',
  },
  {
    question: 'Can I continue using WhatsApp to talk to customers?',
    answer: 'Yes. A storefront does not replace your conversations on WhatsApp. It gives customers a place to browse your products, see prices and details, and return to the exact item they are interested in.',
  },
  {
    question: 'Can I list a service instead of a physical product?',
    answer: 'Yes. Kamba supports service profiles as well as product stores, so providers can describe what they do and receive booking or service requests.',
  },
  {
    question: 'Can customers find businesses near them?',
    answer: 'Kamba is designed around local discovery. Buyers can explore stores, products and services by category and location where listing information supports it. Search engines may also discover public listings as they crawl and index them.',
  },
  {
    question: 'Does listing on Kamba guarantee sales or delivery?',
    answer: 'No platform can guarantee sales. Delivery and pickup options depend on the seller, the buyer’s area and the options available for that order. Keep your prices, descriptions and availability accurate.',
  },
]

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'How to sell online in Nigeria when your customers know you on WhatsApp',
      description: 'A practical guide for Nigerian small businesses that want a shareable online storefront without abandoning WhatsApp.',
      mainEntityOfPage: pageUrl,
      author: { '@type': 'Organization', name: 'Kamba', url: 'https://www.kamba.ng' },
      publisher: { '@type': 'Organization', name: 'Kamba', url: 'https://www.kamba.ng' },
      inLanguage: 'en-NG',
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ],
}

export const metadata: Metadata = {
  title: 'How to Sell Online in Nigeria Without Leaving WhatsApp',
  description: 'Already selling on WhatsApp? Learn how to give your Nigerian business a shareable online storefront, list products or services, show prices and reach nearby customers with Kamba.',
  keywords: [
    'how to sell online in Nigeria',
    'online store for WhatsApp sellers',
    'create an online store in Nigeria',
    'sell products online',
    'online marketplace Nigeria',
    'small business storefront',
    'list services online Nigeria',
  ],
  alternates: { canonical: pageUrl },
  openGraph: {
    type: 'article',
    title: 'How to Sell Online in Nigeria Without Leaving WhatsApp',
    description: 'A practical guide for Nigerian sellers who want a public online storefront while keeping WhatsApp.',
    url: pageUrl,
    siteName: 'Kamba',
    locale: 'en_NG',
  },
  twitter: {
    card: 'summary',
    title: 'How to Sell Online in Nigeria Without Leaving WhatsApp',
    description: 'Give your business a public storefront without abandoning WhatsApp.',
  },
}

export default function SellOnlineInNigeriaPage() {
  return (
    <main className="bg-background text-text-primary">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <article className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Kamba guide · For Nigerian business owners</p>
        <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
          Selling on WhatsApp already? Give your business a proper online storefront too.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-text-secondary">
          You do not have to stop using WhatsApp or build a website from scratch. Keep chatting with customers there, but give them one public link where they can browse what you sell, check prices, understand your services and find your business again.
        </p>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-text-secondary">
          This is useful whether you sell clothes, phones, food, beauty products, second-hand items, repair services, design work or another local service. Social media helps people notice you; a storefront helps them see exactly what is available.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/vendor/onboard" className="inline-flex h-12 items-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Create your Kamba store</Link>
          <Link href="/marketplace/stores" className="inline-flex h-12 items-center rounded-lg border border-border px-6 text-sm font-semibold hover:bg-muted">Explore local stores</Link>
        </div>

        <section className="mt-16 border-t border-border pt-10">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">Why WhatsApp alone can make selling harder</h2>
          <p className="mt-4 text-sm leading-7 text-text-secondary">
            WhatsApp is useful for conversations, enquiries and customer relationships. But when every item is buried in status updates or chat history, a new customer may struggle to compare options, find the right price or know what is still available. You may also end up answering the same questions repeatedly.
          </p>
          <p className="mt-4 text-sm leading-7 text-text-secondary">
            A public store page gives your catalogue a stable home. Customers can open a link, browse at their own pace and send you a more specific enquiry or order request.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">A practical way to move your business online</h2>
          <ol className="mt-6 space-y-7">
            <li>
              <h3 className="text-base font-semibold">1. Put your best-selling items or services in one place</h3>
              <p className="mt-2 text-sm leading-7 text-text-secondary">Start with the products customers ask about most. Use clear names, real photos, accurate prices, useful descriptions and honest availability. If you provide a service, explain what is included, where you work and how a customer can request a booking.</p>
            </li>
            <li>
              <h3 className="text-base font-semibold">2. Make it easy to trust what you are showing</h3>
              <p className="mt-2 text-sm leading-7 text-text-secondary">Keep your business name, store details, service area, prices and opening hours current. Use your own product photos where possible. Do not advertise stock, delivery times or guarantees you cannot fulfil.</p>
            </li>
            <li>
              <h3 className="text-base font-semibold">3. Share the exact link, not only a screenshot</h3>
              <p className="mt-2 text-sm leading-7 text-text-secondary">Share your storefront link in your WhatsApp profile, status, groups and social pages. When someone asks about one item, send that product link so they can see its details instead of scrolling through old messages.</p>
            </li>
            <li>
              <h3 className="text-base font-semibold">4. Keep WhatsApp as your conversation channel</h3>
              <p className="mt-2 text-sm leading-7 text-text-secondary">You can still answer questions, explain options and build relationships in chat. The store page handles the catalogue; your conversations handle the human part of selling.</p>
            </li>
            <li>
              <h3 className="text-base font-semibold">5. Think about customers close to your business</h3>
              <p className="mt-2 text-sm leading-7 text-text-secondary">If you serve a campus, neighbourhood or city, say so clearly. Nearby customers may prefer a convenient pickup or a local delivery option over waiting for a seller far away. State the areas you genuinely serve.</p>
            </li>
          </ol>
        </section>

        <section className="mt-14 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Where Kamba fits</p>
          <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">A storefront, local discovery and services in one place.</h2>
          <p className="mt-4 text-sm leading-7 text-text-secondary">
            Kamba is a Nigerian hyperlocal marketplace where independent sellers can create public stores, list products and let people discover what is available around them. Service providers can also create profiles so customers can explore what they offer and send service or booking requests.
          </p>
          <p className="mt-4 text-sm leading-7 text-text-secondary">
            The idea is simple: your business gets a linkable home beyond a social media feed, while buyers get a clearer way to discover local products, compare listed prices and find nearby sellers. Delivery and pickup depend on the seller and the area served.
          </p>
          <Link href="/vendor/onboard" className="mt-6 inline-flex items-center text-sm font-semibold text-primary hover:underline">Set up your store on Kamba →</Link>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">Common questions from Nigerian sellers</h2>
          <div className="mt-6 divide-y divide-border">
            {faqs.map((faq) => (
              <div key={faq.question} className="py-5">
                <h3 className="text-base font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-7 text-text-secondary">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-14 border-t border-border pt-8">
          <p className="text-sm text-text-secondary">Ready to give your catalogue a public home?</p>
          <Link href="/vendor/onboard" className="mt-3 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground">Start your Kamba store</Link>
        </div>
      </article>
    </main>
  )
}
