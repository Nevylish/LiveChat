import {
    ApplicationCommandOptionType,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    MessageFlags,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import { Functions } from '../utils/Functions';
import { Logger } from '../utils/Logger';
import Command from './Command';

export default class LiveChatCommand extends Command {
    constructor(client: DiscordClient) {
        super(client, {
            name: 'clear',
            description: "Arrêter le LiveChat et vider la file d'attente sur le stream de quelqu'un",
            dmPermission: false,
            options: [
                {
                    name: 'cible',
                    type: ApplicationCommandOptionType.String,
                    description: 'Choisissez sur quel stream vous souhaitez arrêter le LiveChat',
                    autocomplete: true,
                    required: true,
                },
            ],
        });
    }

    everyone: string = "📌 Vider la file d'attente sur tous les streams";

    async onAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'cible') {
            const streamers = Array.from(this.client.livechat.connectedStreamers.entries())
                .filter(([_, data]) => data.guildId === interaction.guildId)
                .map(([streamer]) => streamer);

            let filtered = streamers.filter((streamer) =>
                streamer.toLowerCase().includes(focusedOption.value.toLowerCase()),
            );

            if (streamers.length >= 2 && focusedOption.value === '') {
                filtered = [this.everyone, ...filtered.filter((s) => s.toLowerCase() !== this.everyone.toLowerCase())];
            }

            await interaction.respond(filtered.map((streamer) => ({ name: streamer, value: streamer })));
        }
    }

    async onExecute(interaction: ChatInputCommandInteraction): Promise<void> {
        const target = interaction.options.getString('cible') as string;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (target === this.everyone) {
            this.broadcastToStreamers(interaction);
        } else {
            this.broadcastToStreamer(interaction, target);
        }
    }

    async broadcastToStreamers(interaction: ChatInputCommandInteraction) {
        const streamers = Array.from(this.client.livechat.connectedStreamers.entries()).filter(
            ([streamer, data]) => data.guildId === interaction.guildId,
        );

        if (streamers.length === 0) {
            const embed = Functions.buildEmbed("Aucun streameur n'est connecté sur ce serveur.", 'Alert');
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        try {
            let streamsList: string = '';

            for (const streamer of streamers) {
                this.client.livechat.io.to(streamer[1].socketId).emit('clear');

                streamsList =
                    streamsList + `\n➜ [**Rejoindre le stream de ${streamer[0]}**](https://twitch.tv/${streamer[0]})`;
            }

            const embed = Functions.buildEmbed(
                `### LiveChat arrêté et file d'attente vidée sur tous les streams\n${streamsList}`,
                'Good',
            );

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            Logger.error('LiveChatCommand', err.message);
            const embed = Functions.buildEmbed(`${err.message}`, 'Error');
            await interaction.editReply({ embeds: [embed] });
        }
    }

    async broadcastToStreamer(interaction: ChatInputCommandInteraction, target: string) {
        const streamerData = this.client.livechat.connectedStreamers.get(target);
        if (!streamerData || streamerData.guildId !== interaction.guildId) {
            const embed = Functions.buildEmbed(`${target} n'est pas connecté sur ce serveur.`, 'Alert');
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        try {
            this.client.livechat.io.to(streamerData.socketId).emit('clear');

            const embed = Functions.buildEmbed(
                `### LiveChat arrêté et file d'attente vidée sur le stream de ${target}` +
                    `\n\n➜ [**Rejoindre le stream de ${target}**](https://twitch.tv/${target})`,
                'Good',
            );

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            Logger.error('LiveChatCommand', err.message);
            const embed = Functions.buildEmbed(`${err.message}`, 'Error');
            await interaction.editReply({ embeds: [embed] });
        }
    }
}
