import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TermsandConditionsPage() {
  return (
    <div className="container mx-auto flex min-h-[65vh] max-w-3xl items-center justify-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Terms and Conditions</CardTitle>
          <CardDescription>Kamba's terms for using the marketplace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-text-secondary">
          <p>
            The approved Kamba terms and conditions document has not been published yet.
            This page is a temporary placeholder, not a statement of the final policy.
          </p>
          <p>
            The final document must be reviewed and added before public launch.
          </p>
          <Link href="/" className="inline-flex font-semibold text-primary transition-colors hover:text-primary-hover">
            Return to Kamba
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
