import fetch from 'node-fetch';
import { CacheManager } from '../utils/CacheManager';
import { Logger } from '../utils/Logger';
import { ProxyService } from '../utils/ProxyService';
import { TwitterApiResponse } from './_types';

export namespace Twitter {
    export const isStatusUrl = (url: string): boolean => {
        return !!url.match(/^https?:\/\/(www\.)?(x|twitter)\.com\/[^\/]+\/status\/\d+/);
    };

    export const getProxyUrl = async (url: string): Promise<string | null> => {
        const rawUrl = await CacheManager.getOrFetch(
            `twitter:raw:${url}`,
            async () => {
                try {
                    const apiUrl = url
                        .replace('https://x.com/', 'https://api.fxtwitter.com/')
                        .replace('https://twitter.com/', 'https://api.fxtwitter.com/');

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
