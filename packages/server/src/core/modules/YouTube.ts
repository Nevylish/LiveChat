export namespace YouTube {
    export const isYouTubeUrl = (url: string): boolean => {
        return !!url.match(
            /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        );
    };
}
