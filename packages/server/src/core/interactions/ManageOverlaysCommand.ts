import * as crypto from 'crypto';
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    AutocompleteInteraction,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    MessageFlags,
    ModalBuilder,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import { Constants } from '../utils/Constants';
import { Functions } from '../utils/Functions';
import { SupabaseService } from '../utils/SupabaseService';
import Command from './classes/Command';

export default class ManageOverlaysCommand extends Command {
    constructor(client: DiscordClient) {
        super(client, {
            name: 'gérer-mon-overlay',
            description: 'Gérer, afficher ou créer vos overlays sur ce serveur.',
            dmPermission: false,
            options: [
                {
                    name: 'choix',
                    type: ApplicationCommandOptionType.String,
                    description: 'Sélectionnez un overlay existant ou créez-en un nouveau',
                    autocomplete: true,
                    required: true,
                },
            ],
        });
    }

    async onAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const guildId = interaction.guildId;
        if (!guildId) return;
        const userId = interaction.user.id;
        const focusedValue = interaction.options.getFocused().toLowerCase();

        // Check role restriction
        const isAuthorized = await Functions.checkRoleRestriction(this.client, guildId, userId);
        if (!isAuthorized) {
            await interaction.respond([
                {
                    name: "❌ Vous n'avez pas le rôle requis sur ce serveur pour utiliser LiveChat.",
                    value: 'restricted',
                },
            ]);
            return;
        }

