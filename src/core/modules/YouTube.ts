/**
 * Ce fichier permettera la prise en charge des vidéos YouTube.
 *
 * Malheureusement, YouTube bloque le plus possible ce genre de comportement.
 * Ce projet est hébergé sur un VPS, donc l'IP est flag comme robot, ça empêche toute intéraction avec les serveurs de Google
 * Je cherche encore une solution. Sinon le code ci-dessous fonctionne très bien sans le flag IP.
 *
 * Donc pour le moment, avec un peu de chance parfois la sécurité de Google va laisser passer l'IP de mon serveur,
 * mais il est plus probable que vous gagniez au Loto.
 */

const ytdl = require('@distube/ytdl-core');

import { ChatInputCommandInteraction } from 'discord.js';
import crypto = require('crypto');

export namespace YouTube {
    export const isYouTubeDirect = (url: URL): boolean => {
        return (
            url.hostname.includes('googlevideo.com') ||
            url.hostname.includes('youtube.com') ||
            url.searchParams.has('range') ||
            url.searchParams.has('expire')
        );
    };

    export const isYouTubeUrl = (url: string): boolean => {
        return !!(
            url.match(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//) || url.match(/^https?:\/\/.*googlevideo\.com\//)
        );
    };

    export const getYoutubeDirectUrl = async (
        interaction: ChatInputCommandInteraction,
        content: string,
    ): Promise<string | null> => {
        try {
            if (content.includes('/shorts/')) {
                const id = content.split('/').pop();
                content = `https://www.youtube.com/watch?v=${id}`;
            }

            if (!ytdl.validateURL(content)) {
                await interaction.editReply("Le lien YouTube n'est pas valide.");
                return null;
            }

            const info = await ytdl.getInfo(content);

            const filesWithAudio = info.formats.filter((f: any) => f.hasVideo && f.hasAudio && f.container === 'mp4');

            let format;
            if (filesWithAudio.length > 0) {
                format = filesWithAudio.reduce((prev: any, curr: any) => {
                    return (curr.bitrate || 0) > (prev.bitrate || 0) ? curr : prev;
                });
            } else {
                format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'videoandaudio' });
            }

            if (!format || !format.url) {
                return null;
            }

            const videoUrl = format.url;
            const secret = process.env.SECRET_API!;
            const expires = Math.floor(Date.now() / 1000) + 3600;

            const token = crypto
                .createHmac('sha256', secret)
                .update(videoUrl + expires)
                .digest('hex');

            return `https://livechat.nevylish.fr/api/youtube?url=${encodeURIComponent(videoUrl)}&token=${token}&expires=${expires}`;
        } catch (e) {
            console.error("Erreur lors de la récupération de l'URL YouTube:", e);
            return null;
        }
    };

    export const validateDirectUrl = (url: string): boolean => {
        return url.startsWith('https://livechat.nevylish.fr/api/youtube');
    };
}
