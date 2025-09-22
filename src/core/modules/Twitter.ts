import fetch from 'node-fetch';

export namespace Twitter {
    export const isStatusUrl = (url: string): boolean => {
        if (url.match(/^https?:\/\/(www\.)?x\.com\/[^\/]+\/status\/\d+/)) return true;
        return false;
    };

    export const parseDirectUrl = async (url: string): Promise<string | null> => {
        try {
            const apiUrl = url.replace('https://x.com/', 'https://api.fxtwitter.com/');
            const response = await fetch(apiUrl);
            if (!response.ok) return null;
            const data: any = await response.json();

            if (data && Array.isArray(data.tweet.media.all) && data.tweet.media.all[0].url) {
                return data.tweet.media.all[0].url;
            }

            return null;
        } catch {
            return null;
        }
    };

    export const validateDirectUrl = (url: string): boolean => {
        if (url.includes('.twimg.com/')) return true;

        return false;
    };
}
