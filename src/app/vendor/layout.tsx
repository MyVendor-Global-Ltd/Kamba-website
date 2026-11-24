import { AuthGuard } from '@/components/auth/auth-guard'

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}
