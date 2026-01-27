/* 
    Ce fichier permet de synchroniser des informations entre plusieurs fichiers du projet.
*/

export namespace Constants {
    export const getHostname = (): string => process.env.DOMAIN || 'localhost';

    export const getPort = (): string => process.env.LIVECHAT_PORT || '3000';

    export const getPath = (): string => {
        if (getHostname().includes('localhost')) return `http://${getHostname()}:${getPort()}`;
        return `https://${getHostname()}`;
    };

    export const getApiPath = (): string => `${getPath()}/api`;
}
