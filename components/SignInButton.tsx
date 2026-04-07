"use client"

import { signIn } from "next-auth/react"

export default function SignInButton() {
  return (
    <button
      onClick={() => signIn("lastfm")}
      className="flex items-center gap-3 rounded-full bg-red-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
    >
      <LastFmIcon />
      Sign in with Last.fm
    </button>
  )
}

function LastFmIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M10.596 15.83l-.706-1.92s-1.146 1.281-2.865 1.281c-1.522 0-2.601-1.323-2.601-3.435 0-2.705 1.362-3.68 2.704-3.68 1.933 0 2.546 1.254 3.071 2.856l.704 2.207c.703 2.139 2.034 3.86 5.864 3.86 2.746 0 4.608-1.843 4.608-4.227 0-2.474-1.424-3.756-4.081-4.39l-1.238-.294c-1.366-.323-1.764-.918-1.764-1.9 0-1.1.836-1.754 2.2-1.754 1.498 0 2.289.558 2.408 2.01l2.446-.294c-.203-2.36-1.838-3.552-4.74-3.552-2.485 0-4.753 1.32-4.753 3.846 0 1.824.879 2.975 3.093 3.523l1.32.323c1.558.382 1.94 1.043 1.94 1.991 0 1.133-.896 1.794-2.113 1.794-1.994 0-2.832-1.082-3.224-2.286l-.734-2.256c-.983-3.018-2.55-4.149-5.581-4.149C2.282 5.584 0 8.043 0 11.829c0 3.638 2.046 5.85 5.103 5.85 2.64 0 3.99-1.406 4.198-1.64l1.295.001z" />
    </svg>
  )
}
