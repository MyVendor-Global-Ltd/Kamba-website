export default function MarketplacePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground">
          Browse local stores and services near you.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a href="/marketplace/stores" className="p-8 border rounded-xl hover:bg-accent transition-colors text-left">
          <h2 className="text-xl font-semibold mb-2">Stores</h2>
          <p className="text-muted-foreground">Shop products from local vendors</p>
        </a>
        <a href="/marketplace/services" className="p-8 border rounded-xl hover:bg-accent transition-colors text-left">
          <h2 className="text-xl font-semibold mb-2">Services</h2>
          <p className="text-muted-foreground">Book local services</p>
        </a>
      </div>
    </div>
  )
}
