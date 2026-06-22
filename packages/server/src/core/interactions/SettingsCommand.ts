import { ApplicationCommandOptionType, AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import DiscordClient from '../DiscordClient';
import { Functions } from '../utils/Functions';
import Command from './Command';
import * as maxOverlaysPerMember from './settings_subcommands/MaxOverlaysPerMember';
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
                {
                    name: 'overlays-max-par-personne',
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Définir un nombre maximal d'overlays par personne.",
                    options: [
                        {
                            name: 'nombre',
                            type: ApplicationCommandOptionType.Number,
                            description: "Définissez le nombre maximal d'overlays",
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
            await restrictionRole.autocomplete(interaction);
        }
    }

    async onExecute(interaction: ChatInputCommandInteraction): Promise<void> {
        const subcommand = interaction.options.getSubcommand();

        const guildId = interaction.guildId;
        const userId = interaction.user.id;
        if (!guildId) return;

        const guild = interaction.guild || (await this.client.guilds.fetch(guildId).catch(() => null));
        if (!guild) return;

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) return;

        const isOwner = guild.ownerId === userId;
        const isAdmin = member.permissions.has('Administrator') || member.permissions.has('ManageGuild');

        if (!isOwner && !isAdmin) {
            const embed = Functions.buildEmbed(
                "Vous n'avez pas les permissions pour exécuter cette commande.\nVous devez avoir la permission Administrateur ou Gérer le serveur.",
                'Error',
            );
            await interaction.reply({ embeds: [embed] });
            return;
        }

        if (subcommand === 'rôle-autorisé') {
            await restrictionRole.execute(this.client, interaction);
        } else if (subcommand === 'overlays-max-par-personne') {
            await maxOverlaysPerMember.execute(interaction);
        }
    }
}
