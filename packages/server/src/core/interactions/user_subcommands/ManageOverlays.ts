import {
    ActionRowBuilder,
    AutocompleteInteraction,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import DiscordClient from '../../DiscordClient';
import { Constants } from '../../utils/Constants';
import { Functions } from '../../utils/Functions';
import { SupabaseService } from '../../utils/SupabaseService';

export const autocomplete = async (client: DiscordClient, interaction: AutocompleteInteraction): Promise<void> => {
    const guildId = interaction.guildId;
    if (!guildId) return;
    const userId = interaction.user.id;
    const focusedValue = interaction.options.getFocused().toLowerCase();

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
};

export const execute = async (client: DiscordClient, interaction: ChatInputCommandInteraction): Promise<void> => {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const value = interaction.options.getString('choix-overlay', true);

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
            await interaction.editReply({ content: '❌ Overlay introuvable.' });
            return;
        }

        const isLocal = Constants.getHostname().includes('localhost');
        const overlayUrl = isLocal
            ? `${Constants.getOverlayUrl()}/v2/overlay?token=${config.token}`
            : `${Constants.getOverlayUrl()}/v2/overlay.html?token=${config.token}`;

        const embed = Functions.buildEmbed(
            `### 🎥 Gestion de l'overlay de \`${config.username}\`\n` +
                `- **URL OBS (Source Navigateur)** :\n\`\`\`\n${overlayUrl}\n\`\`\`\n` +
                `⚠️ **Gardez ce lien privé.** Ne le partagez pas en public, car n'importe qui pourrait envoyer des médias sur votre écran.\n` +
                `Utilisez les boutons ci-dessous pour modifier ce lien ou le supprimer.`,
            'Blurple',
        );

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`regenerate_token_${config.token}`)
                .setLabel('Régénérer le lien')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄'),
            new ButtonBuilder()
                .setCustomId(`delete_overlay_${config.token}`)
                .setLabel("Supprimer l'overlay")
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️'),
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
        console.error('Error during manage overlays execution:', err);
        await interaction.editReply({ content: '❌ Une erreur est survenue lors du traitement.' });
    }
};
