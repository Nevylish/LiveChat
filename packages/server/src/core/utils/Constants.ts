export namespace Constants {
    export const getHostname = (): string => process.env.DOMAIN!;

    export const getPort = (): string => process.env.LIVECHAT_PORT!;

    export const getBaseUrl = (): string => {
        if (getHostname().includes('localhost')) return `http://${getHostname()}:${getPort()}`;
        return `https://${getHostname()}`;
    };

    export const getApiPath = (): string => `${getBaseUrl()}/api`;

    export const getFrontendUrl = (): string => {
        const host = process.env.FRONTEND_URI!;
        return host.includes('localhost') ? `http://${host}:5173` : `https://${host}`;
    };

    export const getOverlayUrl = (): string => {
        const host = getFrontendUrl();
        return host.includes('localhost') ? `http://${host}:4000` : `https://${host}`;
    };

    export const getAllowedOrigins = (): string[] => [getFrontendUrl(), getOverlayUrl(), getBaseUrl()];

    export const ROUTES = {
        home: '/',
        configuration: 'config',
        usage: 'usage',
        updates: 'updates',
        privacy: 'privacy',
        terms: 'terms',
    };

    export type ConstantRoutes = keyof typeof ROUTES;

    export const getUrl = (
        route: ConstantRoutes,
        options?: { params?: Array<{ name: string; value: string }>; hash?: string },
    ): string => {
        let url = `${getFrontendUrl()}/${ROUTES[route]}`;

        if (options?.params?.length) url += `?${options.params.map(({ name, value }) => `${name}=${value}`).join('&')}`;

        if (options?.hash) url += `#${options.hash}`;

        return url;
    };
}
