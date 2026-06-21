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
    subtext,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import { Constants } from '../utils/Constants';
import { Functions } from '../utils/Functions';
import { SupabaseService } from '../utils/SupabaseService';
import Command from './Command';

export default class ManageOverlaysCommand extends Command {
    constructor(client: DiscordClient) {
        super(client, {
            name: 'gérer-mes-overlays',
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

        const isAuthorized = await Functions.checkRoleRestriction(this.client, guildId, userId);

        if (!isAuthorized) {
            await interaction.respond([
                {
                    name: "Vous n'avez pas le rôle requis sur ce serveur pour utiliser LiveChat.",
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

            if (userConfigs.length > 0) {
                choices.push({ name: '▬▬▬▬▬ Vos overlays ▬▬▬▬▬', value: 'divider' });
            }

            for (const config of userConfigs) {
                choices.push({
                    name: `🎥 Overlay : ${config.username}`,
                    value: config.token,
                });
            }

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

        const isAuthorized = await Functions.checkRoleRestriction(this.client, guildId, userId);
        if (!isAuthorized) {
            const embed = Functions.buildEmbed(
                "Vous n'avez pas le rôle requis sur ce serveur pour utiliser cette commande.",
                'Error',
            );
            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const value = interaction.options.getString('choix', true);

        if (value === 'divider' || value === 'limit_reached') {
            const embed = Functions.buildEmbed('Veuillez sélectionner une option valide dans la liste.', 'Error');
            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (value === 'create') {
            const modal = new ModalBuilder().setCustomId('create_overlay_modal').setTitle('Créer un nouvel overlay');

            const usernameInput = new TextInputBuilder()
                .setCustomId('overlay_username')
                .setLabel("Pseudo d'affichage")
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
            ? `${Constants.getFrontendUrl()}/v2/overlay?token=${token}`
            : `${Constants.getFrontendUrl()}/v2/overlay.html?token=${token}`;
    }

    private static buildManageComponents(username: string, token: string) {
        const overlayUrl = this.getOverlayUrl(token);

        const embed = Functions.buildEmbed(
            `### Gestion de l'overlay : ${username}\n` +
                `Lien d'overlay :\n\n` +
                subtext(
                    "Voici votre lien d'overlay, vous pouvez l'intégrer à n'importe quel logiciel qui supporte les sources navigateur.",
                ) +
                `\n\n\`\`\`\n${overlayUrl}\n\`\`\`\n` +
                `⚠️ **Gardez ce lien privé.** Ne le partagez pas en public.`,
            'Blurple',
        );

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel('Guide OBS')
                .setURL(
                    Constants.getUrl('usage', {
                        params: [{ name: 'obs', value: 'true' }],
                        hash: 'setup',
                    }),
                )
                .setStyle(ButtonStyle.Link)
                .setEmoji('🖥️'),
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

    public static async handleButton(interaction: ButtonInteraction): Promise<void> {
        const { customId, user } = interaction;

        if (customId.startsWith('regenerate_token_')) {
            await interaction.deferUpdate();

            const oldToken = customId.replace('regenerate_token_', '');

            const config = await SupabaseService.getOverlayConfigByToken(oldToken);
            if (!config) {
                const embed = Functions.buildEmbed('Overlay introuvable.', 'Error');
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                return;
            }

            if (config.user_id !== user.id) {
                const embed = Functions.buildEmbed("Vous n'êtes pas le propriétaire de cet overlay.", 'Error');
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                return;
            }

            const newToken = crypto.randomBytes(32).toString('hex');

            const success = await SupabaseService.updateOverlayToken(oldToken, newToken);
            if (!success) {
                const embed = Functions.buildEmbed('Impossible de régénérer le lien en base de données.', 'Error');
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                return;
            }

            const response = ManageOverlaysCommand.buildManageComponents(config.username, newToken);
            await interaction.editReply(response);
        } else if (customId.startsWith('delete_overlay_')) {
            await interaction.deferUpdate();

            const token = customId.replace('delete_overlay_', '');

            const config = await SupabaseService.getOverlayConfigByToken(token);
            if (!config) {
                const embed = Functions.buildEmbed('Overlay introuvable.', 'Error');
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                return;
            }

            if (config.user_id !== user.id) {
                const embed = Functions.buildEmbed("Vous n'êtes pas le propriétaire de cet overlay.", 'Error');
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                return;
            }

            if (config.user_id !== user.id) {
                const embed = Functions.buildEmbed("Vous n'êtes pas le propriétaire de cet overlay.", 'Error');
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                return;
            }

            const success = await SupabaseService.deleteOverlayConfig(token);
            if (!success) {
                const embed = Functions.buildEmbed("Impossible de supprimer l'overlay en base de données.", 'Error');
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
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

            const isAuthorized = await Functions.checkRoleRestriction(client, guildId, user.id);
            if (!isAuthorized) {
                const embed = Functions.buildEmbed(
                    "Vous n'avez pas le rôle requis sur ce serveur pour configurer des overlays.",
                    'Error',
                );
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const username = interaction.fields.getTextInputValue('overlay_username').trim();

            const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
            if (!cleanUsername || cleanUsername.length < 3) {
                const embed = Functions.buildEmbed(
                    'Pseudo invalide. Seuls les caractères alphanumériques et underscores sont autorisés.',
                    'Error',
                );
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const settings = await SupabaseService.getGuildSettings(guildId);
            const maxOverlays = settings?.max_overlays_per_user ?? 5;
            const userConfigs = await SupabaseService.getOverlayConfigsByGuildAndUser(guildId, user.id);

            if (userConfigs.length >= maxOverlays) {
                const embed = Functions.buildEmbed(
                    `Vous avez atteint la limite de ${maxOverlays} overlays sur ce serveur.`,
                    'Error',
                );
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const existing = await SupabaseService.getOverlayConfig(guildId, cleanUsername);
            if (existing) {
                const embed = Functions.buildEmbed(
                    `Le pseudo \`${cleanUsername}\` est déjà utilisé pour un overlay sur ce serveur.`,
                    'Error',
                );
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const token = crypto.randomBytes(32).toString('hex');
            const success = await SupabaseService.saveOverlayConfig(guildId, cleanUsername, token, user.id);

            if (!success) {
                const embed = Functions.buildEmbed(
                    "Une erreur est survenue lors de la création de l'overlay.",
                    'Error',
                );
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

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setLabel('Guide OBS')
                    .setURL(
                        Constants.getUrl('usage', {
                            params: [{ name: 'obs', value: 'true' }],
                            hash: 'setup',
                        }),
                    )
                    .setStyle(ButtonStyle.Link)
                    .setEmoji('🖥️'),
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

            await interaction.editReply({ embeds: [embed], components: [row] });
        }
    }
}
