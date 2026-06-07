/*
    Ce fichier gère le déploiement et l'écoute des commandes slash.
*/

import { AutocompleteInteraction, ChatInputCommandInteraction, Events, MessageFlags } from 'discord.js';
import DiscordClient from '../DiscordClient';
import Command from '../interactions/classes/Command';
import LiveChatCommand from '../interactions/LiveChatCommand';
import PlatformsCommand from '../interactions/PlatformsCommand';
import SubscriptionCommand from '../interactions/SubscriptionCommand';
import { Logger } from '../utils/Logger';
import { Functions } from './Functions';

export namespace Handlers {
    export const setupEventListeners = (client: DiscordClient) => {
        client.on(Events.ClientReady, async () => {
            client.updateActivity();
        });

        client.on(
            Events.InteractionCreate,
            async (interaction: ChatInputCommandInteraction | AutocompleteInteraction) => {
                if (!interaction || interaction.user.bot) return;

                if (interaction.isCommand()) await handleCommand(client, interaction);
                else if (interaction.isAutocomplete()) await handleAutocomplete(client, interaction);
            },
        );

        Logger.success('Handlers', 'Events listeners loaded');
    };

    export const setupCommands = async (client: DiscordClient) => {
        const commands: Command[] = [
            new LiveChatCommand(client),
            new SubscriptionCommand(client),
            new PlatformsCommand(client),
        ];

        commands.forEach((command) => {
            if (command.info.name) {
                client.commands.set(command.info.name, command);
                Logger.success('Handlers', `${command.info.name} command loaded`);
            }
        });

        const commandsData = commands.map((cmd) => cmd.info);

        await client.application.commands.set(commandsData);

        Logger.success('Handlers', `Slash commands registered. (${commandsData.length} commands)`);
    };

    const handleAutocomplete = async (client: DiscordClient, interaction: AutocompleteInteraction) => {
        const { user, commandName } = interaction;
        const cmd = client.commands.get(commandName);
        if (!cmd || !cmd.onAutocomplete) return;

        try {
            await cmd.onAutocomplete(interaction);
        } catch (err: any) {
            Logger.error('Handlers', err?.message || String(err), {
                userId: user.id,
                userTag: user.tag,
                command: commandName,
            });
        }
    };

    const handleCommand = async (client: DiscordClient, interaction: ChatInputCommandInteraction) => {
        const { user, commandName } = interaction;
        const cmd = client.commands.get(commandName);

        if (!cmd) {
            const embed = Functions.buildEmbed("Cette commande n'existe pas.", 'Error');
            return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }

        try {
            await cmd.onExecute(interaction);
        } catch (err: any) {
            const errorMessage = err?.message || String(err) || 'Une erreur inconnue est survenue.';
            const embed = Functions.buildEmbed(errorMessage, 'Error');
            if (interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
            }

            Logger.error('Handlers', errorMessage, {
                userId: user.id,
                userTag: user.tag,
                command: commandName,
            });
        }
    };
}
