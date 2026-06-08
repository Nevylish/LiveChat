import Footer from '../components/Footer';
import Header from '../components/Header';

const sections = [
    {
        title: '1. Données collectées',
        content:
            "Le bot LiveChat ne collecte aucune donnée personnelle, aucun message d'utilisateur ni aucune information de serveur. Le bot traite uniquement les commandes en temps réel sans stockage.\n\nCependant, ce site web utilise Google Analytics pour collecter des données anonymes de navigation (pages visitées, temps passé, type d'appareil) afin de mesurer les performances.",
    },
    {
        title: '2. Utilisation des données',
        content:
            "Les données relatives au bot ne sont pas stockées. Les données de navigation du site web collectées par Google Analytics sont utilisées uniquement à des fins statistiques pour améliorer l'expérience utilisateur et la performance du site.",
    },
    {
        title: '3. Cookies et technologies similaires',
        content:
            "Ce site utilise des cookies liés à Google Analytics. Vous avez le choix d'accepter ou de refuser ces cookies via la bannière qui s'affiche lors de votre première visite. Votre consentement est sauvegardé pour une durée limitée mais peut être révoqué à tout moment en effaçant les données de votre navigateur.",
    },
    {
        title: '4. Données de tiers',
        content:
            "LiveChat fonctionne via Discord et est soumis à la politique de confidentialité de Discord concernant les données des serveurs et des utilisateurs. Nous vous invitons à consulter la politique de confidentialité de Discord pour plus d'informations.",
    },
    {
        title: '5. Sécurité',
        content:
            "Bien qu'aucune donnée ne soit stockée, nous appliquons des pratiques de sécurité appropriées pour protéger l'intégrité du bot.",
    },
    {
        title: '6. Droits des utilisateurs',
        content:
            "Puisque nous ne collectons aucune donnée, il n'y a aucune donnée à consulter, modifier ou supprimer. Cependant, vous pouvez retirer LiveChat de votre serveur Discord et de votre client OBS Studio à tout moment.",
    },
    {
        title: '7. Hébergement',
        content:
            'Le bot Discord et le site internet de LiveChat sont hébergés en France chez OVH SAS, dont le siège social est situé au 2 rue Kellermann - 59100 Roubaix - France (contact : +33 9 72 10 10 07).',
    },
    {
        title: '8. Éditeur',
        content:
            "Le bot Discord et le site internet de LiveChat sont édités sous le nom commercial STRASS CHAT MIAOU. Conformément à la loi, les coordonnées personnelles de l'éditeur ont été transmises à l'hébergeur du site. L'éditeur est joignable à l'adresse e-mail suivante : bonjour@nevylish.fr.",
    },
    {
        title: '9. Modifications de la politique',
        content:
            'Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications seront publiées sur ce site web et il est de votre responsabilité de consulter régulièrement cette politique.',
    },
];

export default function Privacy() {
    return (
        <div className="dark flex min-h-screen flex-col text-foreground">
            <Header />

            <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:px-6 sm:py-12">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold sm:text-3xl">Politique de confidentialité</h1>
                    <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                        Nous accordons une grande importance à la protection de vos données, en utilisant LiveChat, vous
                        acceptez cette politique de confidentialité.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground opacity-60 sm:text-sm">
                        Dernière mise à jour : 11 février 2026
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {sections.map((section) => (
                        <div key={section.title} className="rounded-xl border border-border bg-white/[0.02] p-5 sm:p-6">
                            <h2 className="text-base font-semibold sm:text-lg">{section.title}</h2>
                            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                                {section.content}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-10 flex flex-wrap justify-center gap-3">
                    <a
                        href="/terms"
                        className="rounded-full border border-border px-5 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-white/5"
                    >
                        Voir les conditions d'utilisation
                    </a>
                    <a
                        href="/"
                        className="rounded-full border border-border px-5 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-white/5"
                    >
                        ← Retour à l'accueil
                    </a>
                </div>
            </main>

            <Footer />
        </div>
    );
}
