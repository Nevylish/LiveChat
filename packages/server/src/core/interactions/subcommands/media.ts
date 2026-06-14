import { Attachment, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import DiscordClient from '../../DiscordClient';
import { Discord } from '../../modules/Discord';
import { Giphy } from '../../modules/Giphy';
import { Instagram } from '../../modules/Instagram';
import { Tenor } from '../../modules/Tenor';
import { ProxyService } from '../../modules/_ProxyService';
import { Router } from '../../modules/_Router';
import { Functions } from '../../utils/Functions';
import { Logger } from '../../utils/Logger';
import { TargetsManager } from '../../utils/Targets';
import { setupSkipButton } from '../SkipButton';

export const execute = async (client: DiscordClient, interaction: ChatInputCommandInteraction): Promise<void> => {
    const target = interaction.options.getString('cible', true) as string;
    let url = interaction.options.getString('url') as string;
    let file = interaction.options.getAttachment('fichier') as Attachment;
    const text = (interaction.options.getString('texte') as string) ?? null;
    let fullscreen = (interaction.options.getBoolean('fullscreen') as boolean) ?? false;
    const anonymous = (interaction.options.getBoolean('anonyme') as boolean) ?? false;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let parsedUrl: URL;
    let bypassProxy = false;

    if (!url && !file) {
        const embed = Functions.buildEmbed('Vous devez fournir un lien ou un fichier.', 'Alert');
        embed.setImage(
            'https://cdn.discordapp.com/attachments/1465389192384217118/1465389287825604658/livechat.gif?ex=6978ed9f&is=69779c1f&hm=f6648976eaf58ae153da91c2aabb5d7d8ac33842185bedaca7289f367534f639&',
        );
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    url = file?.url ?? url;

    try {
        parsedUrl = new URL(url);
    } catch {
        const embed = Functions.buildEmbed(
            "Le lien n'est pas valide.\nVous devez fournir une URL commençant par http:// ou https://.",
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

    const platformResult = await Router.route(url);
    if (platformResult.error) {
        const embed = Functions.buildEmbed(platformResult.error, 'Alert');
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    url = platformResult.url;
    bypassProxy = platformResult.bypassProxy;

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

    if (target === TargetsManager.EVERYONE_OPTION_LABEL) {
        await broadcastToEveryone(client, interaction, url, fullscreen, anonymous, text);
        return;
    }

    await broadcastToTarget(client, interaction, target, url, fullscreen, anonymous, text);
};

const broadcastToEveryone = async (
    client: DiscordClient,
    interaction: ChatInputCommandInteraction,
    url: string,
    fullscreen: boolean,
    anonymous: boolean,
    text: string,
) => {
    const streamers = client.livechat.getConnectedStreamersByGuild(interaction.guildId);

    if (!streamers.length) {
        const embed = Functions.buildEmbed(`Aucun streameur n'est connecté à LiveChat.`, 'Error');
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    try {
        const filetype = Functions.getMediaType(url);
        const adjustedFullscreen = filetype.param === 'audio' ? true : fullscreen;

        const streamsList = TargetsManager.buildStreamersList(streamers);
        const fileTypeDescription = buildFileTypeDescription(filetype, text, fullscreen, anonymous);

        const embed = Functions.buildEmbed(
            `### LiveChat envoyé à tous les streameurs connectés` +
                `\n\nType de fichier: **${fileTypeDescription}**` +
                `\n\n${streamsList}`,
            'Good',
        );

        await setupSkipButton(
            client,
            interaction,
            embed,
            filetype.param,
            url,
            streamers.map((s) => s.socketId),
        );

        client.livechat.io.to(streamers.map((s) => s.socketId)).emit('broadcast', {
            content: url,
            from: interaction.user,
            fullscreen: adjustedFullscreen,
            anonymous,
            text,
            interactionId: interaction.id,
        });

        Logger.success('LiveChat', `Média envoyé à ${streamers.length} streameur(s)`, {
            de: interaction.user.tag,
            type: filetype.display,
            guild: interaction.guildId,
        });
    } catch (err: any) {
        Logger.error('LiveChatCommand', err.message);
        const embed = Functions.buildEmbed(
            `Une erreur est survenue lors de l'envoi du LiveChat.\n${err.message}`,
            'Error',
        );
        await interaction.editReply({ embeds: [embed] });
    }
};

const broadcastToTarget = async (
    client: DiscordClient,
    interaction: ChatInputCommandInteraction,
    target: string,
    url: string,
    fullscreen: boolean,
    anonymous: boolean,
    text: string,
) => {
    const streamerData = client.livechat.getStreamerData(target, interaction.guildId);

    if (!streamerData) {
        const embed = Functions.buildEmbed(`**${target}** n'est pas connecté à LiveChat.`, 'Error');
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    try {
        const filetype = Functions.getMediaType(url);
        const adjustedFullscreen = filetype.param === 'audio' ? true : fullscreen;

        const streamsList = TargetsManager.buildStreamersList([streamerData]);
        const fileTypeDescription = buildFileTypeDescription(filetype, text, fullscreen, anonymous);

        const embed = Functions.buildEmbed(
            `### LiveChat envoyé sur le stream de ${target}` +
                `\n\nType de fichier: **${fileTypeDescription}**` +
                `\n\n${streamsList}`,
            'Good',
        );

        await setupSkipButton(client, interaction, embed, filetype.param, url, [streamerData.socketId]);

        client.livechat.io.to(streamerData.socketId).emit('broadcast', {
            content: url,
            from: interaction.user,
            fullscreen: adjustedFullscreen,
            anonymous,
            text,
            interactionId: interaction.id,
        });

        Logger.success('LiveChat', `Média envoyé à ${target}`, {
            from: interaction.user.tag,
            type: filetype.display,
            guildId: interaction.guildId,
        });
    } catch (err: any) {
        Logger.error('LiveChatCommand', err.message);
        const embed = Functions.buildEmbed(
            `Une erreur est survenue lors de l'envoi du LiveChat.\n${err.message}`,
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
