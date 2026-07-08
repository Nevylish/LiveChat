import { Attachment, ChatInputCommandInteraction } from 'discord.js';
import DiscordClient from '../../DiscordClient';
import { Discord } from '../../modules/Discord';
import { Giphy } from '../../modules/Giphy';
import { Instagram } from '../../modules/Instagram';
import { Tenor } from '../../modules/Tenor';
import { Router } from '../../modules/_Router';
import { Functions } from '../../utils/Functions';
import { Logger } from '../../utils/Logger';
import { ProxyService } from '../../utils/ProxyService';
import { TargetsManager } from '../../utils/Targets';
import { setupSkipButton } from '../SkipButton';

export const execute = async (client: DiscordClient, interaction: ChatInputCommandInteraction): Promise<void> => {
    const target = interaction.options.getString('cible', true) as string;
    let url = interaction.options.getString('url') as string;
    const file = interaction.options.getAttachment('fichier') as Attachment;
    const text = (interaction.options.getString('texte') as string) ?? null;
    const fullscreen = (interaction.options.getBoolean('fullscreen') as boolean) ?? false;
    const anonymous = (interaction.options.getBoolean('anonyme') as boolean) ?? false;

    if (!url && !file) {
        const embed = Functions.buildEmbed('Vous devez fournir un lien ou un fichier.', 'Alert');
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    url = file?.url ?? url;

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch (err) {
        Logger.error('MediaCommand', 'Error while parsing URL', {
            from: interaction.user.tag,
            guildId: interaction.guildId,
            guild: interaction.guild?.name,
            url,
            error: err,
        });

        const embed = Functions.buildEmbed(
            "L'URL est invalide, seuls les liens commençant par http:// ou https:// sont acceptés.",
            'Alert',
        );
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
        const embed = Functions.buildEmbed(
            "L'URL est invalide, seuls les liens commençant par http:// ou https:// sont acceptés.",
            'Error',
        );
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    const [targets, platformResult] = await Promise.all([
        TargetsManager.validateAndGetTargets(
            client,
            interaction,
            target,
            TargetsManager.EVERYONE_OPTION_LABEL,
        ),
        Router.route(url),
    ]);
    if (!targets) return;
    if (platformResult.error) {
        const embed = Functions.buildEmbed(platformResult.error, 'Alert');
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    url = platformResult.url || url;
    const bypassProxy = platformResult.bypassProxy;

    const extension = parsedUrl.pathname.split('.').pop()?.toLowerCase();
    const supportedFormats = ['mp4', 'webm', 'mkv', 'mov', 'mp3', 'wav', 'ogg', 'jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (
        (!extension || !supportedFormats.includes(extension)) &&
        !Discord.isDiscordUrl(url) &&
        !Giphy.validateDirectUrl(url) &&
        !Instagram.validateDirectUrl(url) &&
        !Tenor.validateDirectUrl(url) &&
        !ProxyService.isProxyUrl(url)
    ) {
        const embed = Functions.buildEmbed(
            `Format de fichier non supporté. Formats acceptés: ${supportedFormats.join(', ')}.` +
                `\n\nLes liens Tiktok, Twitter, Tenor, Giphy et Discord sont également acceptés.`,
            'Alert',
        );
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    if (!bypassProxy && !ProxyService.isProxyUrl(url)) {
        url = ProxyService.useProxy(url);
    }

    const activeTargets = targets
        .map((t) => client.livechat.getStreamerData(t.username, t.guildId))
        .filter((t): t is TargetsManager.ConnectedStreamer => t !== undefined);

    if (!activeTargets.length) {
        const embed =
            target === TargetsManager.EVERYONE_OPTION_LABEL
                ? Functions.buildEmbed("Aucun streameur n'est connecté à LiveChat.", 'Error')
                : Functions.buildEmbed(`**${target}** n'est pas connecté à LiveChat.`, 'Error');
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    await broadcast(client, interaction, activeTargets, url, fullscreen, anonymous, text);
};

const broadcast = async (
    client: DiscordClient,
    interaction: ChatInputCommandInteraction,
    targets: TargetsManager.ConnectedStreamer[],
    url: string,
    fullscreen: boolean,
    anonymous: boolean,
    text: string | null,
): Promise<void> => {
    try {
        const filetype = Functions.getMediaType(url);
        const adjustedFullscreen = filetype.param === 'audio' ? true : fullscreen;
        const isEveryone = targets.length > 1;

        const streamsList = TargetsManager.buildStreamersList(targets);
        const fileTypeDescription = buildFileTypeDescription(filetype, text, fullscreen, anonymous);

        const targetUsername = Functions.escapeMarkdown(targets[0].username);

        const embed = Functions.buildEmbed(
            `### LiveChat envoyé ${isEveryone ? 'à tous les streameurs connectés' : `sur le stream de ${targetUsername}`}` +
                `\n\nType de fichier: **${fileTypeDescription}**` +
                `\n\n${streamsList}`,
            'Good',
        );

        const socketIds = targets.map((s) => s.socketId);

        await setupSkipButton(client, interaction, embed, filetype.param, socketIds);

        const payload = {
            content: url,
            from: interaction.user,
            fullscreen: adjustedFullscreen,
            anonymous,
            text,
            interactionId: interaction.id,
        };

        if (isEveryone) {
            client.livechat.io.to(interaction.guildId!).emit('broadcast', payload);
        } else {
            client.livechat.io.to(socketIds[0]).emit('broadcast', payload);
        }

        Logger.success(
            'MediaCommand',
            `LiveChat sent to ${isEveryone ? `everyone (${targets.length} targets)` : targets[0].username}`,
            {
                from: interaction.user.tag,
                type: filetype.display,
                guildId: interaction.guildId,
                guild: interaction.guild?.name,
            },
        );
    } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        Logger.error('MediaCommand', 'Error while broadcasting LiveChat', {
            from: interaction.user.tag,
            guildId: interaction.guildId,
            guild: interaction.guild?.name,
            error: err,
        });
        const embed = Functions.buildEmbed(
            `Une erreur est survenue lors de l'envoi du LiveChat.\n${errorObj.message}`,
            'Error',
        );
        await interaction.editReply({ embeds: [embed] });
    }
};

const buildFileTypeDescription = (
    filetype: { display: string; param: string },
    text: string | null,
    fullscreen: boolean,
    anonymous: boolean,
): string => {
    let description = filetype.display;
    if (text) description += ' + Texte';
    if (fullscreen && filetype.param !== 'audio') description += ' en plein écran';
    if (anonymous) description += ' anonyme';
    return description;
};
