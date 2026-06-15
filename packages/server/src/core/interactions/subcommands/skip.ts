import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import DiscordClient from '../../DiscordClient';
import { Functions } from '../../utils/Functions';
import { Logger } from '../../utils/Logger';
import { TargetsManager } from '../../utils/Targets';

type ConnectedStreamer = { socketId: string; username: string; guildId: string };

export const execute = async (client: DiscordClient, interaction: ChatInputCommandInteraction): Promise<void> => {
    const target = interaction.options.getString('cible', true) as string;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (target === TargetsManager.EVERYONE_SKIP_LABEL) {
        const streamers = client.livechat.getConnectedStreamersByGuild(interaction.guildId);
        if (!streamers.length) {
            const embed = Functions.buildEmbed(`Aucun streameur n'est connecté à LiveChat.`, 'Error');
            await interaction.editReply({ embeds: [embed] });
            return;
        }
        await emitSkip(client, interaction, streamers);
    } else {
        const streamerData = client.livechat.getStreamerData(target, interaction.guildId);
        if (!streamerData) {
            const embed = Functions.buildEmbed(`**${target}** n'est pas connecté à LiveChat.`, 'Error');
            await interaction.editReply({ embeds: [embed] });
            return;
        }
        await emitSkip(client, interaction, [streamerData]);
    }
};

const emitSkip = async (
    client: DiscordClient,
    interaction: ChatInputCommandInteraction,
    targets: ConnectedStreamer[],
): Promise<void> => {
    try {
        const isEveryone = targets.length > 1;

        if (isEveryone) {
            client.livechat.io.to(interaction.guildId).emit('skip');
        } else {
            client.livechat.io.to(targets[0].socketId).emit('skip');
        }

        const streamsList = TargetsManager.buildStreamersList(targets);
        const embed = Functions.buildEmbed(
            isEveryone
                ? `### LiveChat passé au suivant sur tous les streams\n${streamsList}`
                : `### LiveChat passé au suivant sur le stream de ${targets[0].username}` +
                      `\n\n➜ [**Rejoindre le stream de ${targets[0].username}**](https://twitch.tv/${targets[0].username})`,
            'Good',
        );

        await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
        Logger.error('SkipCommand', 'Error while skipping to next LiveChat', {
            from: interaction.user.tag,
            guildId: interaction.guildId,
            guild: interaction.guild?.name,
            error: err,
        });
        const embed = Functions.buildEmbed(`${err.message}`, 'Error');
        await interaction.editReply({ embeds: [embed] });
    }
};
