import type { AuthUser } from '@livechat/types';
import type { DiscordGuild } from '@livechat/types';

const ADMINISTRATOR = 0x8;
const MANAGE_GUILD = 0x20;

type GuildPermissions = Pick<DiscordGuild, 'owner' | 'permissions'>;

export const DISCORD_DEFAULT_AVATAR = 'https://cdn.discordapp.com/embed/avatars/0.png';
export const DISCORD_MOCKUP_FALLBACK_USERNAME = 'noobmaster69';

function firstNonEmpty(...values: (string | null | undefined)[]): string | undefined {
    for (const value of values) {
        const trimmed = value?.trim();
        if (trimmed) return trimmed;
    }
    return undefined;
}

/** Discord display name from authenticated user (skips empty global name, falls back to @username). */
export function getDiscordDisplayName(user: AuthUser | null | undefined): string {
    if (!user) return 'Utilisateur';

    if (user.globalName && user.username && user.globalName.toLowerCase() !== user.username.toLowerCase()) {
        return user.globalName;
    }

    return firstNonEmpty(user.globalName, user.username) ?? 'Utilisateur';
}

/** Discord avatar URL from authenticated user. */
export function getDiscordAvatarUrl(user: AuthUser | null | undefined): string {
    return user?.avatarUrl ?? DISCORD_DEFAULT_AVATAR;
}

export function isGuildAdmin(guild: GuildPermissions): boolean {
    if (guild.owner) return true;

    const permissions = Number.parseInt(guild.permissions, 10);
    if (Number.isNaN(permissions)) return false;

    return (permissions & ADMINISTRATOR) === ADMINISTRATOR || (permissions & MANAGE_GUILD) === MANAGE_GUILD;
}
