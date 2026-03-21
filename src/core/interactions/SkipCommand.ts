import {
    ApplicationCommandOptionType,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    MessageFlags,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import { Functions } from '../utils/Functions';
import { Logger } from '../utils/Logger';
import { TargetsManager } from '../utils/Targets';
import Command from './classes/Command';

export default class SkipCommand extends Command {
    constructor(client: DiscordClient) {
        super(client, {
            name: 'livechat-skip',
            description: "Passer au LiveChat suivant sur le stream de quelqu'un",
            dmPermission: false,
            options: [
                {
                    name: 'cible',
                    type: ApplicationCommandOptionType.String,
                    description: 'Choisissez sur quel stream vous souhaitez passer au suivant',
                    autocomplete: true,
                    required: true,
                },
            ],
        });
    }

    async onAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const suggestions = TargetsManager.getAutocompleteSuggestions(
            this.client,
            interaction,
            TargetsManager.EVERYONE_SKIP_LABEL,
        );

        await interaction.respond(suggestions.map((name) => ({ name, value: name })));
    }
    async onExecute(interaction: ChatInputCommandInteraction): Promise<void> {
        const target = interaction.options.getString('cible', true) as string;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (target === TargetsManager.EVERYONE_SKIP_LABEL) {
            this.broadcastToEveryone(interaction);
            return;
        }

        this.broadcastToTarget(interaction, target);
    }

    private async broadcastToEveryone(interaction: ChatInputCommandInteraction): Promise<void> {
        const streamers = this.client.livechat.getConnectedStreamersByGuild(interaction.guildId);

        const noStreamersEmbed = TargetsManager.checkNoStreamersConnected(streamers);
        if (noStreamersEmbed) {
            await interaction.editReply({ embeds: [noStreamersEmbed] });
            return;
        }

        try {
            this.client.livechat.io.to(streamers.map((s) => s.socketId)).emit('skip');

            const streamsList = TargetsManager.buildStreamersList(streamers);

            const embed = Functions.buildEmbed(
                `### LiveChat passé au suivant sur tous les streams\n${streamsList}`,
                'Good',
            );

            await interaction.editReply({ embeds: [embed] });
        } catch (err: any) {
            Logger.error('SkipCommand', err.message);
            const embed = Functions.buildEmbed(`${err.message}`, 'Error');
            await interaction.editReply({ embeds: [embed] });
        }
    }

    private async broadcastToTarget(interaction: ChatInputCommandInteraction, target: string): Promise<void> {
        const streamerData = this.client.livechat.getStreamerData(target, interaction.guildId);

        const notConnectedEmbed = TargetsManager.checkStreamerNotConnected(target, streamerData);
        if (notConnectedEmbed) {
            await interaction.editReply({ embeds: [notConnectedEmbed] });
            return;
        }

        try {
            this.client.livechat.io.to(streamerData.socketId).emit('skip');

            const embed = Functions.buildEmbed(
                `### LiveChat passé au suivant sur le stream de ${target}` +
                    `\n\n➜ [**Rejoindre le stream de ${target}**](https://twitch.tv/${target})`,
                'Good',
            );

            await interaction.editReply({ embeds: [embed] });
        } catch (err: any) {
            Logger.error('SkipCommand', err.message);
            const embed = Functions.buildEmbed(`${err.message}`, 'Error');
            await interaction.editReply({ embeds: [embed] });
        }
    }
}
