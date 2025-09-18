/*
 * Copyright (C) 2025 LiveChat by Nevylish
 */

import { ApplicationCommandOptionType, AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import Command from './Command';
import DiscordClient from '../DiscordClient';
import { Logger } from '../utils/Logger';
import { Tenor } from '../modules/Tenor';
import { Functions } from '../utils/Functions';
import { Twitter } from '../modules/Twitter';

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
                        'Lien du média à afficher. Formats acceptés: mp4,webm,mkv,mov,mp3,wav,ogg,jpg,jpeg,png,gif,tenor.',
                    required: true,
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
            ],
        });
    }

    async onAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'cible') {
            const streamers = Array.from(this.client.livechat.connectedStreamers.entries())
                .filter(([_, data]) => data.guildId === interaction.guildId)
                .map(([streamer]) => streamer);

            const filtered = streamers.filter((streamer) =>
                streamer.toLowerCase().includes(focusedOption.value.toLowerCase()),
            );

            await interaction.respond(filtered.map((streamer) => ({ name: streamer, value: streamer })));
        }
    }

    async onExecute(interaction: ChatInputCommandInteraction): Promise<void> {
        const target = interaction.options.getString('cible') as string;
        let url = interaction.options.getString('url') as string;
        const text = (interaction.options.getString('texte') as string) ?? null;
        let fullscreen = (interaction.options.getBoolean('fullscreen') as boolean) ?? false;

        await interaction.deferReply({ ephemeral: true });

        let parsedUrl: URL;

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

        if (Twitter.isStatusUrl(url)) {
            const directUrl = await Twitter.parseDirectUrl(url);
            if (!directUrl) {
                const embed = Functions.buildEmbed(
                    "Impossible de récupérer le média de ce Tweet. Vérifiez le lien.",
                    'Alert',
                );
                await interaction.editReply({ embeds: [embed] });
                return;
            }
            url = directUrl;
        }

        if (Tenor.isShortenedUrl(url)) {
            const directUrl = await Tenor.fetchDirectUrl(url);
            if (!directUrl) {
                const embed = Functions.buildEmbed(
                    'Impossible de récupérer le GIF depuis Tenor. Vérifiez le lien.',
                    'Alert',
                );
                await interaction.editReply({ embeds: [embed] });
                return;
            }
            url = directUrl;
        }

        const extension = parsedUrl.pathname.split('.').pop()?.toLowerCase();
        const supportedFormats = ['mp4', 'webm', 'mkv', 'mov', 'mp3', 'wav', 'ogg', 'jpg', 'jpeg', 'png', 'gif'];

        if (
            (!extension || !supportedFormats.includes(extension)) && 
            !Tenor.validateDirectUrl(url) && 
            !Twitter.validateDirectUrl(url)
        ) {
            const embed = Functions.buildEmbed(
                `Format de fichier non supporté. Formats acceptés: ${supportedFormats.join(', ')}.\nLes liens Tenor sont également acceptés.`,
                'Alert',
            );
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const streamerData = this.client.livechat.connectedStreamers.get(target);
        if (!streamerData || streamerData.guildId !== interaction.guildId) {
            const embed = Functions.buildEmbed(`${target} n'est pas connecté sur ce serveur.`, 'Alert');
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        try {
            let filetype = Functions.getFileType(url);
            
            if ("Audio".includes(filetype)) fullscreen = true;

            this.client.livechat.io.to(streamerData.socketId).emit('broadcast', {
                content: url,
                from: interaction.user,
                fullscreen,
                text,
            });

            const embed = Functions.buildEmbed(
                `### LiveChat envoyé sur le stream de ${target}` +
                    `\n\nType de fichier: **${filetype}${text ? ' + Texte' : ''}${fullscreen && !"Audio".includes(filetype) ? ' en plein écran' : ''}**` +
                    `\n\n➜ [**Appuyez ici pour rejoindre le stream de ${target}**](https://twitch.tv/${target})`,
                'Good',
            );
            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            Logger.error('LiveChatCommand', err.message);
            const embed = Functions.buildEmbed(
                `Une erreur est survenue lors de l'envoi du LiveChat.\n${err.message}`,
                'Error',
            );
            await interaction.editReply({ embeds: [embed] });
        }
    }
}
