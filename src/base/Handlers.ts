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
import { AutocompleteInteraction, CommandInteraction, Events, MessageFlags } from 'discord.js';
import { Functions } from '../utils/functions';
import LiveChatCommand from '../commands/LiveChatCommand';

export namespace Handlers {
    export const loadEventsListeners = (client: DiscordClient) => {
        const setActivity = () => {
            try {
                client.user?.setActivity('/livechat', { type: 3 });
            } catch (err) {
                Logger.error('Client', 'Failed to update activity\n', err);
            }
        };

        client.on(Events.ClientReady, () => {
            setTimeout(() => {
                setActivity();
                setInterval(setActivity, 60 * 60 * 1000 /* 1 hour */);
            }, 5 * 1000 /* 5 seconds */);
        });

        client.on(Events.Error, (err) => {
            Logger.error('Client', err);
        });

        client.on(Events.Warn, (warning) => {
            Logger.warn('Client', warning);
        });

        client.on(Events.InteractionCreate, async (interaction) => {
            if (interaction.isCommand()) {
                await interactionCommandHandler(client, interaction);
            } else if (interaction.isAutocomplete()) {
                await autoCompleteHandler(client, interaction);
            }
        });

        Logger.success('Handlers', 'Events listeners loaded');
    };

    export const loadCommands = async (client: DiscordClient) => {
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

        if (!client.isDevEnvironment) {
            await client.application.commands.set(commandsData);
            Logger.success(
                'Handlers',
                `${Logger.COLORS.GREEN}Slash commands registered for all guilds. ${Logger.COLORS.RESET}(${commandsData.length} commands)`,
            );
        } else {
            const devGuild = client.guilds.cache.get('822720523234181150');
            if (devGuild) {
                await devGuild.commands.set(commandsData);
                Logger.success(
                    'Handlers',
                    `${Logger.COLORS.YELLOW}Slash commands registered for *dev* guild. ${Logger.COLORS.RESET}(${commandsData.length} commands)`,
                );
            }
        }
    };

    export const autoCompleteHandler = async (client: DiscordClient, interaction: AutocompleteInteraction) => {
        const cmd = client.commands.get(interaction.commandName);
        if (!cmd || !cmd.onAutocomplete) return;

        try {
            await cmd.onAutocomplete(interaction);
        } catch (err) {
            Logger.error('Handlers', err, {
                userId: interaction.user.id,
                userTag: interaction.user.tag,
                command: interaction.commandName,
            });
        }
    };

    export const interactionCommandHandler = async (client: DiscordClient, interaction: CommandInteraction) => {
        const { user, commandName } = interaction;
        const cmd = client.commands.get(commandName);

        if (!cmd) {
            return interaction.reply({
                embeds: [Functions.buildErrorEmbed('This command does not exist or has been deleted.')],
                flags: [MessageFlags.Ephemeral],
            });
        }

        try {
            await cmd.onExecute(interaction);
        } catch (err) {
            const embed = Functions.buildErrorEmbed(err.message);

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
            }

            Logger.error('Handlers', err, {
                userId: user.id,
                userTag: user.tag,
                command: commandName,
            });
        }
    };
}
