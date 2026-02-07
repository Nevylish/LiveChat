/**
 * Ce fichier permet la prise en charge des liens raccoucis Twitter (désormais X).
 *
 * Même si vous devez probablement le savoir, sur Twitter on retrouve beaucoup de Memes ou médias qui pourraient être utilisés dans LiveChat.
 * La recherche Twitter permet de les retrouver rapidement avec quelques mots-clés.
 *
 * Twitter permet de base de récupérer les liens directs, mais une API publique me permet tout aussi facilement l'intégration des liens raccouris.
 * https://github.com/FxEmbed/FxEmbed
 */

import fetch from 'node-fetch';
import { ProxyService } from './_ProxyService';

export namespace Twitter {
    export const isStatusUrl = (url: string): boolean => {
        return !!url.match(/^https?:\/\/(www\.)?x\.com\/[^\/]+\/status\/\d+/);
    };

    export const getProxyUrl = async (url: string): Promise<string | null> => {
        try {
            const apiUrl = url.replace('https://x.com/', 'https://api.fxtwitter.com/');
            const response = await fetch(apiUrl);
            if (!response.ok) return null;
            const data: any = await response.json();

            if (data && Array.isArray(data.tweet.media.all) && data.tweet.media.all[0].url) {
                return ProxyService.useProxy(data.tweet.media.all[0].url, 'twitter');
            }

            return null;
        } catch {
            return null;
        }
    };
}
