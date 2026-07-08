import fetch from 'node-fetch';
import { CacheManager } from '../utils/CacheManager';
import { Logger } from '../utils/Logger';
import { ProxyService } from '../utils/ProxyService';
import { TwitterApiResponse } from './_types';

const STATUS_URL_RE = /^https?:\/\/(www\.)?(x|twitter)\.com\/([^/?#]+)\/status\/(\d+)/;

export namespace Twitter {
    export const normalizeStatusUrl = (url: string): string | null => {
        const match = url.match(STATUS_URL_RE);
        if (!match) return null;
        const [, www = '', domain, username, statusId] = match;
        return `https://${www}${domain}.com/${username}/status/${statusId}`;
    };

    export const isStatusUrl = (url: string): boolean => {
        return STATUS_URL_RE.test(url);
    };

    export const getProxyUrl = async (url: string): Promise<string | null> => {
        const normalizedUrl = normalizeStatusUrl(url);
        if (!normalizedUrl) return null;

        const rawUrl = await CacheManager.getOrFetch(
            `twitter:raw:${normalizedUrl}`,
            async () => {
                try {
                    const apiUrl = normalizedUrl.replace(
                        /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\//,
                        'https://api.fxtwitter.com/',
                    );

                    const response = await fetch(apiUrl);
                    if (!response.ok) {
                        Logger.error('Twitter', `API Error: ${response.status}`, url);
                        return null;
                    }
                    const data = (await response.json()) as TwitterApiResponse;

                    if (data?.tweet?.media?.all?.[0]?.url) {
                        return data.tweet.media.all[0].url;
                    }

                    if (data?.tweet?.quote?.media?.all?.[0]?.url) {
                        return data.tweet.quote.media.all[0].url;
                    }

                    Logger.warn('Twitter', 'No media found in the tweet', { url });
                    return null;
                } catch (err) {
                    Logger.error('Twitter', 'Error while fetching media', { url, err });
                    return null;
                }
            },
            6 * 60 * 60 * 1000,
        );

        if (!rawUrl) return null;
        return ProxyService.useProxy(rawUrl, 'twitter');
    };
}
