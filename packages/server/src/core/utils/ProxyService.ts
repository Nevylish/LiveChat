import { Functions } from './Functions';
import crypto = require('crypto');

export namespace ProxyService {
    let secret: string;

    export const generateRandomSecretAndStore = (): boolean => {
        if (secret) return false;
        secret = process.env.PROXY_SECRET!;
        return true;
    };

    const getProxyBase = (): string => {
        let base = process.env.PROXY_URL!;
        if (!/^https?:\/\//i.test(base)) {
            const isLocal = base.includes('localhost') || base.includes('127.0.0.1');
            base = `${isLocal ? 'http' : 'https'}://${base}`;
        }
        return base;
    };

    export const useProxy = (url: string, source: string = 'Unknown', forceFileType: string = 'false'): string => {
        if (isProxyUrl(url)) return url;

        const expires = Math.floor(Date.now() / 1000) + 900;

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

        const proxyBase = getProxyBase();
        return `${proxyBase}?url=${encodeURIComponent(url)}&token=${token}&expires=${expires}&type=${fileType}&source=${source}`;
    };

    export const isProxyUrl = (url: string): boolean => {
        let proxyBase;
        try {
            proxyBase = getProxyBase();
        } catch {
            return false;
        }
        return (
            url.includes(proxyBase) &&
            url.includes('token=') &&
            url.includes('expires=') &&
            url.includes('type=') &&
            url.includes('source=')
        );
    };
}
