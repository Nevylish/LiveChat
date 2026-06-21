import { ApplicationCommandOptionType, AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import DiscordClient from '../DiscordClient';
import { TargetsManager } from '../utils/Targets';
import Command from './classes/Command';
import * as media from './subcommands/media';
import * as skip from './subcommands/skip';
import * as stop from './subcommands/stop';
import { SupabaseService } from '../utils/SupabaseService';

export default class LiveChatCommand extends Command {
    constructor(client: DiscordClient) {
        super(client, {
            name: 'livechat',
            description: "Liste des commandes de l'overlay LiveChat.",
            dmPermission: false,
            options: [
                {
                    name: 'lancer-url',
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Lancer un LiveChat sur le stream de quelqu'un",
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
                            description:
                                'Lien du média à afficher. /liste_des_plateformes pour voir les plateformes acceptées.',
                            required: true,
                        },
                        {
                            name: 'texte',
                            type: ApplicationCommandOptionType.String,
                            description: 'Texte à afficher en dessous du média.',
                            required: false,
                        },
                        {
                            name: 'fullscreen',
                            type: ApplicationCommandOptionType.Boolean,
                            description: "Afficher le livechat sur tout l'écran du stream (16:9 horizontal)",
                            required: false,
                        },
                        {
                            name: 'anonyme',
                            type: ApplicationCommandOptionType.Boolean,
                            description: 'Masquer votre pseudo et votre photo de profil sur le LiveChat.',
                            required: false,
                        },
                    ],
                },
                {
                    name: 'lancer-fichier',
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Lancer un LiveChat sur le stream de quelqu'un",
                    options: [
                        {
                            name: 'cible',
                            type: ApplicationCommandOptionType.String,
                            description: 'Choisissez sur quel stream vous souhaitez lancer le LiveChat',
                            autocomplete: true,
                            required: true,
                        },
                        {
                            name: 'fichier',
                            type: ApplicationCommandOptionType.Attachment,
                            description:
                                'Fichier à afficher. Formats acceptés: mp4,webm,mkv,mov,mp3,wav,ogg,jpg,jpeg,png,gif,webp.',
                            required: true,
                        },
                        {
                            name: 'texte',
                            type: ApplicationCommandOptionType.String,
                            description: 'Texte à afficher en dessous du média.',
                            required: false,
                        },
                        {
                            name: 'fullscreen',
                            type: ApplicationCommandOptionType.Boolean,
                            description: "Afficher le livechat sur tout l'écran du stream (16:9 horizontal)",
                            required: false,
                        },
                        {
                            name: 'anonyme',
                            type: ApplicationCommandOptionType.Boolean,
                            description: 'Masquer votre pseudo et votre photo de profil sur le LiveChat.',
                            required: false,
                        },
                    ],
                },
                {
                    name: 'passer-au-suivant',
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Passer au LiveChat suivant sur le stream de quelqu'un",
                    options: [
                        {
                            name: 'cible',
                            type: ApplicationCommandOptionType.String,
                            description: 'Choisissez sur quel stream vous souhaitez passer au suivant',
                            autocomplete: true,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'stop-et-vider',
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Arrêter le LiveChat et vider la file d'attente sur le stream de quelqu'un",
                    options: [
                        {
                            name: 'cible',
                            type: ApplicationCommandOptionType.String,
                            description: 'Choisissez sur quel stream vous souhaitez arrêter le LiveChat',
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
        let label = TargetsManager.EVERYONE_OPTION_LABEL;

        if (subcommand === 'passer-au-suivant') {
            label = TargetsManager.EVERYONE_SKIP_LABEL;
        } else if (subcommand === 'stop-et-vider') {
            label = TargetsManager.EVERYONE_CLEAR_LABEL;
        }

        const suggestions = TargetsManager.getAutocompleteSuggestions(this.client, interaction, label);

        await interaction.respond(suggestions.map((name) => ({ name, value: name })));
    }

    async onExecute(interaction: ChatInputCommandInteraction): Promise<void> {
        const guildId = interaction.guildId;
        const userId = interaction.user.id;

        if (guildId) {
            try {
                const guild = interaction.guild || (await this.client.guilds.fetch(guildId).catch(() => null));
                if (guild) {
                    const member = await guild.members.fetch(userId).catch(() => null);
                    if (member) {
                        const isOwner = guild.ownerId === userId;
                        const isAdmin =
                            member.permissions.has('Administrator') || member.permissions.has('ManageGuild');

                        if (!isOwner && !isAdmin) {
                            const settings = await SupabaseService.getGuildSettings(guildId);
                            if (settings && settings.required_role_id) {
                                const hasRole = member.roles.cache.has(settings.required_role_id);
                                if (!hasRole) {
                                    await interaction.reply({
                                        content:
                                            "❌ Vous n'avez pas le rôle requis sur ce serveur pour utiliser les commandes `/livechat`.",
                                        ephemeral: true,
                                    });
                                    return;
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Error validating role in LiveChatCommand', err);
            }
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'lancer-url' || subcommand === 'lancer-fichier') {
            await media.execute(this.client, interaction);
        } else if (subcommand === 'passer-au-suivant') {
            await skip.execute(this.client, interaction);
        } else if (subcommand === 'stop-et-vider') {
            await stop.execute(this.client, interaction);
        }
    }
}
