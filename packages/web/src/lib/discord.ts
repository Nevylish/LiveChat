import type { User } from '@supabase/supabase-js';
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

/** Discord display name from Supabase user (skips empty global_name, falls back to @username). */
export function getDiscordDisplayName(user: User | null | undefined): string {
    if (!user) return 'Utilisateur';

    const discordIdentity = user.identities?.find((identity) => identity.provider === 'discord');
    const identityData = (discordIdentity ?? user.identities?.[0])?.identity_data as
        | {
              global_name?: string;
              full_name?: string;
              name?: string;
              preferred_username?: string;
              custom_claims?: { global_name?: string };
          }
        | undefined;

    const metadata = user.user_metadata as {
        global_name?: string;
        full_name?: string;
        name?: string;
        preferred_username?: string;
        custom_claims?: { global_name?: string };
    };

    return (
        firstNonEmpty(
            identityData?.custom_claims?.global_name,
            identityData?.global_name,
            identityData?.full_name,
            identityData?.name,
            identityData?.preferred_username,
            metadata?.global_name,
            metadata?.custom_claims?.global_name,
            metadata?.full_name,
            metadata?.name,
            metadata?.preferred_username,
            user.email,
        ) ?? 'Utilisateur'
    );
}

/** Discord avatar URL from Supabase user metadata. */
export function getDiscordAvatarUrl(user: User | null | undefined): string {
    const discordIdentity = user?.identities?.find((identity) => identity.provider === 'discord');
    const identityData = (discordIdentity ?? user?.identities?.[0])?.identity_data as
        | { avatar_url?: string; picture?: string }
        | undefined;
    const metadata = user?.user_metadata as { avatar_url?: string; picture?: string } | undefined;

    return (
        firstNonEmpty(metadata?.avatar_url, metadata?.picture, identityData?.avatar_url, identityData?.picture) ??
        DISCORD_DEFAULT_AVATAR
    );
}

export function isGuildAdmin(guild: GuildPermissions): boolean {
    if (guild.owner) return true;

    const permissions = Number.parseInt(guild.permissions, 10);
    if (Number.isNaN(permissions)) return false;

    return (permissions & ADMINISTRATOR) === ADMINISTRATOR || (permissions & MANAGE_GUILD) === MANAGE_GUILD;
}
