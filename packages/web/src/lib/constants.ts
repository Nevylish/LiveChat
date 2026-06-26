export const IS_LOCAL_DEV = window.location.hostname === 'localhost';

export const API_BASE_URL = IS_LOCAL_DEV ? 'http://localhost:3000' : 'https://livechat-api.nevylish.fr';

/** v2 overlay URL used by the config dashboard and Discord bot. */
export const OVERLAY_V2_BASE_URL = IS_LOCAL_DEV
    ? 'http://localhost:4000/v2/overlay'
    : 'https://livechat.nevylish.fr/v2/overlay.html';

export function buildOverlayLink(token: string): string {
    return `${OVERLAY_V2_BASE_URL}?token=${encodeURIComponent(token)}`;
}
