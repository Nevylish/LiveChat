import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import DiscordClient from '../DiscordClient';
import Command from './classes/Command';

export default class SubscriptionCommand extends Command {
    constructor(client: DiscordClient) {
        super(client, {
            name: 'abonnement',
            description: 'Découvrez LiveChat Plus et soutenez le projet.',
            dmPermission: false,
        });
    }

    async onAutocomplete(): Promise<void> {}

    async onExecute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();

        const embed = new EmbedBuilder()
            .setAuthor({
                name: 'Hey ' + interaction.user.displayName,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setDescription(
                "Découvrez l'abonnement LiveChat Plus." +
                    "\nIl permet de financer le coût de l'hébergement et du développement." +
                    "\n\n> L'abonnement n'est pas obligatoire pour profiter de LiveChat, c'est surtout du bonus et une manière de soutenir le projet.",
            )

            .setColor('Blurple');

        const plusEmbed = new EmbedBuilder()
            .setTitle('LiveChat Plus - 1,99$/mois')
            .setThumbnail(
                'https://cdn.discordapp.com/attachments/1465389192384217118/1474643121332817940/livechat_plus.png?ex=699a97ed&is=6999466d&hm=611c469f8893d9e09d5697bf96695c40e9b6e5ff60d59544c8b80995870dc265&',
            )
            .setDescription('Repoussez un peu plus les limites en souscrivant à LiveChat Plus.')
            .setFooter({
                text: 'Plan mensuel sans engagement',
            })
            .addFields([
                {
                    name: 'Emplacements de streameurs',
                    value: '10 -> 20',
                },
            ])
            .setColor('Blurple');

        const plusComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setStyle(ButtonStyle.Premium).setSKUId(process.env.SKU_PLUS_ID),
        );

        const starComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setEmoji('⭐')
                .setLabel('Laisser une étoile sur GitHub')
                .setStyle(ButtonStyle.Link)
                .setURL('https://github.com/Nevylish/LiveChat'),
        );

        await interaction.editReply({ embeds: [embed, plusEmbed], components: [plusComponent, starComponent] });
    }
}
