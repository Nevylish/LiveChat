/*
 * Copyright (C) 2025 LiveChat by Nevylish
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
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

    export const getDirectUrl = async (url: string): Promise<string | null> => {
        try {
            const regex = /tenor\.com\/(?:view|fr\/view)\/[a-zA-Z0-9\-]+-(\d+)/;
            const match = url.match(regex);
            if (!match || !match[1]) return null;
            const gifId = match[1];

            const apiKey = process.env.TENOR_API_KEY;
            const apiUrl = `https://tenor.googleapis.com/v2/posts?ids=${gifId}&key=${apiKey}`;

            const response = await fetch(apiUrl);
            if (!response.ok) return null;
            const data = await response.json();

            if (
                typeof data === 'object' &&
                data !== null &&
                Array.isArray((data as any).results) &&
                (data as any).results[0] &&
                (data as any).results[0].media_formats &&
                (data as any).results[0].media_formats.gif &&
                (data as any).results[0].media_formats.gif.url
            ) {
                return (data as any).results[0].media_formats.gif.url;
            }

            // Fallback pour certains GIFs qui n'ont pas le format gif mais webm/mp4
            if (
                typeof data === 'object' &&
                data !== null &&
                Array.isArray((data as any).results) &&
                (data as any).results[0] &&
                (data as any).results[0].media_formats
            ) {
                const formats = (data as any).results[0].media_formats;
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
