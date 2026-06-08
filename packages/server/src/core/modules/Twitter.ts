import fetch from 'node-fetch';
import { Logger } from '../utils/Logger';
import { ProxyService } from './_ProxyService';
import { TwitterApiResponse } from './_types';

export namespace Twitter {
    export const isStatusUrl = (url: string): boolean => {
        return !!url.match(/^https?:\/\/(www\.)?(x|twitter)\.com\/[^\/]+\/status\/\d+/);
    };

    export const getProxyUrl = async (url: string): Promise<string | null> => {
        try {
            const apiUrl = url
                .replace('https://x.com/', 'https://api.fxtwitter.com/')
                .replace('https://twitter.com/', 'https://api.fxtwitter.com/');

            const response = await fetch(apiUrl);
            if (!response.ok) return null;
            const data = (await response.json()) as TwitterApiResponse;

            if (data?.tweet?.media?.all?.[0]?.url) {
                return ProxyService.useProxy(data.tweet.media.all[0].url, 'twitter');
            }

            if (data?.tweet?.quote?.media?.all?.[0]?.url) {
                return ProxyService.useProxy(data.tweet.quote.media.all[0].url, 'twitter');
            }

            return null;
        } catch (err) {
            Logger.error('Twitter.ts', '(getProxyUrl)', err);
            return null;
        }
    };
}
