export namespace Tenor {
    export const isShortenedUrl = (url: string): boolean => {
        return !!url.match(/^https?:\/\/tenor\.com\/(fr\/)?view\//);
    };

    export const validateDirectUrl = (url: string): boolean => {
        return !!url.match(/^https?:\/\/media\.tenor\.com\//);
    };
}
