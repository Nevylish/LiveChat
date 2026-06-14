import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import DiscordClient from '../../DiscordClient';
import { Functions } from '../../utils/Functions';
import { Logger } from '../../utils/Logger';
import { TargetsManager } from '../../utils/Targets';

export const execute = async (client: DiscordClient, interaction: ChatInputCommandInteraction): Promise<void> => {
    const target = interaction.options.getString('cible', true) as string;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (target === TargetsManager.EVERYONE_SKIP_LABEL) {
        await skipEveryone(client, interaction);
        return;
    }

    await skipTarget(client, interaction, target);
};

const skipEveryone = async (client: DiscordClient, interaction: ChatInputCommandInteraction): Promise<void> => {
    const streamers = client.livechat.getConnectedStreamersByGuild(interaction.guildId);

    if (!streamers.length) {
        const embed = Functions.buildEmbed(`Aucun streameur n'est connecté à LiveChat.`, 'Error');
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    try {
        client.livechat.io.to(streamers.map((s) => s.socketId)).emit('skip');

        const streamsList = TargetsManager.buildStreamersList(streamers);
        const embed = Functions.buildEmbed(
            `### LiveChat passé au suivant sur tous les streams\n${streamsList}`,
            'Good',
        );

        await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
        Logger.error('SkipCommand', `Error while skipping to next LiveChat for everyone`, {
            from: interaction.user.tag,
            guildId: interaction.guildId,
            guild: interaction.guild?.name,
            error: err,
        });
        const embed = Functions.buildEmbed(`${err.message}`, 'Error');
        await interaction.editReply({ embeds: [embed] });
    }
};

const skipTarget = async (
    client: DiscordClient,
    interaction: ChatInputCommandInteraction,
    target: string,
): Promise<void> => {
    const streamerData = client.livechat.getStreamerData(target, interaction.guildId);

    if (!streamerData) {
        const embed = Functions.buildEmbed(`**${target}** n'est pas connecté à LiveChat.`, 'Error');
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    try {
        client.livechat.io.to(streamerData.socketId).emit('skip');

        const embed = Functions.buildEmbed(
            `### LiveChat passé au suivant sur le stream de ${target}` +
                `\n\n➜ [**Rejoindre le stream de ${target}**](https://twitch.tv/${target})`,
            'Good',
        );

        await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
        Logger.error('SkipCommand', `Error while skipping to next LiveChat for ${target}`, {
            from: interaction.user.tag,
            guildId: interaction.guildId,
            guild: interaction.guild?.name,
            error: err,
        });
        const embed = Functions.buildEmbed(`${err.message}`, 'Error');
        await interaction.editReply({ embeds: [embed] });
    }
};
