import { youtubeDl as youtubedl } from 'youtube-dl-exec';
import { Logger } from '../utils/Logger';
import { ProxyService } from './_ProxyService';

export namespace Instagram {
    export const isInstagramUrl = (url: string): boolean => {
        return !!url.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/);
    };

    export const validateDirectUrl = (url: string): boolean => {
        return !!url.match(/^https?:\/\/(?:[a-zA-Z0-9-.]+\.)?cdninstagram\.com\//);
    };

    export const getProxyUrl = async (url: string): Promise<string | null> => {
        try {
            const output = await youtubedl(url, {
                dumpSingleJson: true,
                noWarnings: true,
                noPlaylist: true,
                format: 'best[ext=mp4]/best',
            });

            const info: any = output;

            if (info.duration && info.duration > 600) {
                Logger.warn('Instagram', `Video is too long ${info.duration}s`, { url });
                return null;
            }

            const directUrl = info.url;

            if (directUrl) {
                if (validateDirectUrl(directUrl)) {
                    return directUrl;
                }

                return ProxyService.useProxy(directUrl, 'instagram', 'video');
            }

            Logger.warn('Instagram', 'No direct URL found', { url });
            return null;
        } catch (err) {
            Logger.error('Instagram', 'Error while fetching media', { url, error: err });
            return null;
        }
    };
}
