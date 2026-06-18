import { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import DiscordClient from '../DiscordClient';
import { Functions } from './Functions';

export namespace TargetsManager {
    export interface ConnectedStreamer {
        socketId: string;
        username: string;
        guildId: string;
    }

    export const EVERYONE_OPTION_LABEL = '📌 Envoyer à tous les streameurs connectés';
    export const EVERYONE_SKIP_LABEL = '📌 Passer au suivant sur tous les streams';
    export const EVERYONE_CLEAR_LABEL = "📌 Vider la file d'attente sur tous les streams";

    export const getAutocompleteSuggestions = (
        client: DiscordClient,
        interaction: AutocompleteInteraction,
        everyoneLabel: string,
    ): string[] => {
        const streamers = client.livechat.getConnectedStreamersByGuild(interaction.guildId);
        const focusedOption = interaction.options.getFocused(true);
        const focusedValue = focusedOption.value.toLowerCase();

        if (focusedOption.name !== 'cible') return [];

        let filtered = streamers
            .map((streamer) => streamer.username)
            .filter((username) => username.toLowerCase().includes(focusedValue));

        if (streamers.length >= 2 && focusedValue === '') {
            filtered = [everyoneLabel, ...filtered.filter((s) => s.toLowerCase() !== everyoneLabel.toLowerCase())];
        }

        return filtered;
    };

    export const buildStreamersList = (streamers: Array<{ username: string }>): string => {
        return streamers
            .map((s) => `➜ [**Rejoindre le stream de ${s.username}**](https://twitch.tv/${s.username})`)
            .join('\n');
    };

    export const validateAndGetTargets = async (
        client: DiscordClient,
        interaction: ChatInputCommandInteraction,
        target: string,
        everyoneLabel: string,
    ): Promise<ConnectedStreamer[] | null> => {
        const guildId = interaction.guildId;
        if (!guildId) {
            const embed = Functions.buildEmbed('Cette commande ne peut être utilisée que dans un serveur.', 'Error');
            await interaction.editReply({ embeds: [embed] });
            return null;
        }

        if (target === everyoneLabel) {
            const streamers = client.livechat.getConnectedStreamersByGuild(guildId);
            if (!streamers.length) {
                const embed = Functions.buildEmbed(`Aucun streameur n'est connecté à LiveChat.`, 'Error');
                await interaction.editReply({ embeds: [embed] });
                return null;
            }
            return streamers;
        } else {
            const streamerData = client.livechat.getStreamerData(target, guildId);
            if (!streamerData) {
                const embed = Functions.buildEmbed(`**${target}** n'est pas connecté à LiveChat.`, 'Error');
                await interaction.editReply({ embeds: [embed] });
                return null;
            }
            return [streamerData];
        }
    };
}

