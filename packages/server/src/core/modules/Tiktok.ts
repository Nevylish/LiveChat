import fetch from 'node-fetch';
import { Logger } from '../utils/Logger';
import { ProxyService } from './_ProxyService';
import { TikTokApiResponse } from './_types';

export namespace TikTok {
    export const isTikTokUrl = (url: string): boolean => {
        return !!url.match(/^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\/.+/);
    };

    export const getProxyUrl = async (url: string): Promise<string | null> => {
        try {
            const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                Logger.warn('TikTok', `Erreur API: ${response.status}`, { url });
                return null;
            }

            const result = (await response.json()) as TikTokApiResponse;

            if (result?.data?.play) {
                const videoUrl = result.data.play;
                return ProxyService.useProxy(videoUrl, 'tiktok', 'video');
            }

            Logger.warn('TikTok', 'Aucune URL de lecture trouvée', { url });
            return null;
        } catch (err) {
            Logger.error('TikTok', '(getProxyUrl)', err);
            return null;
        }
    };
}
