import { AuthGuard } from '@/components/auth/auth-guard'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}
