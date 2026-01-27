/**
 * Ce fichier permettera la prise en charge des vidéos YouTube.
 *
 * Malheureusement, YouTube bloque le plus possible ce genre de comportement.
 * Ce projet est hébergé sur un VPS, donc l'IP est flag comme robot, ça empêche toute intéraction avec les serveurs de Google
 * Je cherche encore une solution. Sinon le code ci-dessous fonctionne très bien sans le flag IP.
 *
 * Pour le moment je le laisse désactivé.
 */

// const ytdl = require('@distube/ytdl-core');

import { Request, Response } from 'express';
import { Constants } from '../utils/Constants';
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

    // export const getYoutubeDirectUrl = async (
    //     interaction: ChatInputCommandInteraction,
    //     content: string,
    // ): Promise<string | null> => {
    //     try {
    //         if (content.includes('/shorts/')) {
    //             const id = content.split('/').pop();
    //             content = `https://www.youtube.com/watch?v=${id}`;
    //         }

    //         if (!ytdl.validateURL(content)) {
    //             await interaction.editReply("Le lien YouTube n'est pas valide.");
    //             return null;
    //         }

    //         const info = await ytdl.getInfo(content);

    //         const filesWithAudio = info.formats.filter((f: any) => f.hasVideo && f.hasAudio && f.container === 'mp4');

    //         let format;
    //         if (filesWithAudio.length > 0) {
    //             format = filesWithAudio.reduce((prev: any, curr: any) => {
    //                 return (curr.bitrate || 0) > (prev.bitrate || 0) ? curr : prev;
    //             });
    //         } else {
    //             format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'videoandaudio' });
    //         }

    //         if (!format || !format.url) {
    //             return null;
    //         }

    //         const videoUrl = format.url;
    //         const secret = process.env.SECRET_API!;
    //         const expires = Math.floor(Date.now() / 1000) + 3600;

    //         const token = crypto
    //             .createHmac('sha256', secret)
    //             .update(videoUrl + expires)
    //             .digest('hex');

    //         return `${Constants.getApiPath()}/youtube?url=${encodeURIComponent(videoUrl)}&token=${token}&expires=${expires}`;
    //     } catch (e) {
    //         console.error("Erreur lors de la récupération de l'URL YouTube:", e);
    //         return null;
    //     }
    // };

    export const handleProxy = async (req: Request, res: Response) => {
        const videoUrl = req.query.url as string;
        const token = req.query.token as string;
        const expires = req.query.expires as string;
        const range = req.headers.range;

        if (!videoUrl || !token || !expires) {
            return res.status(400).send('Missing video URL, token or expires');
        }

        const now = Math.floor(Date.now() / 1000);
        if (now > parseInt(expires)) {
            return res.status(403).send('Lien expiré');
        }

        const secret = process.env.SECRET_API;
        const expectedToken = crypto
            .createHmac('sha256', secret)
            .update(videoUrl + expires)
            .digest('hex');

        if (token !== expectedToken) {
            return res.status(403).send('Token invalide');
        }

        try {
            const url = new URL(videoUrl);
            const allowedDomains = ['googlevideo.com'];
            const isAllowed = allowedDomains.some((domain) => url.hostname.endsWith(domain));

            if (!isAllowed) {
                return res.status(403).send('URL non autorisée');
            }
        } catch (err) {
            return res.status(400).send('URL malformée');
        }

        try {
            const headers: Record<string, string> = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                Referer: 'https://www.youtube.com/',
                Accept: '*/*',
                'Accept-Encoding': 'identity',
                Connection: 'close',
            };

            if (range) {
                headers['Range'] = range;
            } else {
                headers['Range'] = 'bytes=0-';
            }

            const youtubeRes = await fetch(videoUrl, {
                headers,
                redirect: 'follow',
            });

            if (!youtubeRes.ok || !youtubeRes.body) {
                return res.status(502).send(`YouTube fetch failed: ${youtubeRes.status}`);
            }

            res.status(206);

            const passthroughHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];

            for (const h of passthroughHeaders) {
                const v = youtubeRes.headers.get(h);
                if (v) res.setHeader(h, v);
            }

            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'close');

            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Expose-Headers', '*');

            (youtubeRes.body as any).pipe(res);
        } catch (err) {
            console.error('Proxy error:', err);
            res.status(500).send('Proxy error');
        }
    };

    export const validateDirectUrl = (url: string): boolean => {
        return url.startsWith(Constants.getApiPath() + '/youtube');
    };
}
