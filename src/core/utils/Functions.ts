import { ColorResolvable, EmbedBuilder } from 'discord.js';
import { version } from '../../../package.json';
import { Tenor } from '../modules/Tenor';
import { TikTok } from '../modules/Tiktok';
import { Twitter } from '../modules/Twitter';

export namespace Functions {
    /**
     * Ajoute le footer avec le copyright et la version.
     * @param embed EmbedBuilder
     */
    const addCopyrightFooter = (embed: EmbedBuilder): void => {
        embed.setFooter({ text: `© ${new Date().getFullYear()} Nevylish — LiveChat v${version}` });
    };

    /**
     * Créer un embed déjà préparé avec le footer et les couleurs.
     * @param description Description de l'embed.
     * @param color Couleur de l'embed.
     * @returns EmbedBuilder
     */
    export const buildEmbed = (
        description: string,
        color: 'Error' | 'Alert' | 'Good' | ColorResolvable,
    ): EmbedBuilder => {
        description =
            (color === 'Error' ? '**Erreur:** ' : '') +
            (color === 'Alert' ? '**Alerte:** ' : '') +
            description +
            (color === 'Error'
                ? "\n\n-# Contactez-moi à l'adresse bonjour@nevylish.fr ou sur le repo GitHub [Nevylish/LiveChat](https://github.com/Nevylish/LiveChat)."
                : '') +
            `\n\n[**Installer LiveChat**](https://livechat.nevylish.fr)\u2005\u2005•\u2005\u2005[**Patch notes**](https://livechat.nevylish.fr/updates.html)\u2005\u2005•\u2005\u2005[**Code source**](https://github.com/Nevylish/LiveChat)`;

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

        addCopyrightFooter(embed);
        return embed;
    };

    /**
     * Retourne le type de fichier explicitement depuis une URL.
     * @param url URL du fichier.
     * @returns Type de fichier.
     */
    export const getFileType = (url: string): string => {
        let filetype = 'Inconnu';
        let parsedUrl: URL;

        try {
            parsedUrl = new URL(url);
        } catch (e) {
            return filetype;
        }

        const extension = parsedUrl.pathname.split('.').pop()?.toLowerCase() || '';

        if (['jpg', 'jpeg', 'png'].includes(extension)) {
            if (Twitter.validateDirectUrl(url)) return 'Image Twitter';
            filetype = 'Image';
        } else if (extension === 'gif') {
            if (Tenor.validateDirectUrl(url)) return 'Image animée Tenor';
            if (Twitter.validateDirectUrl(url)) return 'Image animée Twitter';
            filetype = 'Image animée';
        } else if (['mp4', 'webm', 'mkv', 'mov'].includes(extension)) {
            if (Tenor.validateDirectUrl(url)) return 'Vidéo Tenor';
            if (Twitter.validateDirectUrl(url)) return 'Vidéo Twitter';
            filetype = 'Vidéo';
        } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
            if (Twitter.validateDirectUrl(url)) return 'Audio Twitter';
            filetype = 'Audio';
        } else if (TikTok.validateDirectUrl(url)) {
            return 'Vidéo TikTok';
        }
        return filetype;
    };
}
