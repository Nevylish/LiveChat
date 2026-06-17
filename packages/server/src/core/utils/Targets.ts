import { AutocompleteInteraction } from 'discord.js';
import DiscordClient from '../DiscordClient';
import { Functions } from './Functions';

export namespace TargetsManager {
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

        if (focusedOption.name !== 'cible') return;

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
            .map((s) => {
                const username = Functions.escapeMarkdown(s.username);
                return `➜ [**Rejoindre le stream de ${username}**](https://twitch.tv/${username})`;
            })
            .join('\n');
    };
}
