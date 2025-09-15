/*
 * Copyright (C) 2025 LiveChat by Nevylish
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
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
