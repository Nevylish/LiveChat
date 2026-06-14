import fetch from 'node-fetch';
import { Logger } from '../utils/Logger';
import { TenorApiResponse } from './_types';

export namespace Tenor {
    export const isShortenedUrl = (url: string): boolean => {
        return !!url.match(/^https?:\/\/tenor\.com\/(fr\/)?view\//);
    };

    export const fetchDirectUrl = async (url: string): Promise<string | null> => {
        try {
            const parts = url.split('-');
            const gifId = parts[parts.length - 1];
            if (!gifId || isNaN(Number(gifId))) return null;

            const apiKey = process.env.TENOR_API_KEY;
            const apiUrl = `https://tenor.googleapis.com/v2/posts?ids=${gifId}&key=${apiKey}`;

            const response = await fetch(apiUrl);
            if (!response.ok) {
                Logger.error('Tenor', `API Error: ${response.status}`, { url });
                return null;
            }
            const data = (await response.json()) as TenorApiResponse;

            const firstResult = data?.results?.[0];
            if (!firstResult?.media_formats) return null;

            const formats = firstResult.media_formats;

            // Priorité: gif > mediumgif > tinygif > mp4
            if (formats.gif?.url) return formats.gif.url;
            if (formats.mediumgif?.url) return formats.mediumgif.url;
            if (formats.tinygif?.url) return formats.tinygif.url;
            if (formats.mp4?.url) return formats.mp4.url;

            return null;
        } catch (err) {
            Logger.error('Tenor', 'Error while fetching media', { url, error: err });
            return null;
        }
    };

    export const validateDirectUrl = (url: string): boolean => {
        return !!url.match(/^https?:\/\/media\.tenor\.com\//);
    };
}
