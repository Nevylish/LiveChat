import type { BrowserSourceGuideConfig } from './BrowserSourceGuide';

export const LIVECHAT_HIDE_BACKGROUND_CSS = 'body:not(.livechat-overlay) { display: none !important; }';

export const obsGuide: BrowserSourceGuideConfig = {
    guideTitle: 'Guide : Installer LiveChat sur OBS Studio',
    steps: [
        {
            title: 'Ajouter une source Navigateur',
            text: 'Dans OBS Studio, faites un clic droit dans votre panneau de Sources, cliquez sur "Ajouter", puis sélectionnez "Navigateur".',
        },
        {
            title: "Entrer l'URL de l'overlay",
            text: 'Collez l\'URL de l\'overlay ci-dessus dans le champ "URL" des propriétés de la source.',
        },
        {
            title: 'Définir les dimensions',
            text: 'Configurez la Largeur sur 1920 et la Hauteur sur 1080 (ou adaptez à votre résolution) pour un positionnement optimal.',
        },
        {
            title: "Contrôler l'audio",
            text: 'Cochez "Contrôler l\'audio via OBS" afin de gérer ou couper le son directement depuis votre mixeur audio.',
        },
        {
            title: 'Masquer le fond noir (CSS)',
            text: 'Collez la règle CSS suivante dans "CSS personnalisé" d\'OBS pour masquer le fond noir lorsque le chat est inactif :',
            css: LIVECHAT_HIDE_BACKGROUND_CSS,
        },
        {
            title: 'Monitoring audio',
            text: 'Dans le Mélangeur Audio d\'OBS, cliquez sur les options de la source > Propriétés audio avancées > réglez sur "Monitoring et sortie" pour entendre les alertes dans votre casque.',
        },
    ],
};

export const streamlabsGuide: BrowserSourceGuideConfig = {
    guideTitle: 'Guide : Installer LiveChat sur Streamlabs Desktop',
    steps: [
        {
            title: 'Ajouter une source Navigateur',
            text: 'Dans Streamlabs Desktop, ouvrez l\'éditeur de scène, cliquez sur le bouton "+" des sources, puis sélectionnez "Navigateur".',
        },
        {
            title: "Entrer l'URL de l'overlay",
            text: 'Collez l\'URL de l\'overlay ci-dessus dans le champ "URL" des propriétés de la source.',
        },
        {
            title: 'Définir les dimensions',
            text: 'Configurez la Largeur sur 1920 et la Hauteur sur 1080 (ou adaptez à votre résolution) pour un positionnement optimal.',
        },
        {
            title: 'Masquer le fond noir (CSS)',
            text: 'Collez la règle CSS suivante dans "CSS personnalisé" de la source pour masquer le fond noir lorsque le chat est inactif :',
            css: LIVECHAT_HIDE_BACKGROUND_CSS,
        },
        {
            title: "Contrôler l'audio",
            text: 'Activez le contrôle audio de la source dans le mixeur pour gérer ou couper le son directement depuis Streamlabs.',
        },
    ],
};
