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
                    description: 'Lien du média a afficher. Format acceptés: mp4,webm,mkv,mov,mp3,wav,ogg.',
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

    async onExecute(interaction: ChatInputCommandInteraction): Promise<void> {
        const target = interaction.options.getString('cible') as string;
        const content = interaction.options.getString('url');
        const fullscreen = interaction.options.getBoolean('fullscreen') ?? false;
        const text = interaction.options.getString('texte') ?? null;

        await interaction.deferReply({ ephemeral: true });

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