import { AutocompleteInteraction, ChatInputCommandInteraction, Events, MessageFlags } from 'discord.js';
import DiscordClient from '../DiscordClient';
import Command from '../interactions/classes/Command';
import LiveChatCommand from '../interactions/LiveChatCommand';
import ManageOverlaysCommand from '../interactions/ManageOverlaysCommand';
import PlatformsCommand from '../interactions/PlatformsCommand';
import SettingsCommand from '../interactions/SettingsCommand';
import SubscriptionCommand from '../interactions/SubscriptionCommand';
import { Logger } from '../utils/Logger';
import { Functions } from './Functions';

export namespace Handlers {
    export const setupEventListeners = (client: DiscordClient) => {
        client.on(Events.ClientReady, async () => {
            setInterval(() => {
                client.updateActivity();
            }, 30 * 1000);
        });

        client.on(Events.InteractionCreate, async (interaction) => {
            if (interaction.user.bot) return;

            if (!interaction.guildId) {
                if (interaction.isChatInputCommand()) {
                    const embed = Functions.buildEmbed('LiveChat ne peut être utilisé que dans un serveur.', 'Error');
                    await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
                }
                return;
            }

            if (interaction.isChatInputCommand()) await handleCommand(client, interaction);
            else if (interaction.isAutocomplete()) await handleAutocomplete(client, interaction);
            else if (interaction.isButton()) await ManageOverlaysCommand.handleButton(client, interaction);
            else if (interaction.isModalSubmit()) await ManageOverlaysCommand.handleModalSubmit(client, interaction);
        });

        Logger.success('Handlers', 'Events listeners loaded');
    };

    export const setupCommands = async (client: DiscordClient) => {
        const commands: Command[] = [
            new LiveChatCommand(client),
            new SubscriptionCommand(client),
            new PlatformsCommand(client),
            new SettingsCommand(client),
            new ManageOverlaysCommand(client),
        ];

        commands.forEach((command) => {
            if (command.info.name) {
                client.commands.set(command.info.name, command);
                Logger.log('Handlers', `${command.info.name} command loaded`);
            }
        });

        const commandsData = commands.map((cmd) => cmd.info);

        await client.application!.commands.set(commandsData);

        Logger.success('Handlers', `Slash commands registered. (${commandsData.length} commands)`);
    };

    const handleAutocomplete = async (client: DiscordClient, interaction: AutocompleteInteraction) => {
        const { user, commandName } = interaction;
        const cmd = client.commands.get(commandName);
        if (!cmd || !cmd.onAutocomplete) return;

        try {
            await cmd.onAutocomplete(interaction);
        } catch (err) {
            Logger.error('Handlers', 'Error while handling autocomplete', {
                userId: user.id,
                userTag: user.tag,
                command: commandName,
                error: err,
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
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            const embed = Functions.buildEmbed(errorMessage, 'Error');
            if (interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
            }

            Logger.error('Handlers', 'Error while handling command', {
                userId: user.id,
                userTag: user.tag,
                command: commandName,
                error: err,
            });
        }
    };
}
