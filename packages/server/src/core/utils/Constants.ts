export namespace Constants {
    export const getHostname = (): string => process.env.DOMAIN!;

    export const getPort = (): string => process.env.LIVECHAT_PORT!;

    export const getBaseUrl = (): string => {
        if (getHostname().includes('localhost')) return `http://${getHostname()}:${getPort()}`;
        return `https://${getHostname()}`;
    };

    export const getApiPath = (): string => `${getBaseUrl()}/api`;

    export const getFrontendUrl = (): string => process.env.FRONTEND_URI!;

    export const getOverlayUrl = (): string => process.env.OVERLAY_URI!;

    export const getAllowedOrigins = (): string[] => [getFrontendUrl(), getOverlayUrl()];

    export const ROUTES = {
        home: '/',
        configuration: 'config',
        updates: 'updates',
        privacy: 'privacy',
        terms: 'terms',
    };

    export type ConstantRoutes = keyof typeof ROUTES;

    export const getUrl = (route: ConstantRoutes): string => {
        return `${getFrontendUrl()}/${ROUTES[route]}`;
    };
}
