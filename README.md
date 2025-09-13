# 🎥 LiveChat

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Licence](https://img.shields.io/badge/licence-GPL--3.0-green.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg?logo=nodedotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6.svg?logo=typescript)

**Un overlay OBS qui permet à vos amis d'afficher des médias sur votre flux**

</div>

## 📝 À propos

LiveChat est un bot Discord et un overlay OBS Studio qui permet d'afficher une image, une vidéo ou jouer un son sur un flux en direct, par exemple, depuis une simple commande Discord.

Plusieurs streameurs peuvent utiliser le même serveur Discord, et les utilisateurs pourront choisir à quel streameur envoyer leur média.

Vous pouvez suivre les mises à jour du projet ici: https://livechat.nevylish.fr/updates.html

## 🚀 Utilisation

### Pour les streameurs

1. **Ajoutez le bot Discord** sur votre serveur privé via le lien ci-dessous :

    ```
    https://discord.com/oauth2/authorize?client_id=1379921658109890610
    ```

2. **Configurez OBS Studio** :

    - Ajoutez une nouvelle source de type "Navigateur"
    - Dans le champ URL, entrez :

    ```
    https://livechat.nevylish.fr/overlay.html?username=VOTRE_PSEUDO_TWITCH&guildId=ID_DE_VOTRE_SERVEUR
    ```

    - Remplacez `VOTRE_PSEUDO_TWITCH` par votre pseudo Twitch
    - Remplacez `ID_DE_VOTRE_SERVEUR` par l'ID de votre serveur Discord

3. **Utilisez le bot** :
    - Tapez `/livechat` dans votre serveur Discord
    - Sélectionnez votre pseudo dans la liste
    - Ajoutez l'URL du média que vous souhaitez afficher

### Pour les "viewers"

1. Rejoignez le serveur Discord du streameur
2. Utilisez la commande `/livechat` pour partager des médias
    - Sélectionnez le pseudo du streameur à qui vous voulez envoyer le média
    - Ajoutez l'URL du média
3. Vos médias s'afficheront instantanément dans le stream du streameur sélectionné

> ⚠️ **Attention** : Gardez à l'esprit que tous les membres présents sur le serveur pourront utiliser la commande /LiveChat et faire apparaître n'importe quoi sur votre flux, n'invitez pas n'importe qui.

### 📁 Formats de médias supportés

LiveChat ne supporte que les liens directs vers des fichiers médias. Voici comment partager vos médias :

1. Envoyez votre média dans un canal Discord (formats acceptés : .mp4, .webm, .mkv, .mov, .mp3, .wav, .ogg, .jpg, .png, .gif)
2. Faites un clic droit sur le fichier et sélectionnez "Copier le lien"
3. Utilisez ce lien dans la commande `/livechat`

> ⚠️ **Important** : Les liens YouTube, TikTok, ou autres plateformes de streaming ne sont pas supportés. Vous devez d'abord télécharger le média et l'envoyer sur Discord.

## 💻 Pour les développeurs

### Prérequis

- Node.js 18 ou supérieur
- npm ou pnpm
- Un serveur Discord
- OBS Studio

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
LIVECHAT_PORT=port_du_serveur_web
TOKEN=token_de_votre_bot_discord
```

4. **Lancer l'application**

```bash
npm run dev
#et
npm run start
```

### Architecture du projet

```
LiveChat/
├── src/
│   ├── core/                 # Cœur de l'application
│   │   ├── commands/         # Commandes Discord
│   │   ├── modules/          # Modules utilitaires
│   │   ├── DiscordClient.ts  # Classe du bot Discord
│   │   └── LiveChatServer.ts # Classe du serveur web et socket
│   ├── public/               # Fichiers statiques
│   └── index.ts              # Point d'entrée
├── dist/                   # Fichiers compilés
├── .env                    # Variables d'environnement
├── .prettierrc             # Configuration du formatage
├── docker-compose.yml      # Configuration Docker
├── Dockerfile              # Configuration de l'image Docker
├── package.json            # Dépendances et scripts
└── tsconfig.json           # Configuration TypeScript
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

## 🤝 Contribution

Ce projet est ouvert aux contributions !

## 📄 Licence

Ce projet est sous licence GPL-3.0. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Contact

- **Email** : bonjour@nevylish.fr

---

<div align="center">
  <sub>Construit avec ❤️ par <a href="https://github.com/nevylish">Nevylish</a></sub>
</div>
