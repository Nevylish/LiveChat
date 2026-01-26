/**
 * Ce fichier permet la prise en charge des vidéos Tiktok.
 */

import fetch from 'node-fetch';
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
                return result.data.play;
            }

            return null;
        } catch {
            return null;
        }
    };

    export const validateDirectUrl = (url: string): boolean => {
        return url.match(/^https?:\/\/([a-zA-Z0-9-]+\.)?tiktokcdn\.com\/.+/) !== null;
    };
}
