/*
 * Copyright (C) 2025 LiveChat by Nevylish
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { ApplicationCommandOptionType, AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import Command from './Command';
import DiscordClient from '../DiscordClient';
import { Logger } from '../modules/Logger';
import fetch from 'node-fetch';

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
                    description: 'Lien du média à afficher. Formats acceptés: mp4,webm,mkv,mov,mp3,wav,ogg,jpg,jpeg,png,gif,tenor.',
                    required: true,
                },
                {
                    name: 'fullscreen',
                    type: ApplicationCommandOptionType.Boolean,
                    description: "Afficher le livechat sur tout l'écran du stream (16:9 horizontal)",
                    required: false,
                },
                {
                    name: 'texte',
                    type: ApplicationCommandOptionType.String,
                    description: 'Texte à afficher en dessous du média.',
                    required: false,
                }
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

    /**
     * Récupère l'URL brute du GIF à partir d'un lien Tenor.
     * @param {string} tenorUrl Lien Tenor
     * @returns {Promise<string|null>} Lien brut
     */
    async getTenorDirectUrl(tenorUrl: string): Promise<string | null> {
        try {
            const regex = /tenor\.com\/(?:view|fr\/view)\/[a-zA-Z0-9\-]+-(\d+)/;
            const match = tenorUrl.match(regex);
            if (!match || !match[1]) return null;
            const gifId = match[1];

            const apiKey = process.env.TENOR_API_KEY;
            const apiUrl = `https://tenor.googleapis.com/v2/posts?ids=${gifId}&key=${apiKey}`;

            const response = await fetch(apiUrl);
            if (!response.ok) return null;
            const data = await response.json();

            if (
                typeof data === 'object' &&
                data !== null &&
                Array.isArray((data as any).results) &&
                (data as any).results[0] &&
                (data as any).results[0].media_formats &&
                (data as any).results[0].media_formats.gif &&
                (data as any).results[0].media_formats.gif.url
            ) {
                return (data as any).results[0].media_formats.gif.url;
            }

            // Fallback pour certains GIFs qui n'ont pas le format gif mais webm/mp4
            if (
                typeof data === 'object' &&
                data !== null &&
                Array.isArray((data as any).results) &&
                (data as any).results[0] &&
                (data as any).results[0].media_formats
            ) {
                const formats = (data as any).results[0].media_formats;
                if (formats.mediumgif && formats.mediumgif.url) return formats.mediumgif.url;
                if (formats.tinygif && formats.tinygif.url) return formats.tinygif.url;
                if (formats.mp4 && formats.mp4.url) return formats.mp4.url;
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    async onExecute(interaction: ChatInputCommandInteraction): Promise<void> {
        const target = interaction.options.getString('cible') as string;
        let content = interaction.options.getString('url');
        const fullscreen = interaction.options.getBoolean('fullscreen') ?? false;
        const text = interaction.options.getString('texte') ?? null;

        await interaction.deferReply({ ephemeral: true });

        if (content && content.match(/^https?:\/\/tenor\.com\/(fr\/)?view\//)) {
            await interaction.editReply("Récupération du GIF depuis Tenor...");
            const directUrl = await this.getTenorDirectUrl(content);
            if (!directUrl) {
                await interaction.editReply("Impossible de récupérer le GIF depuis Tenor. Vérifiez le lien.");
                return;
            }
            content = directUrl;
        }

        try {
            const url = new URL(content);

            if (!['https:', 'http:'].includes(url.protocol)) {
                await interaction.editReply("Le format de l'url n'est pas correct.");
                return;
            }

            const extension = url.pathname.split('.').pop()?.toLowerCase();
            const supportedFormats = ['mp4', 'webm', 'mkv', 'mov', 'mp3', 'wav', 'ogg', 'jpg', 'jpeg', 'png', 'gif'];

            if (!extension || !supportedFormats.includes(extension)) {
                await interaction.editReply(
                    `Format de fichier non supporté. Formats acceptés: ${supportedFormats.join(', ')}.`,
                );
                return;
            }
        } catch {
            await interaction.editReply("Le lien n'est pas valide.");
            return;
        }

        const streamerData = this.client.livechat.connectedStreamers.get(target);
        if (!streamerData || streamerData.guildId !== interaction.guildId) {
            await interaction.editReply(`${target} n'est pas connecté sur ce serveur.`);
            return;
        }

        try {
            this.client.livechat.io.to(streamerData.socketId).emit('broadcast', {
                content,
                from: interaction.user,
                fullscreen,
                text,
            });

            await interaction.editReply(`LiveChat envoyé sur le stream de [${target}](https://twitch.tv/${target})`);
        } catch (error) {
            Logger.error('LiveChatCommand', `Erreur lors de l'envoi du LiveChat\n${error.message}`);
            await interaction.editReply("Une erreur est survenue lors de l'envoi du LiveChat");
        }
    }
}