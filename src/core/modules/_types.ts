/**
 * Types pour les réponses API
 */

export interface TikTokApiResponse {
    data?: {
        play?: string;
    };
}

export interface TwitterApiResponse {
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

export interface TenorApiResponse {
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

export interface GiphyApiResponse {
    data?: {
        images?: {
            original?: {
                url?: string;
            };
        };
    };
}
