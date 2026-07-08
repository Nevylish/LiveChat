<p align="center">
  <img src="packages/web/public/assets/images/livechat_ul_transparent.png" alt="LiveChat" width="128" />
  <br />
  <a href="https://livechat.nevylish.fr">https://livechat.nevylish.fr</a>
</p>

**LiveChat**, inspiré par la Cacabox, est l'outil ultime pour rendre vos streams interactifs.

Il s'agit d'un **bot Discord couplé à un overlay de stream** qui permet à vos amis d'afficher des images, de lancer des vidéos ou de jouer des sons directement sur votre live, via une simple commande Discord (`/livechat`).

## 🎬 Démonstration

https://github.com/user-attachments/assets/9ce415c4-f99e-4041-8c8e-b504fc0dd6fa

## ✨ Fonctionnalités

- 🔗 **Partage facile** - Prend en charge nativement **Discord**, **TikTok**, **YouTube**, **Instagram Reels**, **Twitter/X**, **Tenor** et **Giphy**. Upload de fichiers également supporté.
- 👥 **Multi-streameurs** - Envoyez un média à tous les streameurs connectés du même serveur Discord en un clic.
- 📝 **Texte superposé** - Ajoutez du texte style mème (police Impact) par-dessus les médias envoyés.
- 🔒 **Proxy intégré** - Protège l'adresse IP des streameurs en servant les médias via un worker dédié.
- 🌐 **Universel** - Compatible avec OBS Studio, Streamlabs, PRISM Live et tout logiciel supportant les sources navigateur.

## 🚀 Utilisation

1. Rendez-vous sur **[livechat.nevylish.fr](https://livechat.nevylish.fr/)**
2. Suivez les étapes de configuration pour ajouter le bot, générer votre lien d'overlay et le configurer dans OBS.

---

## 💻 Self-hosting

### Prérequis

- [Node.js](https://nodejs.org/) ≥ 18
- [pnpm](https://pnpm.io/) ≥ 9
- Un [bot Discord](https://discord.com/developers/applications) avec son token
- Clés API [Tenor](https://developers.google.com/tenor) et [Giphy](https://developers.giphy.com/)
- Un projet [Supabase](https://supabase.com/) (base de données Postgres — schéma dans `supabase/schema.sql`)
- (Optionnel) Compte [Cloudflare](https://www.cloudflare.com/) pour le worker proxy

### Installation

```bash
git clone https://github.com/Nevylish/LiveChat.git
cd LiveChat
pnpm install
```

### Configuration

Créez un fichier `.env` à la racine en vous basant sur [`.env.example`](.env.example). Variables principales :

| Variable | Description |
| -------- | ----------- |
| `TOKEN` | Token du bot Discord |
| `LIVECHAT_PORT` | Port du serveur API + Socket.IO |
| `DOMAIN`, `FRONTEND_URI`, `OVERLAY_URI` | Domaines (prod ou localhost) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase Postgres (server uniquement) |
| `AUTH_JWT_SECRET` | JWT de session dashboard |
| `VITE_DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | OAuth Discord (server + web) |
| `PROXY_URL`, `PROXY_SECRET` | Worker proxy (relay média) |
| `TENOR_API_KEY`, `GIPHY_API_KEY` | APIs plateformes |
| `OVERLAY_SECRET` | Tokens overlay legacy (v1) |

### Lancement

```bash
# Build complet (types + serveur + web)
pnpm build

# Lancer le serveur
pnpm start
```

### Développement

```bash
# Tout en parallèle (server, web, overlay, proxy)
pnpm dev

# Ou package par package
pnpm dev:server    # API + bot Discord + Socket.IO
pnpm dev:web       # Site React (http://localhost:5173)
pnpm dev:overlay   # Overlay statique (http://localhost:4000)
pnpm dev:proxy     # Worker Cloudflare (wrangler dev)
```

> **Note dev** : le site et l'overlay pointent par défaut vers l'API sur `localhost:3000`. Adaptez `LIVECHAT_PORT` ou les constantes locales si besoin.

### Scripts

| Commande | Description |
| -------- | ----------- |
| `pnpm dev` | Lance server, web, overlay et proxy en parallèle |
| `pnpm build` | Build types, server, proxy (check TS) et web |
| `pnpm build:server` | Build le serveur uniquement |
| `pnpm build:web` | Build le site web uniquement |
| `pnpm dev:server` | Serveur en mode watch (`tsx`) |
| `pnpm dev:web` | Site en mode dev (Vite HMR) |
| `pnpm dev:overlay` | Overlay OBS en statique (port 4000) |
| `pnpm dev:proxy` | Worker proxy en local (wrangler) |
| `pnpm deploy:proxy` | Déploie le worker sur Cloudflare |
| `pnpm start` | Lance le serveur de production |
| `pnpm clean` | Supprime les dossiers de build |
| `pnpm format` | Formate le code avec Prettier |

### Docker

Le `docker-compose.yml` ne couvre que le **serveur** (`@livechat/server`). Le site, l'overlay et le proxy se déploient séparément (ex. Vercel + hôte statique + Cloudflare Workers).

```bash
git clone https://github.com/Nevylish/LiveChat.git
cd LiveChat
cp .env.example .env
# Éditez .env avec vos paramètres
docker compose up -d
```

## 📁 Structure

Monorepo **pnpm** — chaque package applicatif est hébergé à un endroit distinct en production.

```
LiveChat/
├── packages/
│   ├── types/        # @livechat/types — types partagés (API, DB, socket)
│   ├── server/       # @livechat/server — bot Discord + API REST + Socket.IO
│   ├── web/          # @livechat/web — site React (marketing + dashboard /config)
│   ├── overlay/      # @livechat/overlay — overlay OBS (v1 legacy + v2 actuel)
│   └── proxy/        # @livechat/proxy — worker Cloudflare (relay média)
├── shared/assets/    # Assets statiques partagés (fonts, splash screens)
├── .env              # Variables d'environnement (racine)
└── AGENTS.md         # Guide architecture pour contributeurs et assistants IA
```

Pour le détail des responsabilités, contrats Socket.IO/API et conventions de code, voir **[AGENTS.md](AGENTS.md)**.

## 🤝 Contributions

Ce projet est ouvert aux contributions. Ouvrez une issue pour en discuter.

Consultez [AGENTS.md](AGENTS.md) avant de modifier le code — il décrit l'architecture du monorepo et les conventions à respecter.

## 📄 Licence

[GPL-3.0](LICENSE)

#

<div align="center">

<sub>© Nevylish - LiveChat. Tous droits réservés.</sub>
<br />
<sub>Non affilié à Twitch, Cacabox ou toute autre marque, plateforme ou personne tierce.</sub>

</div>
