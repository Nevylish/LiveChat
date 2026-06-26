import LegalPage, { type LegalSection } from '../components/LegalPage';

const sections: LegalSection[] = [
    {
        id: 'donnees-collectees',
        title: '1. Données collectées',
        content:
            "Lorsque vous utilisez le tableau de bord sur livechat.nevylish.fr, vous vous connectez via Discord (OAuth). Supabase gère l'authentification et stocke notamment votre identifiant Discord, votre adresse e-mail et les informations de profil transmises par Discord (pseudo, nom d'affichage, avatar).\n\n" +
            "Pour le fonctionnement du service, nous enregistrons également dans notre base de données (Supabase) : vos configurations d'overlay (pseudo choisi, jeton d'accès, identifiant du serveur Discord, identifiant utilisateur, date de modification) et, pour les administrateurs de serveur, les réglages du serveur (rôle requis, limite d'overlays par membre).\n\n" +
            "Le bot Discord traite les commandes /livechat en temps réel : les messages, médias et fichiers envoyés via Discord ne sont pas stockés par LiveChat. Les médias sont relayés temporairement via notre proxy pour les afficher sur l'overlay, sans conservation durable du contenu.\n\n" +
            "Nous n'utilisons pas de cookies publicitaires ni d'outils d'analyse comportementale sur ce site.",
    },
    {
        id: 'utilisation',
        title: '2. Utilisation des données',
        content:
            'Les données collectées servent uniquement à fournir et sécuriser le service LiveChat : authentifier les utilisateurs, créer et gérer les overlays, appliquer les restrictions par rôle sur les serveurs Discord, et permettre aux administrateurs de gérer les configurations de leur communauté.\n\n' +
            'Vos données ne sont ni vendues, ni louées, ni utilisées à des fins publicitaires.',
    },
    {
        id: 'cookies',
        title: '3. Cookies et stockage local',
        content:
            "La connexion via Supabase utilise un stockage local dans votre navigateur (session d'authentification) afin de maintenir votre connexion entre les visites. Il s'agit d'un stockage technique nécessaire au fonctionnement du tableau de bord.\n\n" +
            "Nous n'utilisons pas de cookies de suivi publicitaire ou analytique. Aucun pistage de navigation à des fins marketing n'est effectué.",
    },
    {
        id: 'sous-traitants',
        title: '4. Sous-traitants et services tiers',
        content:
            "LiveChat s'appuie sur les services suivants, chacun soumis à sa propre politique de confidentialité :\n\n" +
            '• Discord — authentification OAuth et fonctionnement du bot (discord.com/privacy)\n' +
            '• Supabase — authentification et base de données (supabase.com/privacy)\n' +
            '• Cloudflare — relais des médias via le proxy (cloudflare.com/privacypolicy)\n' +
            '• Vercel — hébergement du site web (vercel.com/legal/privacy-policy)\n\n' +
            "En vous connectant avec Discord, vous acceptez que les données nécessaires à l'authentification soient transmises à ces services dans le cadre du fonctionnement de LiveChat.",
    },
    {
        id: 'securite',
        title: '5. Sécurité',
        content:
            "Nous appliquons des mesures techniques pour protéger l'intégrité du service : authentification sécurisée via Supabase, jetons d'accès pour les overlays, et relais des médias via un proxy afin de limiter l'exposition des adresses IP des streameurs.\n\n" +
            "Aucun système n'est totalement invulnérable ; nous vous invitons à ne partager vos liens d'overlay qu'avec des personnes de confiance.",
    },
    {
        id: 'conservation',
        title: '6. Conservation des données',
        content:
            "Vos configurations d'overlay et les réglages de serveur sont conservés tant que vous les utilisez activement ou que le bot reste présent sur le serveur concerné.\n\n" +
            "Vous pouvez supprimer un overlay individuellement depuis le tableau de bord. La suppression de l'ensemble de votre compte et de toutes vos données associées sera proposée depuis la page Mon compte (fonctionnalité en cours de déploiement). En attendant, vous pouvez nous contacter à bonjour@nevylish.fr pour toute demande de suppression.",
    },
    {
        id: 'vos-droits',
        title: '7. Vos droits',
        content:
            "Conformément au Règlement général sur la protection des données (RGPD), vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition concernant vos données personnelles.\n\n" +
            'Pour exercer ces droits, contactez-nous à bonjour@nevylish.fr. Vous pouvez également retirer LiveChat de votre serveur Discord à tout moment, ou vous déconnecter du tableau de bord pour mettre fin à votre session.\n\n' +
            "Vous avez le droit d'introduire une réclamation auprès de la CNIL (cnil.fr) si vous estimez que le traitement de vos données n'est pas conforme.",
    },
    {
        id: 'hebergement',
        title: '8. Hébergement',
        content:
            '• Bot Discord et API : OVH SAS, 2 rue Kellermann, 59100 Roubaix, France\n' +
            '• Site web : Vercel Inc., États-Unis\n' +
            '• Authentification et base de données : Supabase Inc.\n' +
            '• Proxy média : Cloudflare Inc.',
    },
    {
        id: 'editeur',
        title: '9. Éditeur',
        content:
            'Le site internet et le bot Discord LiveChat sont édités par Nevylish agissant sous pseudonyme pour STRASS CHAT MIAOU, entreprise individuelle immatriculée sous le numéro SIRET 99933061600023, dont le siège est situé au 173 rue de Courcelles, 75017 Paris, France (contact : bonjour@nevylish.fr).',
    },
    {
        id: 'modifications',
        title: '10. Modifications de la politique',
        content:
            'Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications seront publiées sur cette page avec une date de mise à jour révisée. Il est de votre responsabilité de consulter régulièrement cette politique.',
    },
];

export default function Privacy() {
    return (
        <LegalPage
            seoTitle="Politique de confidentialité - LiveChat"
            seoDescription="Politique de confidentialité de LiveChat : données collectées via Discord et Supabase, utilisation, conservation et vos droits RGPD."
            path="/privacy"
            heading="Politique de confidentialité"
            intro="Nous accordons une grande importance à la protection de vos données. En utilisant LiveChat, vous acceptez cette politique de confidentialité."
            lastUpdated="26 juin 2026"
            sections={sections}
            crossLink={{ href: '/terms', label: "Voir les conditions d'utilisation" }}
        />
    );
}
