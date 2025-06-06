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

import { Logger } from '../utils/logger';
import DiscordClient from './DiscordClient';
import Command from './Command';
import { AutocompleteInteraction, ChatInputCommandInteraction, Events, MessageFlags } from 'discord.js';
import LiveChatCommand from '../commands/LiveChatCommand';

export namespace Handlers {
    export const setupEventsListeners = (client: DiscordClient) => {
        client.on(Events.ClientReady, () => {
            client.user?.setActivity('/livechat', { type: 3 });
        });

        client.on(
            Events.InteractionCreate,
            async (interaction: ChatInputCommandInteraction | AutocompleteInteraction) => {
                if (interaction.isCommand()) {
                    await InteractionCommandHandler(client, interaction);
                } else if (interaction.isAutocomplete()) {
                    await AutoCompleteHandler(client, interaction);
                }
            },
        );

        Logger.success('Handlers', 'Events listeners loaded');
    };

    export const setupCommands = async (client: DiscordClient) => {
        const commands: Command[] = [new LiveChatCommand(client)];

        commands.forEach((command) => {
            if (command.info.name) {
                client.commands.set(command.info.name, command);
                Logger.success(
                    'Handlers',
                    `${Logger.COLORS.GREEN}${command.info.name}${Logger.COLORS.RESET} command loaded`,
                );
            }
        });

        const commandsData = commands.map((cmd) => cmd.info);

        await client.application.commands.set(commandsData);

        Logger.success(
            'Handlers',
            `${Logger.COLORS.GREEN}Slash commands registered.${Logger.COLORS.RESET} (${commandsData.length} commands)`,
        );
    };

    const AutoCompleteHandler = async (client: DiscordClient, interaction: AutocompleteInteraction) => {
        const { user, commandName } = interaction;
        const cmd = client.commands.get(commandName);
        if (!cmd || !cmd.onAutocomplete) return;

        try {
            await cmd.onAutocomplete(interaction);
        } catch (err) {
            Logger.error('Handlers', err, {
                userId: user.id,
                userTag: user.tag,
                command: commandName,
            });
        }
    };

    const InteractionCommandHandler = async (client: DiscordClient, interaction: ChatInputCommandInteraction) => {
        const { user, commandName } = interaction;
        const cmd = client.commands.get(commandName);

        if (!cmd) {
            return interaction.reply({
                content: "Cette commande n'existe pas.",
                flags: [MessageFlags.Ephemeral],
            });
        }

        try {
            await cmd.onExecute(interaction);
        } catch (err) {
            if (interaction.deferred) {
                await interaction.editReply({ content: err.message });
            } else {
                await interaction.reply({ content: err.message, flags: [MessageFlags.Ephemeral] });
            }

            Logger.error('Handlers', err, {
                userId: user.id,
                userTag: user.tag,
                command: commandName,
            });
        }
    };
}
