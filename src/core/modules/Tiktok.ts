/**
 * Ce fichier permet la prise en charge des vidéos Tiktok.
 */

import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { Constants } from '../utils/Constants';
import crypto = require('crypto');

export namespace TikTok {
    export const isTikTokUrl = (url: string): boolean => {
        return !!url.match(/^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\/.+/);
    };

    export const fetchDirectUrl = async (url: string): Promise<string | null> => {
        try {
            const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
            const response = await fetch(apiUrl);
            if (!response.ok) return null;

            const result: any = await response.json();

            if (result && result.data && result.data.play) {
                const videoUrl = result.data.play;
                const secret = process.env.SECRET_API;

                const expires = Math.floor(Date.now() / 1000) + 3600;

                const token = crypto
                    .createHmac('sha256', secret)
                    .update(videoUrl + expires)
                    .digest('hex');

                return `${Constants.getApiPath()}/tiktok?url=${encodeURIComponent(videoUrl)}&token=${token}&expires=${expires}`;
            }

            return null;
        } catch {
            return null;
        }
    };

    export const handleProxy = async (req: Request, res: Response): Promise<any> => {
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
            const allowedDomains = ['tiktokcdn.com', 'byteoversea.com'];
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
                Referer: 'https://www.tiktok.com/',
                Accept: '*/*',
                'Accept-Encoding': 'identity',
                Connection: 'close',
            };

            if (range) {
                headers['Range'] = range;
            } else {
                headers['Range'] = 'bytes=0-';
            }

            const tiktokRes = await fetch(videoUrl, {
                headers,
                redirect: 'follow',
            });

            if (!tiktokRes.ok || !tiktokRes.body) {
                return res.status(502).send(`TikTok fetch failed: ${tiktokRes.status}`);
            }

            res.status(206);

            const passthroughHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];

            for (const h of passthroughHeaders) {
                const v = tiktokRes.headers.get(h);
                if (v) res.setHeader(h, v);
            }

            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'close');

            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Expose-Headers', '*');

            (tiktokRes.body as any).pipe(res);
        } catch (err) {
            console.error('Proxy error:', err);
            res.status(500).send('Proxy error');
        }
    };

    export const validateDirectUrl = (url: string): boolean => {
        return url.startsWith(Constants.getApiPath() + '/tiktok');
    };
}
