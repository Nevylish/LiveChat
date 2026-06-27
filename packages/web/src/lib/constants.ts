export const IS_LOCAL_DEV = window.location.hostname === 'localhost';

export const API_BASE_URL = IS_LOCAL_DEV ? 'http://localhost:3000' : 'https://livechat-api.nevylish.fr';

/** v2 overlay URL used by the config dashboard and Discord bot. */
export const OVERLAY_V2_BASE_URL = IS_LOCAL_DEV
    ? 'http://localhost:4000/v2/overlay'
    : 'https://livechat.nevylish.fr/v2/overlay.html';

export function buildOverlayLink(token: string): string {
    return `${OVERLAY_V2_BASE_URL}?token=${encodeURIComponent(token)}`;
}

/** Discord application ID (VITE_ prefix required for web; server reads the same .env key). */
export const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID as string | undefined;

const BOT_INVITE_PERMISSIONS = '1049600';

export function buildBotInviteUrl(guildId: string): string {
    if (!DISCORD_CLIENT_ID) {
        throw new Error('VITE_DISCORD_CLIENT_ID is not configured');
    }
    const params = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        permissions: BOT_INVITE_PERMISSIONS,
        scope: 'bot',
        guild_id: guildId,
        disable_guild_select: 'true',
    });
    return `https://discord.com/oauth2/authorize?${params.toString()}`;
}
