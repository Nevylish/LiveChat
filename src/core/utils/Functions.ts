import { ColorResolvable, EmbedBuilder } from 'discord.js';

export namespace Functions {
    export const buildEmbed = (
        description: string,
        color: 'Error' | 'Alert' | 'Good' | ColorResolvable,
    ): EmbedBuilder => {
        description =
            (color === 'Error' ? '**Erreur:** ' : '') +
            (color === 'Alert' ? '**Alerte:** ' : '') +
            description +
            (color === 'Error'
                ? "\n\n-# Contactez-moi à l'adresse bonjour@nevylish.fr ou sur Twitter @Nevylish](https://x.com/Nevylish)."
                : '') +
            `\n\n[**Installer LiveChat**](https://livechat.nevylish.fr)\u2005\u2005•\u2005\u2005[**Voir les mises à jour**](https://livechat.nevylish.fr/updates.html)`;

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

        return embed;
    };

    export const getFileType = (url: string): { display: string; param: string } => {
        let display = 'Inconnu';
        let param = 'null';
        let parsedUrl: URL;

        try {
            parsedUrl = new URL(url);
        } catch (e) {
            return null;
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
        }

        return { display: display, param: param };
    };
}
