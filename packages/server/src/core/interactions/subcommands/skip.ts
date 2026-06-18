import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import DiscordClient from '../../DiscordClient';
import { Functions } from '../../utils/Functions';
import { Logger } from '../../utils/Logger';
import { TargetsManager } from '../../utils/Targets';

export const execute = async (client: DiscordClient, interaction: ChatInputCommandInteraction): Promise<void> => {
    const target = interaction.options.getString('cible', true) as string;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const targets = await TargetsManager.validateAndGetTargets(
        client,
        interaction,
        target,
        TargetsManager.EVERYONE_SKIP_LABEL,
    );
    if (!targets) return;

    await emitSkip(client, interaction, targets);
};

const emitSkip = async (
    client: DiscordClient,
    interaction: ChatInputCommandInteraction,
    targets: TargetsManager.ConnectedStreamer[],
): Promise<void> => {
    try {
        const isEveryone = targets.length > 1;

        if (isEveryone) {
            client.livechat.io.to(interaction.guildId!).emit('skip');
        } else {
            client.livechat.io.to(targets[0].socketId).emit('skip');
        }

        const streamsList = TargetsManager.buildStreamersList(targets);
        const targetUsername = Functions.escapeMarkdown(targets[0].username);

        const embed = Functions.buildEmbed(
            isEveryone
                ? `### LiveChat passé au suivant sur tous les streams\n${streamsList}`
                : `### LiveChat passé au suivant sur le stream de ${targetUsername}` +
                      `\n\n➜ [**Rejoindre le stream de ${targets[0].username}**](https://twitch.tv/${targets[0].username})`,
            'Good',
        );

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        Logger.error('SkipCommand', 'Error while skipping to next LiveChat', {
            from: interaction.user.tag,
            guildId: interaction.guildId,
            guild: interaction.guild?.name,
            error: errorObj.message,
        });
        const embed = Functions.buildEmbed(`${errorObj.message}`, 'Error');
        await interaction.editReply({ embeds: [embed] });
    }
};
