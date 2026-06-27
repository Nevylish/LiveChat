import type DiscordClient from '../DiscordClient';

export interface GuildMemberLabel {
    username: string;
    displayName: string;
}

export async function resolveGuildMemberLabels(
    discordClient: DiscordClient,
    guildId: string,
    userIds: string[],
): Promise<Map<string, GuildMemberLabel>> {
    const labels = new Map<string, GuildMemberLabel>();
    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    if (uniqueIds.length === 0) return labels;

    const guild =
        discordClient.guilds.cache.get(guildId) ?? (await discordClient.guilds.fetch(guildId).catch(() => null));
    if (!guild) return labels;

    const assign = (id: string, member: { user: { username: string }; displayName: string }) => {
        labels.set(id, {
            username: member.user.username,
            displayName: member.displayName,
        });
    };

    try {
        const members = await guild.members.fetch({ user: uniqueIds });
        for (const [id, member] of members) {
            assign(id, member);
        }
    } catch {
        await Promise.all(
            uniqueIds.map(async (id) => {
                const member = await guild.members.fetch(id).catch(() => null);
                if (member) assign(id, member);
            }),
        );
    }

    return labels;
}