        try {
            const settings = await SupabaseService.getGuildSettings(guildId);
            const maxOverlays = settings?.max_overlays_per_user ?? 5;
            const userConfigs = await SupabaseService.getOverlayConfigsByGuildAndUser(guildId, userId);

            const choices = [];

            // If the user has remaining slots, offer the option to create a new overlay
            if (userConfigs.length < maxOverlays) {
                const remaining = maxOverlays - userConfigs.length;
                choices.push({
                    name: `➕ Créer un nouvel overlay (Slots restants : ${remaining}/${maxOverlays})`,
                    value: 'create',
                });
            } else {
                choices.push({
                    name: `⚠️ Limite atteinte (${maxOverlays}/${maxOverlays} overlays)`,
                    value: 'limit_reached',
                });
            }

            // Add a visual separator if there are existing overlays
            if (userConfigs.length > 0) {
                choices.push({ name: '▬▬▬▬▬ Vos overlays ▬▬▬▬▬', value: 'divider' });
            }

            // Add existing overlays
            for (const config of userConfigs) {
                choices.push({
                    name: `🎥 Overlay : ${config.username}`,
                    value: config.token,
                });
            }

            // Filter and limit choices
            const filtered = choices.filter((choice) => choice.name.toLowerCase().includes(focusedValue)).slice(0, 25);

            await interaction.respond(filtered);
        } catch (err) {
            console.error('Error during manage overlays autocomplete:', err);
        }
    }

    async onExecute(interaction: ChatInputCommandInteraction): Promise<void> {
        const guildId = interaction.guildId;
        if (!guildId) return;
        const userId = interaction.user.id;

        // Check role restriction
        const isAuthorized = await Functions.checkRoleRestriction(this.client, guildId, userId);
        if (!isAuthorized) {
            await interaction.reply({
                content: "❌ Vous n'avez pas le rôle requis sur ce serveur pour utiliser cette commande.",
                ephemeral: true,
            });
            return;
        }

        const value = interaction.options.getString('choix', true);

        if (value === 'divider' || value === 'limit_reached') {
            await interaction.reply({
                content: '❌ Choix invalide. Veuillez sélectionner une option valide dans la liste.',
                ephemeral: true,
            });
            return;
        }

        if (value === 'create') {
            const modal = new ModalBuilder().setCustomId('create_overlay_modal').setTitle('Créer un nouvel overlay');

            const usernameInput = new TextInputBuilder()
                .setCustomId('overlay_username')
                .setLabel("Pseudo d'affichage (Twitch, Kick, YT)")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('noobmaster69')
                .setMinLength(3)
                .setMaxLength(25)
                .setRequired(true);

            const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(usernameInput);
            modal.addComponents(actionRow);

            await interaction.showModal(modal);
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const config = await SupabaseService.getOverlayConfigByToken(value);
            if (!config) {
                const embed = Functions.buildEmbed('Overlay introuvable.', 'Error');
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const response = ManageOverlaysCommand.buildManageComponents(config.username, config.token);
            await interaction.editReply(response);
        } catch (err) {
            console.error('Error during manage overlays execution:', err);
            const embed = Functions.buildEmbed('Une erreur est survenue lors du traitement.', 'Error');
            await interaction.editReply({ embeds: [embed] });
        }
    }

    private static getOverlayUrl(token: string): string {
        const isLocal = Constants.getHostname().includes('localhost');
        return isLocal
            ? `${Constants.getOverlayUrl()}/v2/overlay?token=${token}`
            : `${Constants.getOverlayUrl()}/v2/overlay.html?token=${token}`;
    }

    private static buildManageComponents(username: string, token: string) {
        const overlayUrl = this.getOverlayUrl(token);

        const embed = Functions.buildEmbed(
            `### 🎥 Gestion de l'overlay de \`${username}\`\n` +
                `- **URL OBS (Source Navigateur)** :\n\`\`\`\n${overlayUrl}\n\`\`\`\n` +
                `⚠️ **Gardez ce lien privé.** Ne le partagez pas en public, car n'importe qui pourrait envoyer des médias sur votre écran.\n` +
                `Utilisez les boutons ci-dessous pour modifier ce lien ou le supprimer.`,
            'Blurple',
        );

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`regenerate_token_${token}`)
                .setLabel('Régénérer le lien')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄'),
            new ButtonBuilder()
                .setCustomId(`delete_overlay_${token}`)
                .setLabel("Supprimer l'overlay")
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️'),
        );

        return { embeds: [embed], components: [row] };
    }

    public static async handleButton(client: DiscordClient, interaction: ButtonInteraction): Promise<void> {
        const { customId, user } = interaction;

        if (customId.startsWith('regenerate_token_')) {
            await interaction.deferUpdate();

            const oldToken = customId.replace('regenerate_token_', '');

            const config = await SupabaseService.getOverlayConfigByToken(oldToken);
            if (!config) {
                await interaction.followUp({ content: '❌ Overlay introuvable.', flags: MessageFlags.Ephemeral });
                return;
            }

            if (config.user_id !== user.id) {
                await interaction.followUp({
                    content: "❌ Vous n'êtes pas le propriétaire de cet overlay.",
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const newToken = crypto.randomBytes(32).toString('hex');

            const success = await SupabaseService.updateOverlayToken(oldToken, newToken);
            if (!success) {
                await interaction.followUp({
                    content: '❌ Impossible de régénérer le lien en base de données.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const response = ManageOverlaysCommand.buildManageComponents(config.username, newToken);
            await interaction.editReply(response);
        } else if (customId.startsWith('delete_overlay_')) {
            await interaction.deferUpdate();

            const token = customId.replace('delete_overlay_', '');

            const config = await SupabaseService.getOverlayConfigByToken(token);
            if (!config) {
                await interaction.followUp({ content: '❌ Overlay introuvable.', flags: MessageFlags.Ephemeral });
                return;
            }

            if (config.user_id !== user.id) {
                await interaction.followUp({
                    content: "❌ Vous n'êtes pas le propriétaire de cet overlay.",
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const success = await SupabaseService.deleteOverlayConfig(token);
            if (!success) {
                await interaction.followUp({
                    content: "❌ Impossible de supprimer l'overlay en base de données.",
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const embed = Functions.buildEmbed(
                `🗑️ **L'overlay de \`${config.username}\` a été supprimé avec succès.**\n` +
                    `L'ancienne source navigateur OBS ne fonctionnera plus.`,
                'Good',
            );

            await interaction.editReply({ embeds: [embed], components: [] });
        }
    }

    public static async handleModalSubmit(client: DiscordClient, interaction: ModalSubmitInteraction): Promise<void> {
        const { customId, user, guildId } = interaction;

        if (customId === 'create_overlay_modal') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            if (!guildId) return;

            // Check role restriction
            const isAuthorized = await Functions.checkRoleRestriction(client, guildId, user.id);
            if (!isAuthorized) {
                const embed = Functions.buildEmbed("Vous n'avez pas le rôle requis sur ce serveur pour configurer des overlays.", 'Error');
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const username = interaction.fields.getTextInputValue('overlay_username').trim();

            const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
            if (!cleanUsername || cleanUsername.length < 3) {
                const embed = Functions.buildEmbed("Pseudo invalide. Seuls les caractères alphanumériques et underscores sont autorisés.", 'Error');
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const settings = await SupabaseService.getGuildSettings(guildId);
            const maxOverlays = settings?.max_overlays_per_user ?? 5;
            const userConfigs = await SupabaseService.getOverlayConfigsByGuildAndUser(guildId, user.id);

            if (userConfigs.length >= maxOverlays) {
                const embed = Functions.buildEmbed(`Vous avez atteint la limite de ${maxOverlays} overlays sur ce serveur.`, 'Error');
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const existing = await SupabaseService.getOverlayConfig(guildId, cleanUsername);
            if (existing) {
                const embed = Functions.buildEmbed(`Le pseudo \`${cleanUsername}\` est déjà utilisé pour un overlay sur ce serveur.`, 'Error');
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const token = crypto.randomBytes(32).toString('hex');
            const success = await SupabaseService.saveOverlayConfig(guildId, cleanUsername, token, user.id);

            if (!success) {
                const embed = Functions.buildEmbed("Une erreur est survenue lors de la création de l'overlay.", 'Error');
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const overlayUrl = ManageOverlaysCommand.getOverlayUrl(token);

            const embed = Functions.buildEmbed(
                `### 🎉 Votre overlay a été créé avec succès !\n` +
                    `- **Pseudo** : \`${cleanUsername}\`\n` +
                    `- **URL OBS (Source Navigateur)** :\n\`\`\`\n${overlayUrl}\n\`\`\`\n` +
                    `⚠️ **Gardez ce lien privé.** Ne le partagez pas en public, car n'importe qui pourrait envoyer des médias sur votre écran.`,
                'Good',
            );

            await interaction.editReply({ embeds: [embed] });
        }
    }
}
