import fetch from 'node-fetch';
import { CacheManager } from '../utils/CacheManager';
import { Logger } from '../utils/Logger';
import { GiphyApiResponse } from './_types';

export namespace Giphy {
    export const isShortenedUrl = (url: string): boolean => {
        return !!url.match(/^(https?:\/\/)?(www\.)?(giphy\.com\/gifs\/|gph\.is\/)/);
    };

    export const fetchDirectUrl = async (url: string): Promise<string | null> => {
        return CacheManager.getOrFetch(
            `giphy:${url}`,
            async () => {
                try {
                    let gifId = '';

                    if (url.includes('giphy.com/gifs/')) {
                        const match = url.match(/giphy\.com\/gifs\/(?:.*-)?([a-zA-Z0-9]+)/);
                        if (match && match[1]) {
                            gifId = match[1];
                        }
                    } else if (url.includes('gph.is/')) {
                        const parts = url.split('/');
                        gifId = parts[parts.length - 1];
                    }

                    if (!gifId) return null;

                    const apiKey = process.env.GIPHY_API_KEY;
                    const apiUrl = `https://api.giphy.com/v1/gifs/${gifId}?api_key=${apiKey}`;

                    const response = await fetch(apiUrl);
                    if (!response.ok) return null;

                    const data = (await response.json()) as GiphyApiResponse;

                    if (data?.data?.images?.original?.url) {
                        return data.data.images.original.url;
                    }

                    Logger.warn('Giphy', 'No GIF found', { url });
                    return null;
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    Logger.error('Giphy', 'Error while fetching media', { url, error: errorMessage });
                    return null;
                }
            },
            24 * 60 * 60 * 1000,
        );
    };

    export const validateDirectUrl = (url: string): boolean => {
        return (
            url.includes('giphy.com') &&
            url.includes('media') &&
            (url.includes('mp4') || url.includes('webm') || url.includes('gif'))
        );
    };
}
