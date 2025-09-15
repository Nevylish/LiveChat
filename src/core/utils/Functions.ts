/*
 * Copyright (C) 2025 LiveChat by Nevylish
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Tenor } from '../modules/Tenor';
import { version } from '../../../package.json';
import { ColorResolvable, EmbedBuilder } from 'discord.js';

export namespace Functions {
    export const addCopyrightFooter = (embed: EmbedBuilder): void => {
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

    export const getFileExtension = (url: string) => {
        let filetype = 'Inconnu';
        let parsedUrl: URL;

        try {
            parsedUrl = new URL(url);
        } catch (e) {
            return filetype;
        }

        const extension = parsedUrl.pathname.split('.').pop()?.toLowerCase() || '';

        if (['jpg', 'jpeg', 'png'].includes(extension)) {
            filetype = 'Image';
        } else if (extension === 'gif') {
            if (Tenor.validateDirectUrl(url)) {
                filetype = 'Image animée Tenor';
            } else {
                filetype = 'Image animée';
            }
        } else if (['mp4', 'webm', 'mkv', 'mov'].includes(extension)) {
            filetype = 'Vidéo';
        } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
            filetype = 'Audio';
        }
        return filetype;
    };
}
