import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Functions } from '../../utils/Functions';
import { SupabaseService } from '../../utils/SupabaseService';

export const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
    const guildId = interaction.guildId;
    const number = interaction.options.getNumber('nombre');

    if (!guildId || number === null) return;

    if (number < 1 || number > 20) {
        const embed = Functions.buildEmbed('Vous devez fournir un nombre entre **1** et **20**.', 'Error');
        await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const settings = await SupabaseService.getGuildSettings(guildId);

    await SupabaseService.saveGuildSettings(guildId, settings?.required_role_id ?? null, number);

    const embed = Functions.buildEmbed(
        "Le nombre maximal d'overlays par personne a été défini sur **" + number + '**.',
        'Good',
    );
    await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
    });
};
