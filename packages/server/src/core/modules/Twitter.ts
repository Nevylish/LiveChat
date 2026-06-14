import fetch from 'node-fetch';
import { CacheManager } from '../utils/CacheManager';
import { Logger } from '../utils/Logger';
import { ProxyService } from './_ProxyService';
import { TwitterApiResponse } from './_types';

export namespace Twitter {
    export const isStatusUrl = (url: string): boolean => {
        return !!url.match(/^https?:\/\/(www\.)?(x|twitter)\.com\/[^\/]+\/status\/\d+/);
    };

    export const getProxyUrl = async (url: string): Promise<string | null> => {
        return CacheManager.getOrFetch(
            `twitter:${url}`,
            async () => {
                try {
                    const apiUrl = url
                        .replace('https://x.com/', 'https://api.fxtwitter.com/')
                        .replace('https://twitter.com/', 'https://api.fxtwitter.com/');

                    const response = await fetch(apiUrl);
                    if (!response.ok) {
                        Logger.error('Twitter', `API Error: ${response.status}`, { url });
                        return null;
                    }
                    const data = (await response.json()) as TwitterApiResponse;

                    if (data?.tweet?.media?.all?.[0]?.url) {
                        return ProxyService.useProxy(data.tweet.media.all[0].url, 'twitter');
                    }

                    if (data?.tweet?.quote?.media?.all?.[0]?.url) {
                        return ProxyService.useProxy(data.tweet.quote.media.all[0].url, 'twitter');
                    }

                    Logger.warn('Twitter', 'No media found in the tweet', { url });
                    return null;
                } catch (err) {
                    Logger.error('Twitter', 'Error while fetching media', { url, error: err });
                    return null;
                }
            },
            1 * 60 * 60 * 1000,
        );
    };
}
