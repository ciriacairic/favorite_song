# favorite song

**https://favorite-song-seven.vercel.app**

Descubra sua música favorita através de um torneio de brackets gerado a partir do seu histórico real de reprodução do Last.fm.

## Como funciona

1. Faça login com sua conta do Last.fm
2. Escolha o período e o tamanho do bracket (8, 16, 32 ou 64 músicas)
3. Vote em confrontos diretos entre as suas músicas mais ouvidas
4. No final, veja o bracket completo a partir das quartas de final e descubra qual música venceu

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4**
- **NextAuth v4** com provider customizado para Last.fm
- **Supabase** para persistência de jogos e histórico
- **Last.fm API** para buscar as músicas mais ouvidas
- **iTunes Search API** para capas de álbum
- **YouTube Data API v3** para embeds de vídeo

## Rodando localmente

```bash
npm install
npm run dev
```

Crie um arquivo `.env.local` com as seguintes variáveis:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

LASTFM_API_KEY=
LASTFM_API_SECRET=

YOUTUBE_API_KEY=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
