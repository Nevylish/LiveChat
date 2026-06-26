/** Discord role as returned by `GET /api/guild/roles`. */
export interface DiscordRole {
    id: string;
    name: string;
    color: string;
    managed: boolean;
}

/**
 * Discord guild from OAuth, enriched by the config dashboard
 * (`hasBot`, `overlayCount` are computed client-side).
 */
export interface DiscordGuild {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
    hasBot?: boolean;
    overlayCount?: number;
}
