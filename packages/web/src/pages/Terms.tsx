import LegalPage, { type LegalSection } from '../components/LegalPage';

const sections: LegalSection[] = [
    {
        id: 'utilisation-appropriee',
        title: '1. Utilisation appropriée',
        content:
            'Vous vous engagez à utiliser LiveChat de manière appropriée et en conformité avec les règles et politiques de Discord. Vous vous engagez à ne pas utiliser le bot pour diffuser du contenu offensant, illégal, discriminatoire, pornographique, violent ou autrement inapproprié.',
    },
    {
        id: 'confidentialite',
        title: '2. Confidentialité et données',
        content:
            "L'utilisation du tableau de bord nécessite une connexion via Discord, gérée par Supabase. Certaines données sont stockées pour le fonctionnement du service (configurations d'overlay, réglages de serveur, identifiant Discord). Les commandes /livechat sur Discord sont traitées en temps réel sans conservation des messages ou médias.\n\n" +
            'Pour le détail des données collectées, leur utilisation et vos droits, consultez notre politique de confidentialité à l\'adresse /privacy.',
    },
    {
        id: 'compte',
        title: '3. Compte et authentification',
        content:
            "L'accès au tableau de bord (gestion des overlays, réglages administrateur) requiert un compte Discord. Votre adresse e-mail est celle associée à votre compte Discord et ne peut être modifiée que depuis Discord.\n\n" +
            "Vous êtes responsable de la confidentialité de vos liens d'overlay et de l'usage qui en est fait sur votre stream. Ne partagez vos liens qu'avec des personnes de confiance.",
    },
    {
        id: 'responsabilite',
        title: '4. Responsabilité',
        content:
            "Vous êtes responsable de votre utilisation de LiveChat. Vous acceptez de ne pas utiliser le bot de manière abusive, de ne pas perturber son bon fonctionnement, ni de nuire à d'autres utilisateurs ou à des tiers.",
    },
    {
        id: 'garantie',
        title: '5. Absence de garantie',
        content:
            "LiveChat est fourni « tel quel », sans aucune garantie, explicite ou implicite. Nous ne garantissons pas que le bot sera exempt d'erreurs, de bugs, d'interruptions ou de pertes de données.",
    },
    {
        id: 'modifications',
        title: '6. Modifications',
        content:
            "Nous nous réservons le droit de modifier ces conditions d'utilisation à tout moment. Les modifications seront publiées sur le site web ou dans les informations du bot, et il est de votre responsabilité de consulter régulièrement les conditions d'utilisation.",
    },
    {
        id: 'propriete-intellectuelle',
        title: '7. Propriété intellectuelle',
        content:
            "LiveChat et tout son contenu (noms, logos, marques, etc.) sont la propriété intellectuelle de leurs propriétaires respectifs. Vous n'êtes pas autorisé à utiliser, copier ou reproduire le bot ou son contenu sans autorisation.",
    },
    {
        id: 'contact',
        title: '8. Contact',
        content:
            "Pour toute question concernant ces conditions d'utilisation, vous pouvez nous contacter à l'adresse suivante : bonjour@nevylish.fr.",
    },
];

export default function Terms() {
    return (
        <LegalPage
            seoTitle="Conditions d'utilisation - LiveChat"
            seoDescription="Conditions d'utilisation de LiveChat, le bot Discord et l'overlay de streaming. Lisez les règles d'usage avant d'utiliser le service."
            path="/terms"
            heading="Conditions d'utilisation"
            intro="En utilisant LiveChat, vous reconnaissez avoir lu, compris et accepté les conditions d'utilisation ci-dessous."
            lastUpdated="26 juin 2026"
            sections={sections}
            crossLink={{ href: '/privacy', label: 'Voir la politique de confidentialité' }}
        />
    );
}
