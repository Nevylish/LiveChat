import { ChatInputCommandInteraction } from 'discord.js';
import DiscordClient from '../../DiscordClient';
import { TargetsManager } from '../../utils/Targets';
import { executeOverlayQueueAction } from './overlayQueueAction';

export const execute = async (client: DiscordClient, interaction: ChatInputCommandInteraction): Promise<void> => {
    const target = interaction.options.getString('cible', true);

    const targets = await TargetsManager.validateAndGetTargets(
        client,
        interaction,
        target,
        TargetsManager.EVERYONE_SKIP_LABEL,
    );
    if (!targets) return;

    await executeOverlayQueueAction(client, interaction, targets, {
        event: 'skip',
        logSource: 'SkipCommand',
        logMessage: 'Error while skipping to next LiveChat',
        everyoneTitle: '### LiveChat passé au suivant sur tous les streams',
        singleTitle: (targetUsername, twitchUsername) =>
            `### LiveChat passé au suivant sur le stream de ${targetUsername}` +
            `\n\n➜ [**Rejoindre le stream de ${twitchUsername}**](https://twitch.tv/${twitchUsername})`,
    });
};
