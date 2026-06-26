# LiveChat — guide pour assistants IA

Document de contexte pour comprendre la structure, les responsabilités et les conventions du monorepo.

## Produit

LiveChat est un bot Discord + overlay HTML pour OBS. Un viewer envoie un média via `/livechat` sur Discord ; le serveur le route vers l’overlay du streameur via Socket.IO.

- Site : https://livechat.nevylish.fr/
- Licence : GPL-3.0-only
- Gestionnaire de paquets : **pnpm** (workspace)

## Architecture globale

```
Discord (/livechat) ──► @livechat/server ──► Socket.IO ──► overlay (v1 ou v2)
                              │
                              ├── REST API ◄── @livechat/web (dashboard /config)
                              ├── Supabase (configs overlay, réglages guild)
                              └── URLs proxy signées ──► @livechat/proxy (Cloudflare Worker)
```

Les **4 packages applicatifs sont hébergés séparément** en production (pas un seul déploiement monolithique).

## Structure du monorepo

```
LiveChat/
├── .env                    # Variables d’env (racine, chargées par server et web)
├── .env.example
├── package.json            # Scripts racine (dev, build)
├── pnpm-workspace.yaml
├── shared/assets/          # Assets statiques partagés (fonts, splash screens)
├── packages/
│   ├── types/              # @livechat/types — types partagés (API, DB, socket, média)
│   ├── server/             # @livechat/server — bot Discord + API REST + Socket.IO
│   ├── web/                # @livechat/web — site React (marketing + dashboard config)
│   ├── overlay/            # @livechat/overlay — overlay OBS (JS statique, v1 + v2)
│   └── proxy/              # @livechat/proxy — worker Cloudflare (relay média)
└── AGENTS.md               # Ce fichier
```

## Packages

### `@livechat/types` (`packages/types`)

Types et constantes partagés entre server, web et proxy.

| Fichier | Contenu |
|---------|---------|
| `src/database.ts` | `OverlayConfigRow`, `GuildSettingsRow` |
| `src/api.ts` | Réponses REST typées |
| `src/discord.ts` | `DiscordGuild`, `DiscordRole` |
| `src/socket.ts` | `BroadcastPayload`, `RegisterPayloadV1/V2` |
| `src/media.ts` | Extensions média + `getMediaKindFromUrl()` |

**Important** : le package exporte en CJS (`require` + `import`). Ne pas retirer `"require"` des `exports` dans `package.json`.

Build requis avant server/web : `pnpm --filter @livechat/types build` (inclus dans `pnpm build`).

### `@livechat/server` (`packages/server`)

**Stack** : TypeScript strict, discord.js, Express, Socket.IO, Supabase.

**Point d’entrée** : `src/index.ts` → `DiscordClient` → `LiveChatServer`.

**Organisation** (`src/core/`) :

| Dossier / fichier | Rôle |
|-------------------|------|
| `LiveChatServer.ts` | Orchestrateur (HTTP + Socket.IO) |
| `routes/apiRoutes.ts` | Routes REST `/api/*` |
| `socket/overlaySocket.ts` | Connexion overlay, événements socket |
| `services/StreamerRegistry.ts` | Streameurs connectés en mémoire |
| `services/OverlayTokenService.ts` | Validation token overlay (Supabase + legacy HMAC) |
| `services/overlayNames.ts` | Unicité des noms d’overlay par guild |
| `middlewares/auth.ts` | Auth Supabase JWT, admin, accès guild |
| `interactions/` | Commandes slash Discord |
| `interactions/livechat_subcommands/` | Media, Skip, Stop |
| `modules/` | Résolution URL (Giphy, Tenor, TikTok, Twitter, etc.) |
| `utils/` | Logger, Supabase, Proxy, Targets, Functions, etc. |

**Hébergement** : serveur Node (Docker en self-host).

### `@livechat/web` (`packages/web`)

**Stack** : React 19, Vite, Tailwind v4, React Router, Supabase auth (Discord OAuth).

**Point d’entrée** : `src/main.tsx` → `App.tsx` (routes lazy-loaded, `Suspense fallback={null}`).

| Dossier | Rôle |
|---------|------|
| `src/pages/` | Pages route (`Home`, `Config`, `Usage`, …) |
| `src/pages/Config.tsx` | Dashboard principal (overlays, réglages guild) |
| `src/components/config/` | Sous-vues du dashboard |
| `src/api/configApi.ts` | Appels REST typés vers le server |
| `src/hooks/` | `useAuth`, `useGuildList` |
| `src/lib/` | `constants.ts` (URLs), `discord.ts`, `errors.ts` |

**Hébergement** : Vercel. `index.html` définit `body { background-color: #0f0e17 }` pour le flash de chargement des routes lazy.

**Note** : les notifications overlay (sons) ont été retirées côté UI ; la DB n’a pas été modifiée. Réintroduire plus tard sans migration obligatoire.

### `@livechat/overlay` (`packages/overlay`)

**Stack** : JavaScript pur (pas de build), servi en statique.

