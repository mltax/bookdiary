import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href="/" className="font-bold text-lg">
            📚 책일기
          </Link>
          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" render={<Link href="/search" />}>
              검색
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/books" />}>
              내 책
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/family" />}>
              가족
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/profile" />}>
              프로필
            </Button>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {children}
      </main>
    </div>
  )
}
