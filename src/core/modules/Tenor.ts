/*
 * Copyright (C) 2025 LiveChat by Nevylish
 */

export namespace Tenor {
    export const isShortenedUrl = (url: string): boolean => {
        if (url.match(/^https?:\/\/tenor\.com\/(fr\/)?view\//)) return true;

        return false;
    };

    export const validateDirectUrl = (url: string): boolean => {
        if (url.match(/^https?:\/\/media\.tenor\.com\//)) return true;

        return false;
    };

    export const fetchDirectUrl = async (url: string): Promise<string> => {
        try {
            const parts = url.split('-');
            const gifId = parts[parts.length - 1];
            if (!gifId || isNaN(Number(gifId))) return null;

            const apiKey = process.env.TENOR_API_KEY;
            const apiUrl = `https://tenor.googleapis.com/v2/posts?ids=${gifId}&key=${apiKey}`;

            const response = await fetch(apiUrl);
            if (!response.ok) return null;
            const data: any = await response.json();

            if (
                data &&
                Array.isArray(data.results) &&
                data.results[0] &&
                data.results[0].media_formats &&
                data.results[0].media_formats.gif &&
                data.results[0].media_formats.gif.url
            ) {
                return data.results[0].media_formats.gif.url;
            }

            // Fallback pour certains GIFs qui n'ont pas le format gif mais webm/mp4
            if (data && Array.isArray(data.results) && data.results[0] && data.results[0].media_formats) {
                const formats = data.results[0].media_formats;
                if (formats.mediumgif && formats.mediumgif.url) return formats.mediumgif.url;
                if (formats.tinygif && formats.tinygif.url) return formats.tinygif.url;
                if (formats.mp4 && formats.mp4.url) return formats.mp4.url;
            }

            return null;
        } catch (e) {
            return null;
        }
    };
}
