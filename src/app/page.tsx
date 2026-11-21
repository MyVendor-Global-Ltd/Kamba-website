export default function Home() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <h1 className="text-3xl font-bold">Welcome to Kamba</h1>
        <p className="text-muted-foreground">
          Discover local stores and services near you. Buy products, book services, and pay securely with escrow protection.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/marketplace/stores" className="p-4 border rounded-lg hover:bg-accent transition-colors">
            <h3 className="font-semibold">Browse Stores</h3>
            <p className="text-sm text-muted-foreground">Find shops near you</p>
          </a>
          <a href="/marketplace/services" className="p-4 border rounded-lg hover:bg-accent transition-colors">
            <h3 className="font-semibold">Browse Services</h3>
            <p className="text-sm text-muted-foreground">Book local services</p>
          </a>
        </div>
      </div>
      <aside className="space-y-4">
        <div className="p-4 border rounded-lg bg-muted">
          <h3 className="font-semibold mb-2">Nearby Stores</h3>
          <p className="text-sm text-muted-foreground">Use location services to find stores near you.</p>
        </div>
      </aside>
    </div>
  )
}
