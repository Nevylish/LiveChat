import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import DiscordClient from '../../DiscordClient';
import { Functions } from '../../utils/Functions';
import { Logger } from '../../utils/Logger';
import { TargetsManager } from '../../utils/Targets';

export const execute = async (client: DiscordClient, interaction: ChatInputCommandInteraction): Promise<void> => {
    const target = interaction.options.getString('cible', true) as string;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (target === TargetsManager.EVERYONE_CLEAR_LABEL) {
        await stopEveryone(client, interaction);
        return;
    }

    await stopTarget(client, interaction, target);
};

const stopEveryone = async (client: DiscordClient, interaction: ChatInputCommandInteraction): Promise<void> => {
    const streamers = client.livechat.getConnectedStreamersByGuild(interaction.guildId);

    if (!streamers.length) {
        const embed = Functions.buildEmbed(`Aucun streameur n'est connecté à LiveChat.`, 'Error');
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    try {
        client.livechat.io.to(interaction.guildId).emit('clear');

        const streamsList = TargetsManager.buildStreamersList(streamers);
        const embed = Functions.buildEmbed(
            `### LiveChat arrêté et file d'attente vidée sur tous les streams\n${streamsList}`,
            'Good',
        );

        await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
        Logger.error('StopCommand', `Error while stopping LiveChat for everyone`, {
            from: interaction.user.tag,
            guildId: interaction.guildId,
            guild: interaction.guild?.name,
            error: err,
        });
        const embed = Functions.buildEmbed(`${err.message}`, 'Error');
        await interaction.editReply({ embeds: [embed] });
    }
};

const stopTarget = async (
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
        client.livechat.io.to(streamerData.socketId).emit('clear');

        const embed = Functions.buildEmbed(
            `### LiveChat arrêté et file d'attente vidée sur le stream de ${target}` +
                `\n\n➜ [**Rejoindre le stream de ${target}**](https://twitch.tv/${target})`,
            'Good',
        );

        await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
        Logger.error('StopCommand', `Error while stopping LiveChat for ${target}`, {
            from: interaction.user.tag,
            guildId: interaction.guildId,
            guild: interaction.guild?.name,
            error: err,
        });
        const embed = Functions.buildEmbed(`${err.message}`, 'Error');
        await interaction.editReply({ embeds: [embed] });
    }
};
