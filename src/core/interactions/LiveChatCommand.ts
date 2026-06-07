/**
 * Commande slash /livechat
 *
 * Elle permet d'envoyer un média sur une page internet, généralement une source Navigateur OBS.
 *
 * On y choisit la cible (généralement un·e streameur·euse), gérée par l'autocomplétion.
 * On y rentre ensuite une URL brute¹ vers un média (qui termine par une extension de fichier), celle-ci sera affichée sur le flux.
 *
 * ¹Exception pour les liens Tenor, Giphy et Twitter, LiveChat prend en charge les URLs raccourcies de ces plateformes. J'espère en ajouter d'autres à l'avenir.
 *
 * Puis on a des options supplémentaires:
 * - Texte: Ajoute du texte par dessus le média, centré en bas type Meme avec la police Impact.
 * - Fullscreen: Affiche le média en plein écran, utilisé en général avec des médias à fond transparent pour modifier le décors.
 */

import {
    ApplicationCommandOptionType,
    Attachment,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    MessageFlags,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import { Discord } from '../modules/Discord';
import { Giphy } from '../modules/Giphy';
import { Instagram } from '../modules/Instagram';
import { Tenor } from '../modules/Tenor';
import { ProxyService } from '../modules/_ProxyService';
import { Router } from '../modules/_Router';
import { Functions } from '../utils/Functions';
import { Logger } from '../utils/Logger';
import { TargetsManager } from '../utils/Targets';
import { setupSkipButton } from './SkipButton';
import Command from './classes/Command';

export default class LiveChatCommand extends Command {
    constructor(client: DiscordClient) {
        super(client, {
            name: 'livechat',
            description: "Lancer un LiveChat sur le stream de quelqu'un",
            dmPermission: false,
            options: [
                {
                    name: 'cible',
                    type: ApplicationCommandOptionType.String,
                    description: 'Choisissez sur quel stream vous souhaitez lancer le LiveChat',
                    autocomplete: true,
                    required: true,
                },
                {
                    name: 'url',
                    type: ApplicationCommandOptionType.String,
                    description:
                        'Lien du média à afficher. Formats acceptés: mp4,webm,mkv,mov,mp3,wav,ogg,jpg,jpeg,png,gif,webp.',
                    required: false,
                },
                {
                    name: 'fichier',
                    type: ApplicationCommandOptionType.Attachment,
                    description:
                        'Fichier à afficher. Formats acceptés: mp4,webm,mkv,mov,mp3,wav,ogg,jpg,jpeg,png,gif,webp.',
                    required: false,
                },
                {
                    name: 'texte',
                    type: ApplicationCommandOptionType.String,
                    description: 'Texte à afficher en dessous du média.',
                    required: false,
                },
                {
                    name: 'fullscreen',
                    type: ApplicationCommandOptionType.Boolean,
                    description: "Afficher le livechat sur tout l'écran du stream (16:9 horizontal)",
                    required: false,
                },
                {
                    name: 'anonyme',
                    type: ApplicationCommandOptionType.Boolean,
                    description: 'Masquer votre pseudo et votre photo de profil sur le LiveChat.',
                    required: false,
                },
            ],
        });
    }

    async onAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const suggestions = TargetsManager.getAutocompleteSuggestions(
            this.client,
            interaction,
            TargetsManager.EVERYONE_OPTION_LABEL,
        );

        await interaction.respond(suggestions.map((name) => ({ name, value: name })));
    }

    async onExecute(interaction: ChatInputCommandInteraction): Promise<void> {
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
        const supportedFormats = [
            'mp4',
            'webm',
            'mkv',
            'mov',
            'mp3',
            'wav',
            'ogg',
            'jpg',
            'jpeg',
            'png',
            'gif',
            'webp',
        ];

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
            this.broadcastToEveryone(interaction, url, fullscreen, anonymous, text);
            return;
        }

        this.broadcastToTarget(interaction, target, url, fullscreen, anonymous, text);
    }

    private async broadcastToEveryone(
        interaction: ChatInputCommandInteraction,
        url: string,
        fullscreen: boolean,
        anonymous: boolean,
        text: string,
    ) {
        const streamers = this.client.livechat.getConnectedStreamersByGuild(interaction.guildId);

        if (!streamers.length) {
            const embed = Functions.buildEmbed(`Aucun streameur n'est connecté à LiveChat.`, 'Error');
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        try {
            const filetype = Functions.getMediaType(url);
            const adjustedFullscreen = filetype.param === 'audio' ? true : fullscreen;

            const streamsList = TargetsManager.buildStreamersList(streamers);
            const fileTypeDescription = this.buildFileTypeDescription(filetype, text, fullscreen, anonymous);

            const embed = Functions.buildEmbed(
                `### LiveChat envoyé à tous les streameurs connectés` +
                    `\n\nType de fichier: **${fileTypeDescription}**` +
                    `\n\n${streamsList}`,
                'Good',
            );

            await setupSkipButton(
                this.client,
                interaction,
                embed,
                filetype.param,
                url,
                streamers.map((s) => s.socketId),
            );

            this.client.livechat.io.to(streamers.map((s) => s.socketId)).emit('broadcast', {
                content: url,
                from: interaction.user,
                fullscreen: adjustedFullscreen,
                anonymous,
                text,
                interactionId: interaction.id,
            });
        } catch (err: any) {
            Logger.error('LiveChatCommand', err.message);
            const embed = Functions.buildEmbed(
                `Une erreur est survenue lors de l'envoi du LiveChat.\n${err.message}`,
                'Error',
            );
            await interaction.editReply({ embeds: [embed] });
        }
    }

    private async broadcastToTarget(
        interaction: ChatInputCommandInteraction,
        target: string,
        url: string,
        fullscreen: boolean,
        anonymous: boolean,
        text: string,
    ) {
        const streamerData = this.client.livechat.getStreamerData(target, interaction.guildId);

        if (!streamerData) {
            const embed = Functions.buildEmbed(`**${target}** n'est pas connecté à LiveChat.`, 'Error');
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        try {
            const filetype = Functions.getMediaType(url);
            const adjustedFullscreen = filetype.param === 'audio' ? true : fullscreen;

            const streamsList = TargetsManager.buildStreamersList([streamerData]);
            const fileTypeDescription = this.buildFileTypeDescription(filetype, text, fullscreen, anonymous);

            const embed = Functions.buildEmbed(
                `### LiveChat envoyé sur le stream de ${target}` +
                    `\n\nType de fichier: **${fileTypeDescription}**` +
                    `\n\n${streamsList}`,
                'Good',
            );

            await setupSkipButton(this.client, interaction, embed, filetype.param, url, [streamerData.socketId]);

            this.client.livechat.io.to(streamerData.socketId).emit('broadcast', {
                content: url,
                from: interaction.user,
                fullscreen: adjustedFullscreen,
                anonymous,
                text,
                interactionId: interaction.id,
            });
        } catch (err: any) {
            Logger.error('LiveChatCommand', err.message);
            const embed = Functions.buildEmbed(
                `Une erreur est survenue lors de l'envoi du LiveChat.\n${err.message}`,
                'Error',
            );
            await interaction.editReply({ embeds: [embed] });
        }
    }

    private buildFileTypeDescription(
        filetype: { display: string; param: string },
        text: string | null,
        fullscreen: boolean,
        anonymous: boolean,
    ): string {
        let description = filetype.display;
        if (text) description += ' + Texte';
        if (fullscreen && filetype.param !== 'audio') description += ' en plein écran';
        if (anonymous) description += ' anonyme';
        return description;
    }
}
