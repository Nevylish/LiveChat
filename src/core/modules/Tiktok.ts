/**
 * Ce fichier permet la prise en charge des vidéos Tiktok.
 */

import fetch from 'node-fetch';
import crypto = require('crypto');
export namespace TikTok {
    export const isTikTokUrl = (url: string): boolean => {
        return url.match(/^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\/.+/) !== null;
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

                return `https://livechat.nevylish.fr/api/tiktok?url=${encodeURIComponent(videoUrl)}&token=${token}&expires=${expires}`;
            }

            return null;
        } catch {
            return null;
        }
    };

    export const validateDirectUrl = (url: string): boolean => {
        return url.startsWith('https://livechat.nevylish.fr/api/tiktok');
    };
}
