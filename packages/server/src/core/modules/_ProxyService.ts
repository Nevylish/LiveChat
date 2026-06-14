import { Request, Response } from 'express';
import * as http from 'http';
import * as https from 'https';
import fetch from 'node-fetch';
import { Constants } from '../utils/Constants';
import { Functions } from '../utils/Functions';
import { Logger } from '../utils/Logger';
import crypto = require('crypto');

export namespace ProxyService {
    let secret: string;

    const httpAgent = new http.Agent({ keepAlive: true, keepAliveMsecs: 10000 });
    const httpsAgent = new https.Agent({ keepAlive: true, keepAliveMsecs: 10000 });

    const FETCH_TIMEOUT_MS = 30_000;
    const MAX_BODY_SIZE = 650 * 1024 * 1024;

    export const generateRandomSecretAndStore = (): boolean => {
        if (secret) return false;
        secret = crypto.randomBytes(64).toString('hex');
        return true;
    };

    export const useProxy = (url: string, source: string = 'Unknown', forceFileType: string = 'false'): string => {
        if (isProxyUrl(url)) return url;

        const expires = Math.floor(Date.now() / 1000) + 3600;

        const token = crypto
            .createHmac('sha256', secret)
            .update(url + expires)
            .digest('hex');

        let fileType;

        if (forceFileType === 'false') {
            fileType = Functions.getMediaType(url).param;
        } else {
            fileType = forceFileType;
        }

        return `${Constants.getApiPath()}/proxy?url=${encodeURIComponent(url)}&token=${token}&expires=${expires}&type=${fileType}&source=${source}`;
    };

    export const isProxyUrl = (url: string): boolean => {
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
            Logger.warn('ProxyService', 'Missing parameters', { url: targetUrl, token, expires });
            return res.status(403).send('Missing parameters');
        }

        const now = Math.floor(Date.now() / 1000);
        if (now > parseInt(expires)) {
            Logger.warn('ProxyService', 'Expired link', { url: targetUrl });
            return res.status(403).send('Expired link');
        }

        const expectedToken = crypto
            .createHmac('sha256', secret)
            .update(targetUrl + expires)
            .digest('hex');

        if (token !== expectedToken) {
            Logger.warn('ProxyService', 'Invalid signature', { url: targetUrl });
            return res.status(403).send('Invalid signature');
        }

        const abortController = new AbortController();
        const fetchTimeout = setTimeout(() => abortController.abort(), FETCH_TIMEOUT_MS);

        res.on('close', () => abortController.abort());

        try {
            const urlObj = new URL(targetUrl);
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                Logger.warn('ProxyService', 'Invalid protocol', { url: targetUrl });
                return res.status(400).send('Invalid protocol');
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
                signal: abortController.signal as any,
                agent: urlObj.protocol === 'http:' ? httpAgent : httpsAgent,
            });

            clearTimeout(fetchTimeout);

            if (!response.ok) {
                Logger.warn('ProxyService', `Upstream error (502): ${response.status} ${response.statusText}`, {
                    url: targetUrl,
                });
                return res.status(502).send(`Upstream error`);
            }

            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
                Logger.warn('ProxyService', `File too large: ${contentLength} bytes`, { url: targetUrl });
                return res.status(413).send('File too large');
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
            res.setHeader('Cache-Control', 'public, max-age=3600');

            if (response.body) {
                let receivedBytes = 0;

                response.body.on('data', (chunk: Buffer) => {
                    receivedBytes += chunk.length;
                    if (receivedBytes > MAX_BODY_SIZE) {
                        Logger.warn('ProxyService', `Chunked transfer exceeded ${MAX_BODY_SIZE} bytes, aborting`, {
                            url: targetUrl,
                        });
                        abortController.abort();
                        res.end();
                    }
                });

                (response.body as any).pipe(res);
                response.body.on('error', () => res.end());
            } else {
                res.end();
            }
        } catch (err: any) {
            clearTimeout(fetchTimeout);

            if (err.name === 'AbortError') {
                if (!res.headersSent) {
                    if (res.writableEnded || res.destroyed) {
                        Logger.debug('ProxyService', 'Client disconnected, fetch aborted', { url: targetUrl });
                    } else {
                        Logger.warn('ProxyService', 'Upstream fetch timed out (504)', { url: targetUrl });
                        res.status(504).send('Upstream timeout');
                    }
                }
                return;
            }

            Logger.error('ProxyService', 'Error while proxying (500)', err);
            if (!res.headersSent) res.status(500).send('Internal Server Error');
        }
    };
}
