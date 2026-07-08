import { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import DiscordClient from '../../DiscordClient';
import { Functions } from '../../utils/Functions';
import { SupabaseService } from '../../utils/SupabaseService';

export const autocomplete = async (interaction: AutocompleteInteraction): Promise<void> => {
    const guildId = interaction.guildId;
    if (!guildId) return;
    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name === 'rôle') {
        const settings = await SupabaseService.getGuildSettings(guildId);
        const focusedValue = focusedOption.value.toLowerCase();
        const roles = interaction.guild?.roles.cache.filter((r) => r.name !== '@everyone') || [];

        const currentRoleId = settings?.required_role_id;
        let currentChoice = { name: "Aucune restriction n'est appliquée", value: 'none' };

        if (currentRoleId) {
            const currentRole =
                interaction.guild?.roles.cache.get(currentRoleId) ||
                (await interaction.guild?.roles.fetch(currentRoleId).catch(() => null));
            currentChoice = {
                name: `Actuellement : ${currentRole ? currentRole.name : 'Rôle inconnu'}`,
                value: currentRoleId,
            };
        }

        const allChoices = [
            currentChoice,
            ...(currentRoleId ? [{ name: 'Désactiver la restriction', value: 'none' }] : []),
            { name: '▬▬▬▬ Liste des rôles ▬▬▬▬', value: 'divider' },
            ...Array.from(roles.values()).map((r) => ({ name: r.name, value: r.id })),
        ];

        const filtered = allChoices.filter((choice) => choice.name.toLowerCase().includes(focusedValue)).slice(0, 25);

        await interaction.respond(filtered);
    }
};

export const execute = async (client: DiscordClient, interaction: ChatInputCommandInteraction): Promise<void> => {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const guild = interaction.guild || (await client.guilds.fetch(guildId).catch(() => null));
    if (!guild) return;

    const roleValue = interaction.options.getString('rôle', true);
    const settings = await SupabaseService.getGuildSettings(guildId);

    if (roleValue === 'none') {
        if (!settings?.required_role_id) {
            const embed = Functions.buildEmbed('La restriction de rôle est déjà désactivée sur ce serveur.', 'Alert');
            await interaction.reply({ embeds: [embed] });
            return;
        }

        await SupabaseService.saveGuildSettings(guildId, null, settings?.max_overlays_per_user);

        const embed = Functions.buildEmbed(
            'La restriction de rôle a bien été retirée. Tout le monde peut maintenant configurer et utiliser LiveChat sur ce serveur.',
            'Good',
        );
        await interaction.reply({ embeds: [embed] });
    } else {
        const role = guild.roles.cache.get(roleValue);
        if (!role) {
            const embed = Functions.buildEmbed(
                `Rôle invalide ou introuvable. Veuillez utiliser l'autocomplétion pour choisir un rôle.`,
                'Error',
            );
            await interaction.reply({ embeds: [embed] });
            return;
        }

        if (settings?.required_role_id === role.id) {
            const embed = Functions.buildEmbed(
                `Le rôle requis pour configurer ou utiliser LiveChat sur ce serveur est déjà défini sur <@&${role.id}>.`,
                'Alert',
            );
            await interaction.reply({ embeds: [embed] });
            return;
        }

        await SupabaseService.saveGuildSettings(guildId, role.id, settings?.max_overlays_per_user);

        const embed = Functions.buildEmbed(
            `Le rôle requis pour configurer ou utiliser LiveChat sur ce serveur a été défini sur <@&${role.id}>.\nSeuls les membres avec ce rôle (et les administrateurs) y auront accès.`,
            'Good',
        );
        await interaction.reply({ embeds: [embed] });
    }
};
