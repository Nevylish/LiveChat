# LiveChat

LiveChat est un bot Discord et un overlay pour logiciels et applications de streaming qui permet d'afficher une image, une vidéo ou jouer un son sur un stream en direct depuis une simple commande Discord.

## 🎬 Démonstration

https://github.com/user-attachments/assets/9ce415c4-f99e-4041-8c8e-b504fc0dd6fa

## 🚀 Configuration et utilisation

Pour commencer à utiliser LiveChat, rendez-vous sur https://livechat.nevylish.fr/ puis cliquez sur "Configurez votre overlay".

Suivez les étapes et à la fin LiveChat sera prêt et vous saurez comment l'utiliser.

Un tutoriel vidéo sera disponible prochainement.

### Fonctionnalités

- Streamez à plusieurs: Configurez LiveChat sur le même serveur Discord et partagez des médias à plusieurs et à tous en même temps grâce à l'option "📌 Envoyer à tous les streameurs connectés" lors du choix de la cible avec la commande /livechat.

- Partagez des Tiktoks, des Tweets: LiveChat prend en charge les URL Tiktok, Twitter, Tenor et Giphy, partagez des médias avec simplicité. Vous pouvez aussi partager des fichiers que vous avez téléchargé sur votre ordinateur.

- Fonctionne avec toutes les applis de streaming: Que vous utilisez OBS Studio, Streamlabs ou même PRISM Live pour vos lives IRL, LiveChat est compatible.

## 💻 Pour les développeurs

### Prérequis

- Node.js 18 ou supérieur
- npm ou pnpm
- Serveur Discord
- OBS Studio, Streamlabs ou un autre logiciel qui possède un navigateur

### Installation

1. **Cloner le repository**

```bash
git clone https://github.com/nevylish/LiveChat.git
cd LiveChat
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configurer l'environnement**
   Créez un fichier `.env` à la racine du projet :

```env
DOMAIN=localhost
LIVECHAT_PORT=3000
TOKEN=token_de_votre_bot_discord
TENOR_API_KEY=clé_api_tenor
GIPHY_API_KEY=clé_api_giphy
SKU_PLUS_ID=facultatif
SKU_PRO_ID=facultatif
```

4. **Lancer l'application**

```bash
npm run dev
#et
npm run start
```

### Scripts disponibles

| Commande         | Description                                                           |
| ---------------- | --------------------------------------------------------------------- |
| `npm run dev`    | Compile le TypeScript en mode watch (recompilation automatique)       |
| `npm run build`  | Compile le TypeScript pour la production                              |
| `npm run start`  | Lance l'application                                                   |
| `npm run clean`  | Nettoie le dossier de build (dist/) et recopie les fichiers statiques |
| `npm run format` | Formate le code avec Prettier                                         |

## 🐳 Docker

### Déploiement rapide

Le projet peut être déployé facilement avec Docker Compose.

```bash
# Cloner le repository
git clone https://github.com/nevylish/LiveChat.git
cd LiveChat

# Configurer les variables d'environnement
cp .env.example .env
# Éditez .env avec vos paramètres

# Lancer avec Docker Compose
docker-compose up -d
```

## ✨ Contributions

Ce projet est ouvert aux contributions.
Ouvrez une issue pour qu'on en discute !

---

<div align="center">

<sub>© Nevylish — LiveChat. Tous droits réservés.</sub>
<br />
<sub>Non affilié à Twitch, Cacabox ou toute autre marque, plateforme ou personne tierce.</sub>

</div>
