export function Footer() {
  return (
    <footer className="border-t mt-auto py-8">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Kamba Marketplace. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="/about" className="hover:text-foreground">About</a>
          <a href="/how-it-works" className="hover:text-foreground">How it works</a>
          <a href="/escrow-policy" className="hover:text-foreground">Escrow Policy</a>
          <a href="/faq" className="hover:text-foreground">FAQ</a>
          <a href="/terms" className="hover:text-foreground">Terms</a>
          <a href="/privacy" className="hover:text-foreground">Privacy</a>
        </div>
      </div>
    </footer>
  )
}