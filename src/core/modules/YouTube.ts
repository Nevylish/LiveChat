/*
 * Copyright (C) 2025 LiveChat by Nevylish
 */

// const ytdl = require('@distube/ytdl-core');

export namespace YouTube {
    // const isYouTubeDirect =
    //     url.hostname.includes('googlevideo.com') ||
    //     url.hostname.includes('youtube.com') ||
    //     url.searchParams.has('range') ||
    //     url.searchParams.has('expire');
    // async getYoutubeDirectUrl(interaction: ChatInputCommandInteraction, content: string): Promise<string | null> {
    //     try {
    //         if (content.includes('/shorts/')) {
    //             let id = content.split('/');
    //             content = 'https://www.youtube.com/watch?v=' + id[id.length - 1];
    //         }
    //         if (!ytdl.validateURL(content)) {
    //             await interaction.editReply("Le lien YouTube n'est pas valide.");
    //             return;
    //         }
    //         const info = await ytdl.getInfo(content);
    //         // On cherche le format mp4 AVEC AUDIO de la meilleure qualité disponible
    //         // On filtre pour ne garder que les formats qui contiennent à la fois la vidéo et l'audio
    //         const filesWithAudio = info.formats.filter((f) => f.hasVideo && f.hasAudio && f.container === 'mp4');
    //         // On prend le format avec le plus haut débit vidéo
    //         let format;
    //         if (filesWithAudio.length > 0) {
    //             format = filesWithAudio.reduce((prev, curr) => {
    //                 return (curr.bitrate || 0) > (prev.bitrate || 0) ? curr : prev;
    //             });
    //         } else {
    //             // Fallback : on prend le format mp4 le plus qualitatif (même si pas d'audio)
    //             format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'videoandaudio' });
    //         }
    //         if (!format || !format.url) {
    //             return null;
    //         }
    //         return format.url;
    //     } catch (e) {
    //         return null;
    //     }
    // }
    // else if (
    //    url.match(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//) ||
    //    url.match(/^https?:\/\/.*googlevideo\.com\//)
    //) {
    //    filetype = 'Vidéo YouTube';
    //}
}
