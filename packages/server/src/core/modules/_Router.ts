import { Logger } from '../utils/Logger';
import { Discord } from './Discord';
import { Giphy } from './Giphy';
import { Instagram } from './Instagram';
import { Tenor } from './Tenor';
import { TikTok } from './Tiktok';
import { Twitter } from './Twitter';
import { YouTube } from './YouTube';

export interface RouteResult {
    url?: string | null;
    bypassProxy?: boolean;
    error?: string;
}

export namespace Router {
    const routeError = (message: string, url: string): RouteResult => {
        Logger.warn('Router', message, { url });
        return { error: message };
    };

    export const route = async (url: string): Promise<RouteResult> => {
        if (Discord.isDiscordUrl(url)) return { url, bypassProxy: true };

        if (Giphy.isShortenedUrl(url)) {
            const directUrl = await Giphy.fetchDirectUrl(url);
            if (directUrl) return { url: directUrl, bypassProxy: true };

            return routeError('Impossible de récupérer le GIF depuis Giphy. Vérifiez le lien.', url);
        }

        if (Instagram.isInstagramUrl(url)) {
            const proxyUrl = await Instagram.getProxyUrl(url);
            if (proxyUrl) return { url: proxyUrl, bypassProxy: true };

            return routeError('Impossible de récupérer la vidéo depuis Instagram. Vérifiez le lien.', url);
        }

        if (Tenor.isShortenedUrl(url)) {
            const directUrl = await Tenor.fetchDirectUrl(url);
            if (directUrl) return { url: directUrl, bypassProxy: true };

            return routeError('Impossible de récupérer le GIF depuis Tenor. Vérifiez le lien.', url);
        }

        if (TikTok.isTikTokUrl(url)) {
            const proxyUrl = await TikTok.getProxyUrl(url);
            if (proxyUrl) return { url: proxyUrl, bypassProxy: false };

            return routeError('Impossible de récupérer la vidéo depuis TikTok. Vérifiez le lien.', url);
        }

        if (Twitter.isStatusUrl(url)) {
            const proxyUrl = await Twitter.getProxyUrl(url);
            if (proxyUrl) return { url: proxyUrl, bypassProxy: false };

            return routeError('Impossible de récupérer le média de ce Tweet. Vérifiez le lien.', url);
        }

        if (YouTube.isYouTubeUrl(url)) {
            const proxyUrl = await YouTube.getProxyUrl(url);
            if (proxyUrl) return { url: proxyUrl, bypassProxy: false };

            return routeError('Impossible de récupérer la vidéo depuis YouTube. Vérifiez le lien.', url);
        }

        return { url, bypassProxy: false };
    };
}
