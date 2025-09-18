/*
 * Copyright (C) 2025 LiveChat by Nevylish
 */

import { Tenor } from '../modules/Tenor';
import { version } from '../../../package.json';
import { ColorResolvable, EmbedBuilder } from 'discord.js';
import { Twitter } from '../modules/Twitter';

export namespace Functions {
    const addCopyrightFooter = (embed: EmbedBuilder): void => {
        embed.setFooter({ text: `© 2025 LiveChat — Tous droits réservés. | Build v${version}` });
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
                ? "\n\n-# Contactez-moi à l'adresse bonjour@nevylish.fr ou sur le repo GitHub [Nevylish/LiveChat](https://github.com/Nevylish/LiveChat)."
                : '') +
            `\n\n[Installer LiveChat](https://livechat.nevylish.fr)᲼•᲼[Patch notes](https://livechat.nevylish.fr/updates.html)᲼•᲼[Code source](https://github.com/Nevylish/LiveChat)`;

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

    export const getFileType = (url: string): string => {
        let filetype = 'Inconnu';
        let parsedUrl: URL;

        try {
            parsedUrl = new URL(url);
        } catch (e) {
            return filetype;
        }

        const extension = parsedUrl.pathname.split('.').pop()?.toLowerCase() || '';

        // Manque Twitter mais c'est un peu de la merde cette fonction
        if (['jpg', 'jpeg', 'png'].includes(extension)) {
            if (Twitter.validateDirectUrl(url)) return 'Image Twitter';
            filetype = 'Image';
        } else if (extension === 'gif') {
            if (Tenor.validateDirectUrl(url)) return 'Image animée Tenor';
            if (Twitter.validateDirectUrl(url)) return 'Image animée Twitter';
            filetype = 'Image animée Tenor';
        } else if (['mp4', 'webm', 'mkv', 'mov'].includes(extension)) {
            if (Tenor.validateDirectUrl(url)) return 'Vidéo Tenor';
            if (Twitter.validateDirectUrl(url)) return 'Vidéo Twitter';
            filetype = 'Vidéo';
        } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
            if (Twitter.validateDirectUrl(url)) return 'Audio Twitter';
            filetype = 'Audio';
        }
        return filetype;
    };
}
