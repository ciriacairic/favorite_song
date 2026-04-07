import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Last.fm returns ?token=xxx in the OAuth callback, but openid-client (used
 * internally by next-auth) only keeps standard OAuth params like `code`.
 * This middleware renames `token` → `code` before next-auth processes the
 * callback, so our token.request handler can read it as params.code.
 */
export default function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  if (pathname === "/api/auth/callback/lastfm") {
    const lastfmToken = searchParams.get("token")
    if (lastfmToken) {
      const url = request.nextUrl.clone()
      url.searchParams.delete("token")
      url.searchParams.set("code", lastfmToken)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/auth/callback/lastfm",
}
