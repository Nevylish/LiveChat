import { ApplicationCommandOptionType, AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import DiscordClient from '../DiscordClient';
import Command from './classes/Command';
import * as restrictionRole from './settings_subcommands/RestrictionRole';

export default class SettingsCommand extends Command {
    constructor(client: DiscordClient) {
        super(client, {
            name: 'réglages',
            description: 'Configurer les options de LiveChat pour ce serveur.',
            dmPermission: false,
            options: [
                {
                    name: 'rôle-autorisé',
                    type: ApplicationCommandOptionType.Subcommand,
                    description: 'Définir un rôle requis pour créer ou configurer des overlays.',
                    options: [
                        {
                            name: 'rôle',
                            type: ApplicationCommandOptionType.String,
                            description: 'Sélectionnez un rôle (ou retirez la restriction)',
                            autocomplete: true,
                            required: true,
                        },
                    ],
                },
            ],
        });
    }

    async onAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'rôle-autorisé') {
            await restrictionRole.autocomplete(this.client, interaction);
        }
    }

    async onExecute(interaction: ChatInputCommandInteraction): Promise<void> {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'rôle-autorisé') {
            await restrictionRole.execute(this.client, interaction);
        }
    }
}
