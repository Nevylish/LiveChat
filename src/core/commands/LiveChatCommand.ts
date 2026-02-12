/**
 * Commande slash /livechat
 *
 * Elle permet d'envoyer un média sur une page internet, généralement une source Navigateur OBS.
 *
 * On y choisit la cible (généralement un·e streameur·euse), gérée par l'autocomplétion.
 * On y rentre ensuite une URL brute¹ vers un média (qui termine par une extension de fichier), celle-ci sera affichée sur le flux.
 *
 * ¹Exception pour les liens Tenor, Giphy et Twitter, LiveChat prend en charge les URLs raccourcies de ces plateformes. J'espère en ajouter d'autres à l'avenir.
 *
 * Puis on a des options supplémentaires:
 * - Texte: Ajoute du texte par dessus le média, centré en bas type Meme avec la police Impact.
 * - Fullscreen: Affiche le média en plein écran, utilisé en général avec des médias à fond transparent pour modifier le décors.
 */

import {
    ApplicationCommandOptionType,
    Attachment,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    MessageFlags,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import { ProxyService } from '../modules/_ProxyService';
import { Discord } from '../modules/Discord';
import { Giphy } from '../modules/Giphy';
import { Tenor } from '../modules/Tenor';
import { TikTok } from '../modules/Tiktok';
import { Twitter } from '../modules/Twitter';
import { Functions } from '../utils/Functions';
import { Logger } from '../utils/Logger';
import Command from './Command';

export default class LiveChatCommand extends Command {
    constructor(client: DiscordClient) {
        super(client, {
            name: 'livechat',
            description: "Lancer un LiveChat sur le stream de quelqu'un",
            dmPermission: false,
            options: [
                {
                    name: 'cible',
                    type: ApplicationCommandOptionType.String,
                    description: 'Choisissez sur quel stream vous souhaitez lancer le LiveChat',
                    autocomplete: true,
                    required: true,
                },
                {
                    name: 'url',
                    type: ApplicationCommandOptionType.String,
                    description:
                        'Lien du média à afficher. Formats acceptés: mp4,webm,mkv,mov,mp3,wav,ogg,jpg,jpeg,png,gif.',
                    required: false,
                },
                {
                    name: 'fichier',
                    type: ApplicationCommandOptionType.Attachment,
                    description: 'Fichier à afficher. Formats acceptés: mp4,webm,mkv,mov,mp3,wav,ogg,jpg,jpeg,png,gif.',
                    required: false,
                },
                {
                    name: 'texte',
                    type: ApplicationCommandOptionType.String,
                    description: 'Texte à afficher en dessous du média.',
                    required: false,
                },
                {
                    name: 'fullscreen',
                    type: ApplicationCommandOptionType.Boolean,
                    description: "Afficher le livechat sur tout l'écran du stream (16:9 horizontal)",
                    required: false,
                },
            ],
        });
    }

    everyone: string = '📌 Envoyer à tous les streameurs connectés';

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
        let url = interaction.options.getString('url') as string;
        let file = interaction.options.getAttachment('fichier') as Attachment;
        const text = (interaction.options.getString('texte') as string) ?? null;
        let fullscreen = (interaction.options.getBoolean('fullscreen') as boolean) ?? false;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        let parsedUrl: URL;
        let bypassProxy = false;

        if (!url && !file) {
            const embed = Functions.buildEmbed('Vous devez fournir un lien ou un fichier.', 'Alert');
            embed.setImage(
                'https://cdn.discordapp.com/attachments/1465389192384217118/1465389287825604658/livechat.gif?ex=6978ed9f&is=69779c1f&hm=f6648976eaf58ae153da91c2aabb5d7d8ac33842185bedaca7289f367534f639&',
            );
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        if (file) {
            url = file.url;
        }

        try {
            parsedUrl = new URL(url);
        } catch {
            const embed = Functions.buildEmbed(
                "Le lien n'est pas valide.\nVous devez fournir une URL commençant par http:// ou https://.",
                'Alert',
            );
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
            const embed = Functions.buildEmbed(
                "L'URL est invalide, seuls les liens commençant par http:// ou https:// sont acceptés.",
                'Error',
            );
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        if (TikTok.isTikTokUrl(url)) {
            const proxyUrl = await TikTok.getProxyUrl(url);
            if (!proxyUrl) {
                const embed = Functions.buildEmbed(
                    'Impossible de récupérer la vidéo depuis TikTok. Vérifiez le lien.',
                    'Alert',
                );
                await interaction.editReply({ embeds: [embed] });
                return;
            }
            url = proxyUrl;
        }

        if (Twitter.isStatusUrl(url)) {
            const proxyUrl = await Twitter.getProxyUrl(url);
            if (!proxyUrl) {
                const embed = Functions.buildEmbed(
                    'Impossible de récupérer le média de ce Tweet. Vérifiez le lien.',
                    'Alert',
                );
                await interaction.editReply({ embeds: [embed] });
                return;
            }
            url = proxyUrl;
        }

        if (Tenor.isShortenedUrl(url)) {
            const directUrl = await Tenor.fetchDirectUrl(url);
            if (!directUrl) {
                const embed = Functions.buildEmbed(
                    'Impossible de récupérer le GIF depuis Tenor. Vérifiez le lien.',
                    'Alert',
                );
                await interaction.editReply({ embeds: [embed] });
                return;
            }
            url = directUrl;
            bypassProxy = true;
        }

        if (Giphy.isShortenedUrl(url)) {
            const directUrl = await Giphy.fetchDirectUrl(url);
            if (!directUrl) {
                const embed = Functions.buildEmbed(
                    'Impossible de récupérer le GIF depuis Giphy. Vérifiez le lien.',
                    'Alert',
                );
                await interaction.editReply({ embeds: [embed] });
                return;
            }
            url = directUrl;
            bypassProxy = true;
        }

        const extension = parsedUrl.pathname.split('.').pop()?.toLowerCase();
        const supportedFormats = ['mp4', 'webm', 'mkv', 'mov', 'mp3', 'wav', 'ogg', 'jpg', 'jpeg', 'png', 'gif'];

        if (
            (!extension || !supportedFormats.includes(extension)) &&
            !Tenor.validateDirectUrl(url) &&
            !Giphy.validateDirectUrl(url) &&
            !ProxyService.isValidUrl(url)
        ) {
            const embed = Functions.buildEmbed(
                `Format de fichier non supporté. Formats acceptés: ${supportedFormats.join(', ')}.\n\nLes liens Tiktok, Twitter, Tenor, Giphy et Discord sont également acceptés.`,
                'Alert',
            );
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        if (Discord.isDiscordUrl(url)) bypassProxy = true;

        if (!bypassProxy && !ProxyService.isValidUrl(url)) {
            url = ProxyService.useProxy(url);
        }

        if (target === this.everyone) {
            this.broadcastToStreamers(interaction, url, fullscreen, text);
        } else {
            this.broadcastToStreamer(interaction, target, url, fullscreen, text);
        }
    }

    async broadcastToStreamers(
        interaction: ChatInputCommandInteraction,
        url: string,
        fullscreen: boolean,
        text: string,
    ) {
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
            let filetype = Functions.getFileType(url).display;

            if ('Audio'.includes(filetype)) fullscreen = true;

            for (const streamer of streamers) {
                this.client.livechat.io.to(streamer[1].socketId).emit('broadcast', {
                    content: url,
                    from: interaction.user,
                    fullscreen,
                    text,
                });

                streamsList =
                    streamsList + `\n➜ [**Rejoindre le stream de ${streamer[0]}**](https://twitch.tv/${streamer[0]})`;
            }

            const embed = Functions.buildEmbed(
                `### LiveChat envoyé à tous les streameurs connectés` +
                    `\n\nType de fichier: **${filetype}${text ? ' + Texte' : ''}${fullscreen && !'Audio'.includes(filetype) ? ' en plein écran' : ''}**` +
                    `\n${streamsList}`,
                'Good',
            );

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            Logger.error('LiveChatCommand', err.message);
            const embed = Functions.buildEmbed(
                `Une erreur est survenue lors de l'envoi du LiveChat.\n${err.message}`,
                'Error',
            );
            await interaction.editReply({ embeds: [embed] });
        }
    }

    async broadcastToStreamer(
        interaction: ChatInputCommandInteraction,
        target: string,
        url: string,
        fullscreen: boolean,
        text: string,
    ) {
        const streamerData = this.client.livechat.connectedStreamers.get(target);
        if (!streamerData || streamerData.guildId !== interaction.guildId) {
            const embed = Functions.buildEmbed(`${target} n'est pas connecté sur ce serveur.`, 'Alert');
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        try {
            let filetype = Functions.getFileType(url).display;

            if ('Audio'.includes(filetype)) fullscreen = true;

            this.client.livechat.io.to(streamerData.socketId).emit('broadcast', {
                content: url,
                from: interaction.user,
                fullscreen,
                text,
            });

            const embed = Functions.buildEmbed(
                `### LiveChat envoyé sur le stream de ${target}` +
                    `\n\nType de fichier: **${filetype}${text ? ' + Texte' : ''}${fullscreen && !'Audio'.includes(filetype) ? ' en plein écran' : ''}**` +
                    `\n\n➜ [**Rejoindre le stream de ${target}**](https://twitch.tv/${target})`,
                'Good',
            );

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            Logger.error('LiveChatCommand', err.message);
            const embed = Functions.buildEmbed(
                `Une erreur est survenue lors de l'envoi du LiveChat.\n${err.message}`,
                'Error',
            );
            await interaction.editReply({ embeds: [embed] });
        }
    }
}
