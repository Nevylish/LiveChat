## 📝 À propos

LiveChat est un bot Discord et un overlay OBS Studio/Streamlabs inspiré par la Cacabox qui permet d'afficher une image, une vidéo ou jouer un son sur un flux en direct depuis une simple commande Discord.

Plusieurs streameurs peuvent utiliser le même serveur Discord et les utilisateurs pourront choisir à quel streameur envoyer leur média.

[Tutoriel vidéo: https://www.youtube.com/watch?v=C5Snzonuxx4](https://www.youtube.com/watch?v=C5Snzonuxx4)

Vous pouvez suivre les mises à jour du projet ici: [https://livechat.nevylish.fr/updates](https://livechat.nevylish.fr/updates.html)

## 🎬 Démonstration

https://github.com/user-attachments/assets/9ce415c4-f99e-4041-8c8e-b504fc0dd6fa

## 🚀 Utilisation

### Pour les streameurs

1. **Ajoutez le bot & Récupérez le lien de votre Overlay**

    - Allez sur [https://livechat.nevylish.fr](https://livechat.nevylish.fr) pour les deux.

2. **Configurez OBS Studio/Streamlabs** :

    - Ajoutez une nouvelle source de type "Navigateur"
    - Dans le champ URL, votre lien d'Overlay
    - Dans le champ largeur entrez `1920` et hauteur `1080`
    - Cochez `Contrôler l'audio via OBS`, **cliquez sur Ok**, puis faites un clic droit sur le mélangeur audio, allez dans les paramètres audio avancées, trouvez la source de LiveChat et dans Monitoring Audio sélectionnez `Monitoring et sortie`. Cela vous permettra de contrôler le volume que LiveChat aura pour vous et vos spectateurs
    - Vous pouvez maintenant dupliquer la source LiveChat sur toutes les scènes que vous voulez (en utilisant bien CTRL+C , CTRL+V)

3. **Utilisez le bot** :
    - Tapez `/livechat` dans votre serveur Discord
    - Sélectionnez votre pseudo dans la liste
    - Ajoutez l'URL du média que vous souhaitez afficher

### Pour les "viewers"

1. Rejoignez le serveur Discord du streameur
2. Utilisez la commande `/livechat` pour partager des médias
    - Sélectionnez le pseudo du streameur à qui vous voulez envoyer le média
    - Ajoutez l'URL du média
    - Des options de commandes facultatives sont disponibles, `fullscreen` affiche le média en plein écran sur le stream, `texte` permet d'ajouter du texte par dessus en bas du média avec la police d'écriture Impact (style Meme)
3. Vos médias s'afficheront instantanément dans le stream du streameur sélectionné

> ⚠️ **Attention** : Gardez à l'esprit que tous les membres présents sur le serveur pourront utiliser la commande /LiveChat et faire apparaître n'importe quoi sur votre flux, n'invitez pas n'importe qui.

### 📁 Formats de médias supportés

LiveChat supporte les liens directs vers des médias ainsi que les liens Tenor et X (anciennement Twitter), l'ajout d'autres plateformes est prévu.

Voici comment partager vos médias :

1. Téléchargez votre média sur votre pc (notube.lol pour YouTube par exemple)
2. Envoyez votre média dans un canal Discord (formats acceptés : .mp4, .webm, .mkv, .mov, .mp3, .wav, .ogg, .jpg, .png, .gif)
3. Faites un clic droit sur le fichier et sélectionnez "Copier le lien"
4. Utilisez ce lien dans la commande `/livechat`

> ⚠️ **Important** : Les liens YouTube, TikTok, ou autres plateformes de streaming ne sont pas supportés. Vous devez d'abord télécharger le média et l'envoyer sur Discord.

> Pour X/Twitter: Seul le premier média du Tweet est récupéré.

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
LIVECHAT_PORT=port_du_serveur_web
TOKEN=token_de_votre_bot_discord
TENOR_API_KEY=clé_api_tenor
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
│   │   ├── modules/          # Fichiers de modules
│   │   ├── utils/            # Fichiers utilitaires
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

## 📞 Contact

- **Email** : bonjour@nevylish.fr

---

<div align="center">

<sub>Construit avec ❤️ par <a href="https://github.com/nevylish">Nevylish</a> & inspiré par la <a href="https://x.com/cacaboxtv">Cacabox</a></sub>

![Node.js](https://img.shields.io/badge/Node.js--339933.svg?logo=nodedotjs)
![TypeScript](https://img.shields.io/badge/TypeScript--3178C6.svg?logo=typescript)

<sub>© Nevylish — LiveChat. Tous droits réservés.</sub>

</div>
