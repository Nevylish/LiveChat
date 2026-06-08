<p align="center">
  <img src="shared/assets/images/livechat_ul_transparent.png" alt="LiveChat" width="128" />
  <br />
  <a href="https://livechat.nevylish.fr">https://livechat.nevylish.fr</a>
</p>

**LiveChat**, inspiré par la Cacabox, est l'outil ultime pour rendre vos streams interactifs.

Il s'agit d'un **bot Discord couplé à un overlay de stream** qui permet à vos amis et vos modérateurs d'afficher des images, de lancer des vidéos ou de jouer des sons directement sur votre live, via une simple commande Discord (`/livechat`).

## 🎬 Démonstration

https://github.com/user-attachments/assets/9ce415c4-f99e-4041-8c8e-b504fc0dd6fa

## ✨ Fonctionnalités

- 🔗 **Partage facile** — Prend en charge nativement **Discord**, **TikTok**, **YouTube**, **Instagram Reels**, **Twitter/X**, **Tenor** et **Giphy**. Upload de fichiers également supporté.
- 👥 **Multi-streameurs** — Envoyez un média à tous les streameurs connectés du même serveur Discord en un clic.
- 📝 **Texte superposé** — Ajoutez du texte style mème (police Impact) par-dessus les médias envoyés.
- 🔒 **Proxy intégré** — Protège l'adresse IP des streameurs en servant les médias via le serveur.
- 🌐 **Universel** — Compatible avec OBS Studio, Streamlabs, PRISM Live et tout logiciel supportant les sources navigateur.

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

### Installation

```bash
git clone https://github.com/Nevylish/LiveChat.git
cd LiveChat
pnpm install
```

### Configuration

Créez un fichier `.env` à la racine (voir `.env.example`) :

```env
DOMAIN=localhost
LIVECHAT_PORT=3000
TOKEN=token_de_votre_bot_discord
TENOR_API_KEY=clé_api_tenor
GIPHY_API_KEY=clé_api_giphy
SKU_PLUS_ID=facultatif
```

### Lancement

```bash
# Build complet (serveur + site)
pnpm build

# Lancer le serveur
pnpm start
```

### Développement

```bash
# Compiler le serveur en mode watch
pnpm dev:server

# Lancer le site en mode dev (Vite)
pnpm dev:web
```

### Scripts

| Commande           | Description                                  |
| ------------------ | -------------------------------------------- |
| `pnpm build`       | Build le serveur et le site web              |
| `pnpm build:server`| Build le serveur uniquement                  |
| `pnpm build:web`   | Build le site web uniquement                 |
| `pnpm dev:server`  | Compile le serveur en mode watch             |
| `pnpm dev:web`     | Lance le site en mode dev (Vite HMR)         |
| `pnpm start`       | Lance le serveur de production               |
| `pnpm clean`       | Supprime les dossiers de build               |
| `pnpm format`      | Formate le code avec Prettier                |

### Docker

```bash
git clone https://github.com/Nevylish/LiveChat.git
cd LiveChat
cp .env.example .env
# Éditez .env avec vos paramètres
docker-compose up -d
```

## 📁 Structure

```
LiveChat/
├── packages/
│   ├── server/       # Bot Discord + serveur Express + Socket.IO
│   ├── web/          # Site web (React + Vite + Tailwind)
│   └── overlay/      # Overlay OBS (HTML/CSS/JS)
├── shared/assets/    # Assets partagés (images, fonts, icônes)
└── .env              # Variables d'environnement
```

## 🤝 Contributions

Ce projet est ouvert aux contributions. Ouvrez une issue pour en discuter.

## 📄 Licence

[GPL-3.0](LICENSE)

#

<div align="center">

<sub>© Nevylish — LiveChat. Tous droits réservés.</sub>
<br />
<sub>Non affilié à Twitch, Cacabox ou toute autre marque, plateforme ou personne tierce.</sub>

</div>
