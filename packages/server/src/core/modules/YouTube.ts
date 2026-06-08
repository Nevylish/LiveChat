import { youtubeDl as youtubedl } from 'youtube-dl-exec';
import { Logger } from '../utils/Logger';
import { ProxyService } from './_ProxyService';

export namespace YouTube {
    export const isYouTubeUrl = (url: string): boolean => {
        return !!url.match(
            /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        );
    };

    export const getProxyUrl = async (url: string): Promise<string | null> => {
        try {
            const output = await youtubedl(url, {
                dumpSingleJson: true,
                noWarnings: true,
                noPlaylist: true,
                format: 'best[ext=mp4][height<=1080]/best',
            });

            const info: any = output;

            if (info.duration && info.duration > 600) {
                Logger.error('YouTube.ts', '(getProxyUrl)', `La vidéo est trop longue.`);
                return null;
            }

            console.log(info);

            const directUrl = info.url;

            if (directUrl) {
                return ProxyService.useProxy(directUrl, 'youtube', 'video');
            }

            return null;
        } catch (err) {
            Logger.error('YouTube.ts', '(getProxyUrl)', err);
            return null;
        }
    };
}
