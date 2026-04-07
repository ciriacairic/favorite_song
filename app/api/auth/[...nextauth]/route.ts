import NextAuth from "next-auth"
import type { AuthOptions } from "next-auth"
import type { OAuthConfig } from "next-auth/providers/oauth"
import type { TokenSet } from "next-auth"
import { getLastfmSession, getUserInfo } from "@/lib/lastfm"

interface LastFmProfile {
  id: string
  name: string
  image: string | null
  sessionKey: string
}

const LASTFM_API_KEY = process.env.LASTFM_API_KEY!
const NEXTAUTH_URL = process.env.NEXTAUTH_URL!

const LastFmProvider: OAuthConfig<LastFmProfile> = {
  id: "lastfm",
  name: "Last.fm",
  type: "oauth",
  // Last.fm uses `api_key` + `cb` (not `client_id` + `redirect_uri`)
  authorization: {
    url: "https://www.last.fm/api/auth/",
    params: {
      api_key: LASTFM_API_KEY,
      cb: `${NEXTAUTH_URL}/api/auth/callback/lastfm`,
    },
  },
  // Last.fm returns ?token=xxx in the callback (not ?code=xxx)
  // The custom request function lets us extract it from CallbackParamsType
  token: {
    url: "https://ws.audioscrobbler.com/2.0",
    async request({ params }) {
      const token = params.token as string | undefined
      if (!token) throw new Error("No Last.fm token in callback")
      const session = await getLastfmSession(token)
      return {
        tokens: {
          access_token: session.key,
          // stash username in a non-standard field on the TokenSet
          lastfm_user: session.name,
        } as Record<string, unknown>,
      }
    },
  },
  userinfo: {
    url: "https://ws.audioscrobbler.com/2.0",
    async request({ tokens }) {
      const username = (tokens as Record<string, unknown>).lastfm_user as string
      const user = await getUserInfo(username)
      const avatar: string =
        (user.image as Array<{ "#text": string; size: string }>)?.find(
          (img) => img.size === "large"
        )?.["#text"] ?? ""
      return {
        id: username,
        name: user.realname || username,
        image: avatar || undefined,
        sessionKey: tokens.access_token as string,
      }
    },
  },
  profile(profile) {
    return {
      id: profile.id,
      name: profile.name,
      image: profile.image,
      sessionKey: profile.sessionKey,
    }
  },
  // Disable state + PKCE — Last.fm's flow doesn't support them
  checks: ["none"],
  clientId: LASTFM_API_KEY,
  clientSecret: process.env.LASTFM_API_SECRET!,
}

export const authOptions: AuthOptions = {
  providers: [LastFmProvider],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.lastfmSessionKey = (user as LastFmProfile).sessionKey
        token.lastfmUsername = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.lastfmSessionKey = token.lastfmSessionKey as string | undefined
      session.lastfmUsername = token.lastfmUsername as string | undefined
      return session
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
