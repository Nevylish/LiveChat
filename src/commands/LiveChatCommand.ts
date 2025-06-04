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

import { ApplicationCommandOptionType, AutocompleteInteraction, CommandInteraction } from 'discord.js';
import Command from '../base/Command';
import DiscordClient from '../base/DiscordClient';

export default class LiveChatCommand extends Command {
    constructor(client: DiscordClient) {
        super(client, {
            name: 'livechat',
            description: "Lancer un Live Chat sur le stream de quelqu'un",
            dmPermission: false,
            options: [
                {
                    name: 'streamer',
                    type: ApplicationCommandOptionType.String,
                    description: 'Choisissez sur quel stream vous souhaitez lancer le live chat',
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
                    description: "Afficher le live chat sur tout l'écran du stream (1920x1080 horizontal)",
                    required: false,
                },
                /*{
                    name: 'chromakey',
                    type: ApplicationCommandOptionType.Boolean,
                    description: 'Retirer le fond vert (chroma key)',
                    required: false,
                },*/
            ],
        });
    }

    async onAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'streamer') {
            const streamers = Array.from(this.client.livechat.connectedStreamers.entries())
                .filter(([_, data]) => data.guildId === interaction.guildId)
                .map(([streamer]) => streamer);

            const filtered = streamers.filter((streamer) =>
                streamer.toLowerCase().includes(focusedOption.value.toLowerCase()),
            );

            await interaction.respond(filtered.map((streamer) => ({ name: streamer, value: streamer })));
        }
    }

    async onExecute(interaction: CommandInteraction): Promise<void> {
        // @ts-ignore
        const target = interaction.options.getString('streamer');
        // @ts-ignore
        const content = interaction.options.getString('url');
        // @ts-ignore
        const fullscreen = interaction.options.getBoolean('fullscreen') ?? false;
        // @ts-ignore
        const chromaKey = interaction.options.getBoolean('chromakey') ?? false;

        await interaction.deferReply({ ephemeral: true });

        try {
            new URL(content);
        } catch {
            await interaction.editReply("L'URL fournie n'est pas valide");
            return;
        }

        const streamerData = this.client.livechat.connectedStreamers.get(target);
        if (!streamerData) {
            await interaction.editReply(`Le streamer ${target} n'est pas connecté`);
            return;
        }

        // Vérifier que le guildId correspond
        if (streamerData.guildId !== interaction.guildId) {
            await interaction.editReply(
                "Vous ne pouvez pas envoyer du contenu à ce streamer car il n'est pas configuré pour ce serveur",
            );
            return;
        }

        this.client.livechat.io.to(streamerData.socketId).emit('newContent', {
            content,
            from: interaction.user,
            fullscreen,
            chromaKey,
        });

        await interaction.editReply(`LiveChat envoyé sur le stream de [${target}](https://twitch.tv/${target})`);
    }
}
