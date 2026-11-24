import Link from 'next/link';

export const metadata = {
  title: 'Get the Kamba app',
  description: 'Find out how to get the Kamba mobile app.',
};

export default function DownloadPage() {
  return (
    <main className="container mx-auto flex min-h-[65vh] max-w-4xl items-center px-4 py-16">
      <section className="w-full space-y-6 rounded-2xl border border-border bg-surface p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Kamba mobile</p>
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-text-primary sm:text-5xl">
          Take your local marketplace with you.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-text-secondary">
          The Kamba mobile app is being prepared for release. We have not published a signed Android install package or official app-store listing yet, so there is no safe download link to provide today.
        </p>
        <div className="rounded-xl border border-border bg-background p-5">
          <p className="font-semibold text-text-primary">Android app — coming soon</p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            This page will host the official Google Play listing or a verified release download once the production build has been signed, tested and published.
          </p>
        </div>
        <Link
          href="/marketplace"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Continue on Kamba web
        </Link>
      </section>
    </main>
  );
}
