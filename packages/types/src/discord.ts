/** Discord role as returned by `GET /api/guild/roles`. */
export interface DiscordRole {
    id: string;
    name: string;
    color: string;
    managed: boolean;
}

/**
 * Discord guild from OAuth, enriched by the config dashboard
 * (`hasBot`, `overlayCount`, `hasPlusSubscription` are enriched by the config dashboard).
 */
export interface DiscordGuild {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
    hasBot?: boolean;
    overlayCount?: number;
    hasPlusSubscription?: boolean;
}

export const DISCORD_DEFAULT_AVATAR_URL = 'https://cdn.discordapp.com/embed/avatars/0.png';

const DISCORD_CDN_HOST = 'cdn.discordapp.com';
const DISCORD_AVATAR_PATH =
    /^\/avatars\/\d+\/[a-zA-Z0-9_-]+\.(?:png|gif|webp|jpe?g)$|^\/embed\/avatars\/\d+\.png$/;

/** Allow only HTTPS Discord CDN avatar URLs (blocks javascript: and untrusted redirects). */
export function sanitizeDiscordAvatarUrl(url: string | null | undefined): string {
    if (!url) return DISCORD_DEFAULT_AVATAR_URL;

    try {
        const parsed = new URL(url);
        if (
            parsed.protocol === 'https:' &&
            parsed.hostname === DISCORD_CDN_HOST &&
            DISCORD_AVATAR_PATH.test(parsed.pathname)
        ) {
            return url;
        }
    } catch {
        // fall through to default
    }

    return DISCORD_DEFAULT_AVATAR_URL;
}
