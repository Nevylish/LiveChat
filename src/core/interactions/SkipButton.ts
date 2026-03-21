import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import getVideoDuration from 'get-video-duration';
import DiscordClient from '../DiscordClient';
import { Functions } from '../utils/Functions';
import { Logger } from '../utils/Logger';

const defaultSkipButtonTime: number = 15;
const defaultImageDuration: number = 8;

export const buildSkipButton = async (
    client: DiscordClient,
    interaction: ChatInputCommandInteraction,
    embed: EmbedBuilder,
    fileType: string,
    url: string,
    socketIds: string[],
) => {
    let duration = fileType === 'image' ? defaultImageDuration * 1000 : defaultSkipButtonTime * 1000;

    if (fileType === 'video' || fileType === 'audio') {
        duration =
            (await getVideoDuration(url, process.env.FFPROBE_PATH).catch((err) => {
                Logger.error('LiveChatCommand', '(addSkipButton.getVideoDuration)', err);
                return defaultSkipButtonTime;
            })) * 1000;
    }

    const skipButton = new ButtonBuilder()
        .setCustomId('skip_' + interaction.id)
        .setLabel("En file d'attente...")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(skipButton);
    // const premiumButton = await Functions.buildPremiumButton(client, interaction.guildId);
    // if (premiumButton) row.addComponents(premiumButton);

    await interaction.editReply({ embeds: [embed], components: [row] });

    const collector = interaction.channel.createMessageComponentCollector({
        filter: (i) => i.customId === 'skip_' + interaction.id,
        time: 60 * 60 * 1000,
    });

    let refreshInterval: NodeJS.Timeout;
    let startTime: number;
    let isSkipped = false;
    let hasStarted = false;
    let hasEnded = false;

    const cleanup = () => {
        client.livechat.off('started', onStarted);
        client.livechat.off('ended', onEnded);
        if (refreshInterval) clearInterval(refreshInterval);
    };

    const onStarted = (id: string) => {
        if (id !== interaction.id || hasStarted) return;
        hasStarted = true;

        startTime = Date.now();
        skipButton.setDisabled(false);
        skipButton.setLabel(`Passer le LiveChat (${Functions.msToFormattedString(duration)})`);
        interaction.editReply({ embeds: [embed], components: [row] }).catch(() => cleanup());

        refreshInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = duration - elapsed + 1000;

            if (remaining <= 0) {
                clearInterval(refreshInterval);
                if (!isSkipped) {
                    skipButton.setLabel('Le LiveChat est terminé.');
                    skipButton.setDisabled(true);
                    interaction.editReply({ embeds: [embed], components: [row] }).catch(() => cleanup());
                }
                return;
            }

            if (!isSkipped) {
                skipButton.setLabel(`Passer le LiveChat (${Functions.msToFormattedString(remaining)})`);
                interaction.editReply({ embeds: [embed], components: [row] }).catch(() => cleanup());
            }
        }, 1000);
    };

    const onEnded = (id: string) => {
        if (id !== interaction.id || hasEnded) return;
        hasEnded = true;

        cleanup();
        if (!isSkipped) {
            skipButton.setLabel('Le LiveChat est terminé.');
            skipButton.setStyle(ButtonStyle.Secondary);
        }
        skipButton.setDisabled(true);
        interaction.editReply({ embeds: [embed], components: [row] }).catch(() => {});
        collector.stop('ended');
    };

    client.livechat.on('started', onStarted);
    client.livechat.on('ended', onEnded);

    collector.on('collect', async (i) => {
        await i.deferUpdate();
        isSkipped = true;
        client.livechat.io.to(socketIds).emit('skipById', interaction.id);

        skipButton.setLabel('Vous avez passé ce LiveChat.');
        skipButton.setStyle(ButtonStyle.Success);
        skipButton.setDisabled(true);

        await interaction.editReply({ embeds: [embed], components: [row] }).catch(() => {});
    });

    collector.on('end', () => {
        cleanup();
    });
};
