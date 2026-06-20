import { ButtonBuilder, ButtonStyle, ColorResolvable, EmbedBuilder } from 'discord.js';
import { version } from '../../../package.json';
import DiscordClient from '../DiscordClient';
import { ProxyService } from '../modules/_ProxyService';
import { Giphy } from '../modules/Giphy';
import { Instagram } from '../modules/Instagram';
import { Tenor } from '../modules/Tenor';
import { Constants } from './Constants';

export namespace Functions {
    const addVersionFooter = (embed: EmbedBuilder): void => {
        embed.setFooter({ text: `LiveChat v${version} - Dernière mise à jour: 20/06/2026` });
    };

    export const buildEmbed = (
        description: string,
        color: 'Error' | 'Alert' | 'Good' | ColorResolvable,
    ): EmbedBuilder => {
        description =
            (color === 'Error' ? '**Erreur:** ' : '') +
            (color === 'Alert' ? '**Alerte:** ' : '') +
            description +
            (color === 'Error'
                ? `\n\n-# Si vous pensez qu'il s'agit d'un bug, contactez moi sur Twitter [@Nevylish](https://x.com/Nevylish) ou créez une [issue sur GitHub](https://github.com/Nevylish/LiveChat/issues).`
                : '') +
            `\n\n-# [**Installer LiveChat**](${Constants.getBaseUrl()})\u2005\u2005•\u2005\u2005[**Voir les patch notes**](${Constants.getUrl('updates')})`;

        switch (color) {
            case 'Error':
                color = 0xff614d;
                break;
            case 'Alert':
                color = 0xffa94d;
                break;
            case 'Good':
                color = 0x75ff7a;
                break;
        }

        const embed = new EmbedBuilder().setDescription(description).setColor(color as ColorResolvable);

        addVersionFooter(embed);
        return embed;
    };

    export const buildPremiumButton = async (client: DiscordClient, guildId: string): Promise<ButtonBuilder | null> => {
        const isPremiumGuild = await client.hasGuildPremiumSubscription(guildId);

        if (isPremiumGuild) {
            return new ButtonBuilder().setStyle(ButtonStyle.Premium).setSKUId(process.env.SKU_PLUS_ID!);
        }

        return null;
    };

    /* Utilisé uniquement si c'est une URL du proxy */
    export const getSourceDisplayName = (name: string | null): string | null => {
        if (!name) return null;
        switch (name) {
            case 'instagram':
                return 'Instagram';
            case 'tiktok':
                return 'TikTok';
            case 'twitter':
                return 'Twitter';
            case 'youtube':
                return 'YouTube';
            default:
                return null;
        }
    };

    export const getMediaType = (url: string): { display: string; param: string } => {
        let display = 'Inconnu';
        let param = 'null';
        let parsedUrl: URL;

        try {
            parsedUrl = new URL(url);
        } catch {
            return { display, param };
        }

        const extension = parsedUrl.pathname.split('.').pop()?.toLowerCase() || '';

        if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
            display = 'Image';
            param = 'image';
        } else if (extension === 'gif') {
            display = 'Image animée';
            param = 'image';
        } else if (['mp4', 'webm', 'mkv', 'mov'].includes(extension)) {
            display = 'Vidéo';
            param = 'video';
        } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
            display = 'Audio';
            param = 'audio';
        } else if (ProxyService.isProxyUrl(url)) {
            switch (parsedUrl.searchParams.get('type')) {
                case 'image':
                    display = 'Image';
                    param = 'image';
                    break;
                case 'video':
                    display = 'Vidéo';
                    param = 'video';
                    break;
                case 'audio':
                    display = 'Audio';
                    param = 'audio';
                    break;
                default:
                    break;
            }
        }

        let sourceDisplayName = getSourceDisplayName(parsedUrl.searchParams.get('source'));
        if (!sourceDisplayName) {
            if (Instagram.validateDirectUrl(url)) sourceDisplayName = 'Instagram';
            else if (Tenor.validateDirectUrl(url)) sourceDisplayName = 'Tenor';
            else if (Giphy.validateDirectUrl(url)) sourceDisplayName = 'Giphy';
        }

        if (sourceDisplayName) {
            display += ` ${sourceDisplayName}`;
        }

        return { display: display, param: param };
    };

    export const formatDurationMs = (ms: number) => {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

        let res = '';
        if (hours > 0) {
            if (minutes === 0 && seconds === 0) {
                return `${hours < 10 ? '0' : ''}${hours}h00m00s`;
            } else {
                res += `${hours < 10 ? '0' : ''}${hours}h`;
            }
        }

        if (minutes > 0) {
            if (seconds === 0) {
                return `${res}${minutes < 10 ? '0' : ''}${minutes}m00s`;
            } else {
                res += `${minutes < 10 ? '0' : ''}${minutes}m`;
            }
        }

        return `${res}${seconds < 10 ? '0' : ''}${seconds}s`;
    };

    export const formatBulletList = (items: string[]): string => {
        return items.map((item) => `- ${item}`).join('\n');
    };

    export const escapeMarkdown = (text: string): string => {
        const unescaped = text.replace(/\\(\*|_|`|~|\\)/g, '$1');
        const escaped = unescaped.replace(/(\*|_|`|~|\\)/g, '\\$1');
        return escaped;
    };
}
