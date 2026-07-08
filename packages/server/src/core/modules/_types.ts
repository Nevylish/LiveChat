interface GiphyApiResponse {
    data?: {
        images?: {
            original?: {
                url?: string;
            };
        };
    };
}

interface TikTokApiResponse {
    data?: {
        play?: string;
    };
}

interface TwitterApiResponse {
    tweet?: {
        media?: {
            all?: Array<{
                url?: string;
            }>;
        };
        quote?: {
            media?: {
                all?: Array<{
                    url?: string;
                }>;
            };
        };
    };
}

export { GiphyApiResponse, TikTokApiResponse, TwitterApiResponse };
