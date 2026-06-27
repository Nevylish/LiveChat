import { ChatInputCommandInteraction } from 'discord.js';
import DiscordClient from '../../DiscordClient';
import { Functions } from '../../utils/Functions';
import { Logger } from '../../utils/Logger';
import { TargetsManager } from '../../utils/Targets';

type OverlayQueueEvent = 'skip' | 'clear';

interface OverlayQueueActionConfig {
    event: OverlayQueueEvent;
    logSource: string;
    logMessage: string;
    everyoneTitle: string;
    singleTitle: (targetUsername: string, twitchUsername: string) => string;
}

export async function executeOverlayQueueAction(
    client: DiscordClient,
    interaction: ChatInputCommandInteraction,
    targets: TargetsManager.ConnectedStreamer[],
    config: OverlayQueueActionConfig,
): Promise<void> {
    try {
        const isEveryone = targets.length > 1;

        if (isEveryone) {
            client.livechat.io.to(interaction.guildId!).emit(config.event);
        } else {
            client.livechat.io.to(targets[0].socketId).emit(config.event);
        }

        const streamsList = TargetsManager.buildStreamersList(targets);
        const targetUsername = Functions.escapeMarkdown(targets[0].username);
        const embed = Functions.buildEmbed(
            isEveryone
                ? `${config.everyoneTitle}\n${streamsList}`
                : config.singleTitle(targetUsername, targets[0].username),
            'Good',
        );

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        Logger.error(config.logSource, config.logMessage, {
            from: interaction.user.tag,
            guildId: interaction.guildId,
            guild: interaction.guild?.name,
            error: err,
        });
        const embed = Functions.buildEmbed(`${errorObj.message}`, 'Error');
        await interaction.editReply({ embeds: [embed] });
    }
}
