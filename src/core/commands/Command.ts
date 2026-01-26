/**
 * Classe de base pour les commandes slash Discord.
 * Elle permet de définir les infos de la commande et de gérer son exécution.
 */

import { ApplicationCommandData, AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import DiscordClient from '../DiscordClient';

type CommandInfo = ApplicationCommandData;

export default abstract class Command {
    readonly client: DiscordClient;
    readonly info: CommandInfo;

    protected constructor(client: DiscordClient, info: CommandInfo) {
        this.client = client;
        this.info = info;

        client.commands.set(this.info.name, this);
    }

    abstract onAutocomplete(interaction: AutocompleteInteraction): Promise<void>;

    abstract onExecute(interaction: ChatInputCommandInteraction): Promise<void>;
}
