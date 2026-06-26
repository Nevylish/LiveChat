import Footer from '../components/Footer';
import Header from '../components/Header';
import Seo from '../components/Seo';

const sections = [
    {
        title: '1. Utilisation appropriée',
        content:
            'Vous vous engagez à utiliser LiveChat de manière appropriée et en conformité avec les règles et politiques de Discord. Vous vous engagez à ne pas utiliser le bot pour diffuser du contenu offensant, illégal, discriminatoire, pornographique, violent ou autrement inapproprié.',
    },
    {
        title: '2. Confidentialité',
        content:
            "Le bot LiveChat et le site web ne collectent aucune donnée personnelle, d'utilisateur, de message ou de serveur.",
    },
    {
        title: '3. Responsabilité',
        content:
            "Vous êtes responsable de votre utilisation de LiveChat. Vous acceptez de ne pas utiliser le bot de manière abusive, de ne pas perturber son bon fonctionnement, ni de nuire à d'autres utilisateurs ou à des tiers.",
    },
    {
        title: '4. Absence de garantie',
        content:
            "LiveChat est fourni « tel quel », sans aucune garantie, explicite ou implicite. Nous ne garantissons pas que le bot sera exempt d'erreurs, de bugs, d'interruptions ou de pertes de données.",
    },
    {
        title: '5. Modifications',
        content:
            "Nous nous réservons le droit de modifier ces conditions d'utilisation à tout moment. Les modifications seront publiées sur le site web ou dans les informations du bot, et il est de votre responsabilité de consulter régulièrement les conditions d'utilisation.",
    },
    {
        title: '6. Propriété intellectuelle',
        content:
            "LiveChat et tout son contenu (noms, logos, marques, etc.) sont la propriété intellectuelle de leurs propriétaires respectifs. Vous n'êtes pas autorisé à utiliser, copier ou reproduire le bot ou son contenu sans autorisation.",
    },
    {
        title: '7. Contact',
        content:
            "Pour toute question concernant ces conditions d'utilisation, vous pouvez nous contacter à l'adresse suivante: bonjour@nevylish.fr.",
    },
];

export default function Terms() {
    return (
        <div className="flex min-h-screen flex-col text-foreground">
            <Seo
                title="Conditions d'utilisation - LiveChat"
                description="Conditions d'utilisation de LiveChat, le bot Discord et l'overlay de streaming. Lisez les règles d'usage avant d'utiliser le service."
                path="/terms"
            />
            <Header />

            <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
                <div className="mb-8 border-b border-border pb-8">
                    <h1 className="text-2xl font-bold sm:text-3xl">Conditions d'utilisation</h1>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                        En utilisant LiveChat, vous reconnaissez avoir lu, compris et accepté les conditions
                        d'utilisation ci-dessous.
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground/60">Dernière mise à jour : 8 juin 2026</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {sections.map((section) => (
                        <div key={section.title} className="rounded-lg border border-border bg-card p-5 sm:p-6">
                            <h2 className="text-sm font-semibold sm:text-base">{section.title}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.content}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-10 flex flex-wrap justify-center gap-3">
                    <a
                        href="/privacy"
                        className="rounded-full border border-border px-5 py-2 text-sm font-semibold transition-colors hover:bg-accent"
                    >
                        Voir la politique de confidentialité
                    </a>
                    <a
                        href="/"
                        className="rounded-full border border-border px-5 py-2 text-sm font-semibold transition-colors hover:bg-accent"
                    >
                        ← Retour à l'accueil
                    </a>
                </div>
            </main>

            <Footer />
        </div>
    );
}
