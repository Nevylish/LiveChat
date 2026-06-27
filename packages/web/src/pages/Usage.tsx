import { ChevronDown, MessageSquareText, MonitorPlay, Send } from 'lucide-react';
import { useEffect } from 'react';
import type { IconType } from 'react-icons';
import { RiFilmLine } from 'react-icons/ri';
import { SiDiscord, SiGiphy, SiTiktok, SiX } from 'react-icons/si';
import { useLocation, useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import TableOfContents, { type TocItem } from '../components/TableOfContents';
import BrowserSourceGuide from '../components/config/BrowserSourceGuide';
import PublicServerRoleReminder from '../components/config/PublicServerRoleReminder';
import { obsGuide, streamlabsGuide } from '../components/config/guidePresets';
import { CommandFlowMockup } from '../components/usage/DiscordMockups';

const toc: TocItem[] = [
    { id: 'how-it-works', label: 'Comment ça marche' },
    { id: 'commands', label: 'Commandes' },
    { id: 'platforms', label: 'Plateformes' },
    { id: 'formats', label: 'Formats' },
    { id: 'features', label: 'Fonctionnalités' },
    { id: 'setup', label: 'Configuration' },
];

const steps = [
    {
        icon: MessageSquareText,
        title: '1. Une commande Discord',
        desc: 'Un membre lance /livechat avec un lien ou un fichier, et choisit le stream cible.',
    },
    {
        icon: Send,
        title: '2. Le bot diffuse',
        desc: "LiveChat répond, récupère le média via son proxy et l'envoie à l'overlay du streameur.",
    },
    {
        icon: MonitorPlay,
        title: "3. À l'écran dans OBS",
        desc: "Le média apparaît en direct sur l'overlay OBS, avec un bouton pour passer au suivant.",
    },
];

const platforms: { name: string; desc: string; icon: IconType }[] = [
    { name: 'Discord', desc: 'Fichiers envoyés directement sur Discord', icon: SiDiscord },
    { name: 'Giphy', desc: 'GIFs depuis Giphy', icon: SiGiphy },
    { name: 'Tenor', desc: 'GIFs depuis Tenor', icon: RiFilmLine },
    { name: 'TikTok', desc: 'Vidéos TikTok', icon: SiTiktok },
    { name: 'X (Twitter)', desc: 'Vidéos et images de Tweets', icon: SiX },
];

const formats = [
    {
        category: 'Vidéo',
        extensions: ['.mp4', '.webm', '.mkv', '.mov'],
        color: 'bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/20',
    },
    {
        category: 'Audio',
        extensions: ['.mp3', '.wav', '.ogg', '.flac'],
        color: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20',
    },
    {
        category: 'Image',
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        color: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
    },
];

export default function Usage() {
    const { hash } = useLocation();
    const [searchParams] = useSearchParams();
    const showObsDefault = searchParams.get('obs') === 'true';

    useEffect(() => {
        if (hash) {
            const id = hash.replace('#', '');
            setTimeout(() => {
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [hash]);

    return (
        <PageShell
            title="Comment utiliser LiveChat ? Guide complet"
            description="Découvrez les commandes Discord de LiveChat, les plateformes supportées (Giphy, Tenor, TikTok, X) et les formats de fichiers acceptés."
            path="/usage"
        >
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
                <div className="mb-10 border-b border-border pb-8">
                    <h1 className="text-2xl font-bold sm:text-3xl">Comment utiliser LiveChat ?</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                        Du message Discord à l'overlay OBS : découvrez les commandes, les plateformes supportées et les
                        formats acceptés.
                    </p>
                </div>

                <div className="gap-12 lg:grid lg:grid-cols-[1fr_220px]">
                    {/* Content */}
                    <div className="order-1 min-w-0 space-y-16">
                        {/* Comment ça marche */}
                        <section id="how-it-works" className="scroll-mt-24">
                            <h2 className="text-xl font-semibold sm:text-2xl">Comment ça marche</h2>
                            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                                LiveChat relie Discord à votre stream en trois étapes.
                            </p>

                            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                {steps.map((step) => (
                                    <div key={step.title} className="rounded-lg border border-border bg-card px-5 py-4">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-foreground">
                                            <step.icon className="h-4 w-4" />
                                        </span>
                                        <p className="mt-3 text-sm font-semibold">{step.title}</p>
                                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                            {step.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <p className="mb-3 mt-8 text-sm font-medium text-muted-foreground">Aperçu dans Discord</p>
                            <CommandFlowMockup />
                            <PublicServerRoleReminder />
                        </section>

                        {/* Commandes */}
                        <section id="commands" className="scroll-mt-24">
                            <h2 className="text-xl font-semibold sm:text-2xl">Commandes Discord</h2>
                            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                                LiveChat s'utilise via des commandes slash sur Discord. Voici la liste complète.
                            </p>

                            <div className="mt-6 space-y-4">
                                {[
                                    {
                                        cmd: '/livechat',
                                        desc: 'Commande principale - contient 4 sous-commandes',
                                        defaultOpen: true,
                                        content: (
                                            <div className="space-y-6">
                                                {[
                                                    {
                                                        name: 'lancer-url',
                                                        color: 'bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300',
                                                        desc: 'Lancer un LiveChat via un lien',
                                                        opts: [
                                                            {
                                                                name: 'cible',
                                                                desc: 'Choisissez sur quel stream envoyer le LiveChat',
                                                                required: true,
                                                            },
                                                            {
                                                                name: 'url',
                                                                desc: 'Lien du média (plateforme supportée ou lien direct)',
                                                                required: true,
                                                            },
                                                            {
                                                                name: 'texte',
                                                                desc: 'Texte à afficher en dessous du média',
                                                            },
                                                            {
                                                                name: 'fullscreen',
                                                                desc: "Afficher le média sur tout l'écran du stream (16:9)",
                                                            },
                                                            {
                                                                name: 'anonyme',
                                                                desc: "Masquer votre pseudo et photo de profil sur l'overlay",
                                                            },
                                                        ],
                                                    },
                                                    {
                                                        name: 'lancer-fichier',
                                                        color: 'bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300',
                                                        desc: 'Lancer un LiveChat via un fichier uploadé',
                                                        opts: [
                                                            {
                                                                name: 'cible',
                                                                desc: 'Choisissez sur quel stream envoyer le LiveChat',
                                                                required: true,
                                                            },
                                                            {
                                                                name: 'fichier',
                                                                desc: 'Fichier à afficher (image, vidéo ou audio)',
                                                                required: true,
                                                            },
                                                            {
                                                                name: 'texte',
                                                                desc: 'Texte à afficher en dessous du média',
                                                            },
                                                            {
                                                                name: 'fullscreen',
                                                                desc: "Afficher le média sur tout l'écran du stream (16:9)",
                                                            },
                                                            {
                                                                name: 'anonyme',
                                                                desc: "Masquer votre pseudo et photo de profil sur l'overlay",
                                                            },
                                                        ],
                                                    },
                                                    {
                                                        name: 'passer-au-suivant',
                                                        color: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300',
                                                        desc: "Passer au LiveChat suivant dans la file d'attente",
                                                        opts: [
                                                            {
                                                                name: 'cible',
                                                                desc: 'Choisissez sur quel stream passer au suivant',
                                                                required: true,
                                                            },
                                                        ],
                                                    },
                                                    {
                                                        name: 'stop-et-vider',
                                                        color: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-300',
                                                        desc: "Arrêter le LiveChat et vider la file d'attente",
                                                        opts: [
                                                            {
                                                                name: 'cible',
                                                                desc: 'Choisissez sur quel stream arrêter le LiveChat',
                                                                required: true,
                                                            },
                                                        ],
                                                    },
                                                ].map((sub, si) => (
                                                    <div key={sub.name}>
                                                        {si > 0 && <div className="h-px bg-border/50" />}
                                                        <div className={si > 0 ? 'pt-6' : ''}>
                                                            <div className="flex items-center gap-2">
                                                                <code
                                                                    className={`rounded px-2 py-0.5 text-xs font-bold ${sub.color}`}
                                                                >
                                                                    {sub.name}
                                                                </code>
                                                                <span className="text-sm text-muted-foreground">
                                                                    {sub.desc}
                                                                </span>
                                                            </div>
                                                            <ul className="mt-2.5 space-y-1.5 pl-1">
                                                                {sub.opts.map((opt) => (
                                                                    <li
                                                                        key={opt.name}
                                                                        className="flex items-start gap-2 text-sm"
                                                                    >
                                                                        <code className="mt-0.5 shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs">
                                                                            {opt.name}
                                                                        </code>
                                                                        <span className="text-muted-foreground">
                                                                            {opt.desc}
                                                                        </span>
                                                                        {opt.required && (
                                                                            <span className="mt-0.5 shrink-0 rounded bg-red-100 dark:bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-600 dark:text-red-400">
                                                                                Requis
                                                                            </span>
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ),
                                    },
                                    {
                                        cmd: '/liste-des-plateformes',
                                        desc: 'Affiche les plateformes et formats supportés',
                                        content: (
                                            <p className="text-sm text-muted-foreground">
                                                Affiche un embed récapitulatif de toutes les plateformes acceptées ainsi
                                                que les formats de fichiers supportés. Aucune option requise.
                                            </p>
                                        ),
                                    },
                                    {
                                        cmd: '/abonnement',
                                        desc: 'Découvrez LiveChat Plus et soutenez le projet',
                                        content: (
                                            <p className="text-sm text-muted-foreground">
                                                Affiche les informations sur l'abonnement LiveChat Plus (1,99$/mois).
                                                Cet abonnement optionnel permet de soutenir le projet et augmente le
                                                nombre d'emplacements de streameurs de 10 à 20 par serveur Discord.
                                            </p>
                                        ),
                                    },
                                    {
                                        cmd: '/gérer-mes-overlays',
                                        desc: 'Créer et gérer vos overlays sur ce serveur',
                                        content: (
                                            <>
                                                <p className="text-sm text-muted-foreground">
                                                    Permet aux membres autorisés de créer un nouvel overlay (avec un
                                                    pseudo d'affichage personnalisé) ou de gérer leurs overlays
                                                    existants sur le serveur (récupérer le lien OBS, régénérer la clé
                                                    d'authentification ou supprimer l'overlay).
                                                </p>
                                                <ul className="mt-3 space-y-1.5 pl-1">
                                                    <li className="flex items-start gap-2 text-sm">
                                                        <code className="mt-0.5 shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs">
                                                            choix
                                                        </code>
                                                        <span className="text-muted-foreground">
                                                            Sélectionnez un overlay existant à gérer, ou choisissez d'en
                                                            créer un nouveau
                                                        </span>
                                                        <span className="mt-0.5 shrink-0 rounded bg-red-100 dark:bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-600 dark:text-red-400">
                                                            Requis
                                                        </span>
                                                    </li>
                                                </ul>
                                            </>
                                        ),
                                    },
                                    {
                                        cmd: '/réglages',
                                        desc: 'Configurer les options de LiveChat pour ce serveur',
                                        content: (
                                            <>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    Permet aux administrateurs de configurer les règles d'utilisation de
                                                    LiveChat pour le serveur.
                                                </p>
                                                <div className="space-y-4">
                                                    {[
                                                        {
                                                            sub: 'rôle-autorisé',
                                                            subdesc:
                                                                'Définir un rôle requis pour créer ou configurer des overlays',
                                                            opt: 'rôle',
                                                            optdesc:
                                                                'Sélectionnez le rôle restreint (ou "Désactiver la restriction" pour retirer la restriction)',
                                                        },
                                                        {
                                                            sub: 'overlays-max-par-personne',
                                                            subdesc:
                                                                "Définir un nombre maximal d'overlays par personne",
                                                            opt: 'nombre',
                                                            optdesc:
                                                                "Le nombre maximum d'overlays par utilisateur (entre 1 et 20)",
                                                        },
                                                    ].map((item, ii) => (
                                                        <div key={item.sub}>
                                                            {ii > 0 && <div className="h-px bg-border/50" />}
                                                            <div className={ii > 0 ? 'pt-4' : ''}>
                                                                <div className="flex items-center gap-2">
                                                                    <code className="rounded bg-violet-100 dark:bg-violet-500/10 px-2 py-0.5 text-xs font-bold text-violet-700 dark:text-violet-300">
                                                                        {item.sub}
                                                                    </code>
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {item.subdesc}
                                                                    </span>
                                                                </div>
                                                                <ul className="mt-2.5 pl-1">
                                                                    <li className="flex items-start gap-2 text-sm">
                                                                        <code className="mt-0.5 shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs">
                                                                            {item.opt}
                                                                        </code>
                                                                        <span className="text-muted-foreground">
                                                                            {item.optdesc}
                                                                        </span>
                                                                        <span className="mt-0.5 shrink-0 rounded bg-red-100 dark:bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-600 dark:text-red-400">
                                                                            Requis
                                                                        </span>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ),
                                    },
                                ].map((item) => (
                                    <details
                                        key={item.cmd}
                                        className="group rounded-lg border border-border bg-card [&_summary::-webkit-details-marker]:hidden"
                                        open={item.defaultOpen}
                                    >
                                        <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 outline-none transition-colors hover:text-muted-foreground sm:px-6">
                                            <div className="flex items-center gap-3">
                                                <code className="rounded-md bg-muted px-2.5 py-1 text-sm font-bold">
                                                    {item.cmd}
                                                </code>
                                                <span className="text-sm font-normal text-muted-foreground">
                                                    {item.desc}
                                                </span>
                                            </div>
                                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:-rotate-180" />
                                        </summary>
                                        <div className="border-t border-border/50 px-5 pb-5 pt-4 sm:px-6">
                                            {item.content}
                                        </div>
                                    </details>
                                ))}
                            </div>

                            <div className="mt-5 rounded-md border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
                                <strong className="text-foreground">💡 L'option « cible »</strong> — L'autocomplétion
                                vous propose la liste des streameurs actuellement connectés. Si deux streameurs ou plus
                                sont connectés, l'option{' '}
                                <strong className="text-foreground">📌 Envoyer à tous les streameurs connectés</strong>{' '}
                                apparaît en premier pour envoyer le média à tout le monde d'un coup.
                            </div>
                        </section>

                        {/* Plateformes */}
                        <section id="platforms" className="scroll-mt-24">
                            <h2 className="text-xl font-semibold sm:text-2xl">Plateformes supportées</h2>
                            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                                Collez directement un lien de ces plateformes dans l'option{' '}
                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">url</code>,
                                LiveChat récupère automatiquement le média via son proxy intégré.
                            </p>
                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                {platforms.map((p) => (
                                    <div
                                        key={p.name}
                                        className="flex h-full items-center gap-4 rounded-lg border border-border bg-card px-5 py-4"
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-lg text-foreground">
                                            <p.icon className="h-5 w-5" aria-hidden />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold">{p.name}</p>
                                            <p className="text-xs text-muted-foreground">{p.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 rounded-md border border-yellow-300 dark:border-yellow-500/20 bg-yellow-50 dark:bg-yellow-500/5 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200/90">
                                Les liens de plateformes non listées ci-dessus ne sont pas supportés directement. Vous
                                devrez d'abord télécharger le média puis utilisez la sous-commande{' '}
                                <strong>lancer-fichier</strong>.
                            </div>
                        </section>

                        {/* Formats */}
                        <section id="formats" className="scroll-mt-24">
                            <h2 className="text-xl font-semibold sm:text-2xl">Formats de fichiers acceptés</h2>
                            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                                Tous les formats que vous pouvez envoyer via la sous-commande{' '}
                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                                    lancer-fichier
                                </code>{' '}
                                ou via un lien direct avec{' '}
                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                                    lancer-url
                                </code>
                                .
                            </p>

                            <div className="mt-6 space-y-3">
                                {formats.map((f) => (
                                    <div
                                        key={f.category}
                                        className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                                    >
                                        <span className="text-sm font-semibold">{f.category}</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {f.extensions.map((ext) => (
                                                <span
                                                    key={ext}
                                                    className={`rounded-md border px-2 py-0.5 text-xs font-bold ${f.color}`}
                                                >
                                                    {ext}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 rounded-md border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
                                <strong className="text-foreground">Durée d'affichage :</strong> Les vidéos et audios
                                sont joués en intégralité. Les images s'affichent pendant{' '}
                                <strong className="text-foreground">8 secondes</strong> automatiquement.
                            </div>
                        </section>

                        {/* Fonctionnalités */}
                        <section id="features" className="scroll-mt-24">
                            <h2 className="text-xl font-semibold sm:text-2xl">Fonctionnalités</h2>
                            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                                Les fonctionnalités clés de LiveChat à connaître.
                            </p>

                            <div className="mt-6 rounded-lg border border-border bg-card px-5 py-4 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-sm">
                                        ⏭️
                                    </span>
                                    <p className="font-semibold">Bouton « Passer le LiveChat »</p>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Après l'envoi d'un média, un bouton interactif apparaît sous le message Discord avec
                                    un compte à rebours affichant le temps restant. Il suffit de cliquer dessus pour
                                    passer au média suivant sans avoir besoin d'utiliser la sous-commande{' '}
                                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                                        passer-au-suivant
                                    </code>
                                    .
                                </p>
                            </div>

                            <div className="mt-4 space-y-4">
                                {[
                                    {
                                        icon: '👥',
                                        title: 'Multi-streameurs',
                                        desc: (
                                            <>
                                                Plusieurs streameurs peuvent se connecter au même serveur Discord
                                                (jusqu'à <strong className="text-foreground">10</strong>, ou{' '}
                                                <strong className="text-foreground">20</strong> avec LiveChat Plus).
                                                Quand au moins 2 streameurs sont connectés, l'option{' '}
                                                <strong className="text-foreground">📌 Envoyer à tous</strong> apparaît
                                                dans l'autocomplétion de la cible.
                                            </>
                                        ),
                                    },
                                    {
                                        icon: '📝',
                                        title: 'Texte superposé',
                                        desc: (
                                            <>
                                                L'option{' '}
                                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                                                    texte
                                                </code>{' '}
                                                ajoute un texte en dessous du média sur l'overlay, style mème. Parfait
                                                pour ajouter du contexte ou une punchline.
                                            </>
                                        ),
                                    },
                                    {
                                        icon: '🖥️',
                                        title: 'Mode plein écran',
                                        desc: (
                                            <>
                                                L'option{' '}
                                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                                                    fullscreen
                                                </code>{' '}
                                                affiche le média sur tout l'écran du stream en 16:9 horizontal. Pour les
                                                fichiers audio, le mode plein écran est activé automatiquement.
                                            </>
                                        ),
                                    },
                                    {
                                        icon: '🔒',
                                        title: 'Proxy intégré',
                                        desc: "Tous les médias sont servis via le serveur LiveChat grâce au proxy intégré. L'adresse IP des streameurs n'est jamais exposée aux services tiers.",
                                    },
                                    {
                                        icon: '📋',
                                        title: "File d'attente",
                                        desc: "Les médias sont mis en file d'attente et joués les uns après les autres. Si plusieurs personnes envoient des médias en même temps, ils se suivent dans l'ordre d'envoi.",
                                    },
                                ].map((feat) => (
                                    <div
                                        key={feat.title}
                                        className="rounded-lg border border-border bg-card px-5 py-4 sm:px-6"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-sm">
                                                {feat.icon}
                                            </span>
                                            <p className="font-semibold">{feat.title}</p>
                                        </div>
                                        <p className="mt-2 text-sm text-muted-foreground">{feat.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Configuration */}
                        <section id="setup" className="scroll-mt-24">
                            <h2 className="text-xl font-semibold sm:text-2xl">Configuration de l'overlay</h2>
                            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                                Ajoutez votre overlay LiveChat dans votre logiciel de streaming en quelques étapes.
                            </p>
                            <div className="mt-6 space-y-4">
                                <BrowserSourceGuide {...obsGuide} defaultOpen={showObsDefault} />
                                <BrowserSourceGuide {...streamlabsGuide} />
                            </div>
                        </section>

                        <div className="border-t border-border pt-10 text-left sm:text-center">
                            <p className="text-sm text-muted-foreground sm:text-base">
                                Vous n'avez pas encore configuré LiveChat ?
                            </p>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                                <a
                                    href="/config"
                                    className="inline-flex w-full items-center justify-center rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-85 sm:w-auto"
                                >
                                    Configurer votre overlay
                                </a>
                                <a href="/" className="btn-secondary w-full px-7 sm:w-auto">
                                    ← Retour à l'accueil
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Table of contents */}
                    <aside className="order-2 hidden lg:block">
                        <TableOfContents items={toc} />
                    </aside>
                </div>
            </main>
        </PageShell>
    );
}