| Chemin | Rôle |
|--------|------|
| `overlay.html` + `overlay.js` | **v1 legacy** — auth `?username=&guildId=&token?` — ne pas fusionner |
| `v2/overlay.html` + `v2/overlay.js` | **v2 actuel** — auth `?token=` — nouvelles features ici |
| `shared/overlay.css` | CSS partagé entre v1 et v2 |

**Hébergement** : hôte overlay séparé (ex. `livechat-overlay.nevylish.fr`). Dev local : port `4000`.

### `@livechat/proxy` (`packages/proxy`)

**Stack** : Cloudflare Worker (Hono), TypeScript strict.

**Point d’entrée** : `src/index.ts` — valide signature HMAC, fetch et stream le média upstream.

**Hébergement** : Cloudflare Workers (`pnpm deploy:proxy`). Dev local : `wrangler dev` (port `8787`).

## Contrats importants

### Socket.IO (server ↔ overlay)

| Événement | Direction | Description |
|-----------|-----------|-------------|
| `register` | overlay → server | Connexion (v2 : `{ token }`, v1 : `{ username, guildId, token? }`) |
| `updateConnectionStatus` | server → overlay | Succès / erreur connexion |
| `broadcast` | server → overlay | Afficher un média (`BroadcastPayload`) |
| `skip` / `clear` | server → overlay | Passer / vider la file |
| `skipById` | server → overlay | Skip via bouton Discord |
| `started` / `ended` | overlay → server | Cycle de vie d’un média |

Types dans `@livechat/types` → `src/socket.ts`.

### REST API principale (server)

Préfixe `/api/`. Auth : `Authorization: Bearer <supabase_jwt>`.

| Route | Usage |
|-------|-------|
| `GET /api/stats` | Stats publiques (home) |
| `GET/POST /api/config/*` | CRUD overlays (dashboard) |
| `GET /api/guild/check` | Présence bot + count overlays |
| `GET/POST /api/guild/settings*` | Réglages admin guild |
| `GET /api/guild/roles` | Rôles Discord (admin) |

Client typé côté web : `packages/web/src/api/configApi.ts`.

### Supabase

Tables principales (via `SupabaseService`) :

- `overlay_configs` → `OverlayConfigRow`
- `guild_settings` → `GuildSettingsRow`

## Commandes utiles

```bash
pnpm install
pnpm dev              # server + web + overlay + proxy en parallèle
pnpm build            # types → server → proxy (tsc) → web
pnpm dev:server       # tsx watch, port depuis LIVECHAT_PORT (.env)
pnpm dev:web          # Vite, http://localhost:5173
pnpm dev:overlay      # serve statique, http://localhost:4000
pnpm dev:proxy        # wrangler dev, http://localhost:8787
pnpm format           # Prettier
```

## Variables d’environnement

Fichier racine `.env` (voir `.env.example`). Clés critiques :

| Variable | Package(s) |
|----------|------------|
| `TOKEN` | server (bot Discord) |
| `LIVECHAT_PORT` | server |
| `VITE_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` | web + server |
| `PROXY_URL`, `PROXY_SECRET` | server + proxy |
| `GIPHY_API_KEY`, `TENOR_API_KEY` | server |
| `OVERLAY_SECRET` | server (tokens legacy v1) |

**Attention dev** : web/overlay pointent souvent vers `localhost:3000` (API) en dur dans `constants.ts` / `overlay.js`, alors que `.env.example` utilise `LIVECHAT_PORT=5000`.

## Conventions de code (post-refactor)

1. **Types partagés** : ajouter dans `@livechat/types`, pas de duplication inline web/server.
2. **Server** : logique métier dans `services/`, routes dans `routes/`, socket dans `socket/`.
3. **Web** : appels API dans `src/api/`, hooks dans `src/hooks/`, URLs dans `src/lib/constants.ts`.
4. **Overlay v1 / v2** : codebases JS **séparées** — ne pas fusionner ; CSS seul est partagé (`shared/overlay.css`).
5. **Pas de `any`** côté web (`strict: true`). Server : `any` résiduel seulement dans infra (Logger, CacheManager).
6. **Changements** : privilégier refactors structurels sans changement de comportement fonctionnel sauf demande explicite.
7. **Commits** : ne créer un commit que si l’utilisateur le demande.

## Fichiers à lire en premier selon la tâche

| Tâche | Fichiers |
|-------|----------|
| Commande Discord / média | `interactions/livechat_subcommands/Media.ts`, `modules/_Router.ts` |
| Connexion overlay | `socket/overlaySocket.ts`, `overlay/v2/overlay.js` |
| Dashboard config | `web/src/pages/Config.tsx`, `web/src/api/configApi.ts` |
| Auth API | `middlewares/auth.ts`, `utils/SupabaseService.ts` |
| Proxy média | `server/utils/ProxyService.ts`, `proxy/src/index.ts` |
| Types / contrats | `packages/types/src/` |

## Ressources externes

- `packages/web/public/llms.txt` — description produit orientée grand public / SEO LLM
- README du repo — self-hosting, installation
