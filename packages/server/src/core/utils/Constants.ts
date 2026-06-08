export namespace Constants {
    export const getHostname = (): string => process.env.DOMAIN || 'localhost';

    export const getPort = (): string => process.env.LIVECHAT_PORT || '3000';

    export const getBaseUrl = (): string => {
        if (getHostname().includes('localhost')) return `http://${getHostname()}:${getPort()}`;
        return `https://${getHostname()}`;
    };

    export const getApiPath = (): string => `${getBaseUrl()}/api`;
}
