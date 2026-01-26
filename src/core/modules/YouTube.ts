/**
 * TODO: Ce fichier servira à prendre en charge les liens raccourcis YouTube.
 *
 * C'est l'ajout dont je suis le plus pressé d'ajouter, j'y avais déjà fait une tentative juste en dessous mais je n'avais pas remarqué un détail.
 * Effectivement le code en dessous est fonctionnel, il permet de récupérer la vidéo brute, pas d'iframe et pas de publicités, magnifique?
 * SAUF QUE ce lien magique est restreint à l'IP de mon serveur, donc illisible sur le navigateur des utilisateurs.
 *
 * Je voulais éviter de devoir télécharger et stocker les vidéos sur mon serveur pour les envoyer sur les OBS des utilisateurs pour éviter les abus et les problèmes.
 * J'essayerais très prochainement de trouver une solution pour rendre YouTube fonctionnel sur LiveChat.
 */

// const ytdl = require('@distube/ytdl-core');

// export namespace YouTube {
//     const isYouTubeDirect =
//         url.hostname.includes('googlevideo.com') ||
//         url.hostname.includes('youtube.com') ||
//         url.searchParams.has('range') ||
//         url.searchParams.has('expire');
//     async getYoutubeDirectUrl(interaction: ChatInputCommandInteraction, content: string): Promise<string | null> {
//         try {
//             if (content.includes('/shorts/')) {
//                 let id = content.split('/');
//                 content = 'https://www.youtube.com/watch?v=' + id[id.length - 1];
//             }
//             if (!ytdl.validateURL(content)) {
//                 await interaction.editReply("Le lien YouTube n'est pas valide.");
//                 return;
//             }
//             const info = await ytdl.getInfo(content);
//             const filesWithAudio = info.formats.filter((f) => f.hasVideo && f.hasAudio && f.container === 'mp4');

//             let format;
//             if (filesWithAudio.length > 0) {
//                 format = filesWithAudio.reduce((prev, curr) => {
//                     return (curr.bitrate || 0) > (prev.bitrate || 0) ? curr : prev;
//                 });
//             } else {
//                 format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'videoandaudio' });
//             }
//             if (!format || !format.url) {
//                 return null;
//             }
//             return format.url;
//         } catch (e) {
//             return null;
//         }
//     }
//     else if (
//        url.match(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//) ||
//        url.match(/^https?:\/\/.*googlevideo\.com\//)
//     ) {
//        filetype = 'Vidéo YouTube';
//     }
// }
