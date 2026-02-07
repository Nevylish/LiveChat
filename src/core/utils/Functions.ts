/*
    Ce fichier permet de centraliser des fonctions qui sont utilisées à plusieurs endroits dans le projet.
    On évite de dupliquer inutilement des lignes.
*/

import { ColorResolvable, EmbedBuilder } from 'discord.js';
import { version } from '../../../package.json';
import { ProxyService } from '../modules/_ProxyService';
import { Tenor } from '../modules/Tenor';

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

        addCopyrightFooter(embed);
        return embed;
    };

    /**
     * Retourne le type de fichier explicitement depuis une URL.
     * @param url URL du fichier.
     * @returns Type de fichier.
     */
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

        if (['jpg', 'jpeg', 'png'].includes(extension)) {
            display = 'Image';
            param = 'image';
        } else if (extension === 'gif') {
            display = 'Image animée';
            if (Tenor.validateDirectUrl(url)) display = 'Image animée Tenor';
            param = 'image';
        } else if (['mp4', 'webm', 'mkv', 'mov'].includes(extension)) {
            display = 'Vidéo';
            param = 'video';
        } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
            display = 'Audio';
            param = 'audio';
        } else if (ProxyService.isValidUrl(url)) {
            switch (parsedUrl.searchParams.get('type')) {
                case 'image':
                    display = 'Image';
                    if (parsedUrl.searchParams.get('source') === 'twitter') display = 'Image Twitter';
                    param = 'image';
                    break;
                case 'video':
                    display = 'Vidéo';
                    if (parsedUrl.searchParams.get('source') === 'twitter') display = 'Vidéo Twitter';
                    if (parsedUrl.searchParams.get('source') === 'tiktok') display = 'Vidéo TikTok';
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
        return { display: display, param: param };
    };
}
