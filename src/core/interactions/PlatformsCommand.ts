import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction } from 'discord.js';
import DiscordClient from '../DiscordClient';
import { Functions } from '../utils/Functions';
import Command from './classes/Command';

export default class PlatformsCommand extends Command {
    constructor(client: DiscordClient) {
        super(client, {
            name: 'liste-des-plateformes',
            description: 'Liste des plateformes et formats supportés.',
            dmPermission: false,
        });
    }

    async onAutocomplete(): Promise<void> {}

    async onExecute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();

        const platforms = [
            '**Discord** (*voir formats de fichiers supportés*)',
            '**Giphy**',
            '🆕 **Instagram** *Reels*',
            '**Tenor**',
            '**TikTok** *Vidéos*',
            '**Twitter** *Vidéos, Images*',
            '🆕 **YouTube** *Vidéos, Shorts*',
        ];

        const embed = Functions.buildEmbed(
            `### Plateformes supportées\n-# Triés alphabétiquement\n${Functions.formatBulletList(platforms)}\n` +
                '⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽' +
                '\n### Formats de fichiers supportés\n**Vidéo**: mp4, webm, mkv\n**Audio**: mp3, wav, ogg, flac\n**Images**: jpg, jpeg, png, gif, webp',
            'Blurple',
        );

        const starComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setEmoji('⭐')
                .setLabel('Laisser une étoile sur GitHub')
                .setStyle(ButtonStyle.Link)
                .setURL('https://github.com/Nevylish/LiveChat'),
        );

        const plusComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setStyle(ButtonStyle.Premium).setSKUId(process.env.SKU_PLUS_ID),
        );
        await interaction.editReply({
            embeds: [embed],
            components: [starComponent, plusComponent],
        });
    }
}
