import type { DiscordGuild } from '@livechat/types';

const ADMINISTRATOR = 0x8;
const MANAGE_GUILD = 0x20;

type GuildPermissions = Pick<DiscordGuild, 'owner' | 'permissions'>;

export function isGuildAdmin(guild: GuildPermissions): boolean {
    if (guild.owner) return true;

    const permissions = Number.parseInt(guild.permissions, 10);
    if (Number.isNaN(permissions)) return false;

    return (permissions & ADMINISTRATOR) === ADMINISTRATOR || (permissions & MANAGE_GUILD) === MANAGE_GUILD;
}
