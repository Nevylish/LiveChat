interface GiphyApiResponse {
    data?: {
        images?: {
            original?: {
                url?: string;
            };
        };
    };
}

interface TenorApiResponse {
    results?: Array<{
        media_formats?: {
            gif?: {
                url?: string;
            };
            mediumgif?: {
                url?: string;
            };
            tinygif?: {
                url?: string;
            };
            mp4?: {
                url?: string;
            };
        };
    }>;
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

export { GiphyApiResponse, TenorApiResponse, TikTokApiResponse, TwitterApiResponse };
