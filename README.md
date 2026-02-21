## 📝 À propos

LiveChat est un bot Discord et un overlay OBS Studio, Streamlabs et plus encore qui permet d'afficher une image, une vidéo ou jouer un son sur un flux en direct depuis une simple commande Discord.

Plusieurs streameurs peuvent utiliser le même serveur Discord et les utilisateurs pourront choisir à quel streameur envoyer leur média.

Vous pouvez suivre les mises à jour du projet ici: [https://livechat.nevylish.fr/updates](https://livechat.nevylish.fr/updates.html)

Le code source n'est pas la version complète de LiveChat, j'en reparle plus bas.

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
    - Ajoutez l'URL du média ou glissez le fichier directement (sélectionnez Fichier pour glisser un média depuis votre PC ou URL pour coller un lien)
    - Des options de commandes facultatives sont disponibles, `fullscreen` affiche le média en plein écran sur le stream, `texte` permet d'ajouter du texte par dessus en bas du média avec la police d'écriture Impact (style Meme)
3. Vos médias s'afficheront instantanément dans le stream du streameur sélectionné

> ⚠️ **Attention** : Gardez à l'esprit que tous les membres présents sur le serveur pourront utiliser la commande /LiveChat et faire apparaître n'importe quoi sur votre flux, n'invitez pas n'importe qui.

### 📁 Formats de médias supportés

Vous avez trois manières de partager vos médias :

1. Vous pouvez envoyer un fichier depuis votre PC via l'option "Fichier" de la commande `/livechat`
2. Vous pouvez envoyer un lien direct, donc qui termine par l'extension du fichier (ex: .mp4, .webm, .mkv, .mov, .mp3, .wav, .ogg, .jpg, .png, .gif)
   via l'option "URL" de la commande `/livechat`
3. Et la plus simple, vous pouvez envoyer un lien depuis les plateformes prises en charge également depuis la commande `/livechat` (Ex: Pour Tiktok ou X, faire Partager > Copier le lien > Mettre ce lien dans l'option URL)

Actuellement les plateformes supportées sont :

- Tiktok
- X (anciennement Twitter)
- Discord (si vous ou quelqu'un d'autre envoyez un média dans un salon textuel,  
  vous pouvez juste faire clic-droit > Copier le lien puis l'utiliser dans la commande `/livechat`)
- Giphy (en gros le truc de gifs intégré à Discord)
- Tenor (l'ancien truc de gifs intégré à Discord)

D'autres plateformes seront ajoutées au fur et à mesure.

> ⚠️ **Important** : Les liens YouTube, ou autres plateformes de streaming ne sont pas supportés. Vous devrez d'abord télécharger le média sur votre PC.

> Pour X/Twitter: Seul le premier média du post est récupéré.  
> Pour Tiktok: Seul les vidéos sont récupérées, les carousels ne sont pas supportés.

### Les autres commandes

Il existe deux autres commandes sur le bot Discord.

- /skip: Pour passer à la vidéo suivante
- /clear: Pour stopper la vidéo actuelle et vider la file d'attente

## Informations supplémentaires

Le code de ce repo n'est pas celui hébergé et proposé au public.

Pour éviter le vol et la réappropriation du projet j'ai préféré ne laisser que la partie basique du projet.
Les fonctionnalités qui font de cette version la plus complète resteront propriétaires.

La version privée est mise à jour régulièrement pour la sécurité et reste respectueuse de la vie privée.
Pour les développeurs qui voudraient contribuer au projet, vous pouvez me contacter via Twitter @Nevylish ou directement sur ce repo.

Si vous êtes une personnalité publique ou que vous avez un gros projet et souhaitez une version hébergé séparément sur des serveurs plus puissants et plus discrets, vous pouvez me contacter via Twitter @Nevylish ou par mail à l'adresse bonjour@nevylish.fr.

---

<div align="center">

<sub>© Nevylish — LiveChat. Tous droits réservés.</sub>
<br />
<sub>Non affilié à Twitch, Cacabox ou toute autre marque, plateforme ou personne tierce.</sub>

</div>
