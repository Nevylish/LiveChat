export namespace Instagram {
    export const isInstagramUrl = (url: string): boolean => {
        return !!url.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/);
    };

    export const validateDirectUrl = (url: string): boolean => {
        return !!url.match(/^https?:\/\/(?:[a-zA-Z0-9-.]+\.)?cdninstagram\.com\//);
    };
}
