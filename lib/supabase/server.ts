import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

/**
 * Returns the authenticated user, memoized for the lifetime of a single
 * server request via React `cache()`. The layout and the page (and any other
 * server component) can all call this within one render, but the work is done
 * only once.
 *
 * Uses `getClaims()` rather than `getUser()`: because this project signs JWTs
 * with an asymmetric key (ES256), the access token is verified locally with the
 * cached JWKS via WebCrypto — no network round-trip to the Auth server per
 * navigation. The signature is still cryptographically verified, so `sub` is
 * trustworthy (unlike `getSession()`).
 *
 * Returns a small normalized object so callers keep using `user.id`.
 */
export const getCachedUser = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) return null
  return {
    id: claims.sub,
    email: claims.email ?? null,
    role: claims.role,
  }
})
