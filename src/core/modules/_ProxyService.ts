// Ce fichier permet une seule et plusieurs choses à la fois.
// Ici on gère le proxy qui streamera les médias au client OBS.
// Plusieurs raisons à cela, premièrement ça facilite la prise en charge de certains sites.
// De plus cela évite d'exposer l'adresse IP du streameur.
// Exemple: j'envoi un média depuis mon propre serveur, il sera possible d'intercepter la requête du client OBS, donc fuite d'IP.

// Dans certains cas comme les liens Discord ou Tenor par exemple, inutile de passer par ce proxy.

import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { Constants } from '../utils/Constants';
import { Functions } from '../utils/Functions';
import crypto = require('crypto');

export namespace ProxyService {
    let secret: string;

    export const generateRandomSecretAndStore = (): boolean => {
        if (secret) return false;
        secret = crypto.randomBytes(64).toString('hex');
        return true;
    };

    export const useProxy = (url: string, source: string = 'Unknown', forceFileType: string = 'false'): string => {
        if (isValidUrl(url)) return url;

        const expires = Math.floor(Date.now() / 1000) + 3600;

        const token = crypto
            .createHmac('sha256', secret)
            .update(url + expires)
            .digest('hex');

        let fileType;

        if (forceFileType === 'false') {
            fileType = Functions.getFileType(url).param;
        } else {
            fileType = forceFileType;
        }

        return `${Constants.getApiPath()}/proxy?url=${encodeURIComponent(url)}&token=${token}&expires=${expires}&type=${fileType}&source=${source}`;
    };

    export const isValidUrl = (url: string): boolean => {
        return (
            url.includes(Constants.getApiPath()) &&
            url.includes('token=') &&
            url.includes('expires=') &&
            url.includes('type=') &&
            url.includes('source=')
        );
    };

    export const handle = async (req: Request, res: Response) => {
        const targetUrl = req.query.url as string;
        const token = req.query.token as string;
        const expires = req.query.expires as string;
        const range = req.headers.range;

        if (!targetUrl || !token || !expires) {
            return res.status(403).send('Paramètres manquants');
        }

        const now = Math.floor(Date.now() / 1000);
        if (now > parseInt(expires)) {
            return res.status(403).send('Lien expiré');
        }

        const expectedToken = crypto
            .createHmac('sha256', secret)
            .update(targetUrl + expires)
            .digest('hex');

        if (token !== expectedToken) {
            return res.status(403).send('Signature invalide');
        }

        try {
            const urlObj = new URL(targetUrl);
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return res.status(400).send('Protocole invalide');
            }

            const headers: Record<string, string> = {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
            };

            if (range) {
                headers['Range'] = range;
            }

            const response = await fetch(targetUrl, {
                headers,
                redirect: 'follow',
            });

            if (!response.ok) {
                return res.status(502).send(`Erreur proxy: ${response.statusText}`);
            }

            res.status(response.status);

            const headersToForward = [
                'content-type',
                'content-length',
                'content-range',
                'accept-ranges',
                'last-modified',
                'etag',
            ];

            for (const h of headersToForward) {
                const val = response.headers.get(h);
                if (val) res.setHeader(h, val);
            }

            res.setHeader('Access-Control-Allow-Origin', '*');

            if (response.body) {
                (response.body as any).pipe(res);
                response.body.on('error', () => res.end());
            } else {
                res.end();
            }
        } catch (err) {
            console.error('Proxy error:', err);
            if (!res.headersSent) res.status(500).send('Erreur interne du proxy');
        }
    };
}
