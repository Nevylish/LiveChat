/*
    Ce fichier gère le déploiement et l'écoute des commandes slash.
*/

import { AutocompleteInteraction, ChatInputCommandInteraction, Events, MessageFlags } from 'discord.js';
import DiscordClient from '../DiscordClient';
import Command from '../commands/Command';
import LiveChatCommand from '../commands/LiveChatCommand';
import { Logger } from '../utils/Logger';
import { Functions } from './Functions';

export namespace Handlers {
    /**
     * Démarrer le gestion des événements et afficher l'activité.
     */
    export const setupEventsListeners = (client: DiscordClient) => {
        client.on(Events.ClientReady, async () => {
            client.updateActivity();
        });

        client.on(
            Events.InteractionCreate,
            async (interaction: ChatInputCommandInteraction | AutocompleteInteraction) => {
                if (!interaction || interaction.user.bot) return;

                if (interaction.isCommand()) await InteractionCommandHandler(client, interaction);
                else if (interaction.isAutocomplete()) await AutoCompleteHandler(client, interaction);
            },
        );

        Logger.success('Handlers', 'Events listeners loaded');
    };

    /**
     * Déployer les commandes slash.
     */
    export const setupCommands = async (client: DiscordClient) => {
        const commands: Command[] = [new LiveChatCommand(client)];

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

    /**
     * Gestion des auto-complétions des commandes slash.
     */
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

    /**
     * Gestion des interactions des commandes slash.
     */
    const InteractionCommandHandler = async (client: DiscordClient, interaction: ChatInputCommandInteraction) => {
        const { user, commandName } = interaction;
        const cmd = client.commands.get(commandName);

        if (!cmd) {
            const embed = Functions.buildEmbed("Cette commande n'existe pas.", 'Error');
            return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }

        try {
            await cmd.onExecute(interaction);
        } catch (err) {
            const embed = Functions?.buildEmbed(err.message, 'Error');
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
