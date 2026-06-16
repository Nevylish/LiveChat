import { ChevronDown } from 'lucide-react';
import { useCallback, useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import VideoModal from '../components/VideoModal';

const YOUTUBE_VIDEO_ID = '50IjxVbd9Ew';

const sections = [
    { id: 'commands', label: 'Commandes' },
    { id: 'platforms', label: 'Plateformes' },
    { id: 'formats', label: 'Formats' },
    { id: 'features', label: 'Fonctionnalités' },
];

const platforms = [
    { name: 'Discord', desc: 'Fichiers envoyés directement sur Discord', icon: '💬' },
    { name: 'Giphy', desc: 'GIFs depuis Giphy', icon: '🎞️' },
    // { name: 'Instagram', desc: 'Reels Instagram', icon: '📸' },
    { name: 'Tenor', desc: 'GIFs depuis Tenor', icon: '🎬' },
    { name: 'TikTok', desc: 'Vidéos TikTok', icon: '🎵' },
    { name: 'X (Twitter)', desc: 'Vidéos et images de Tweets', icon: '𝕏' },
    // { name: 'YouTube', desc: 'Vidéos et Shorts YouTube', icon: '▶️' },
];

const formats = [
    {
        category: 'Vidéo',
        extensions: ['.mp4', '.webm', '.mkv', '.mov'],
        color: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    },
    {
        category: 'Audio',
        extensions: ['.mp3', '.wav', '.ogg', '.flac'],
        color: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    },
    {
        category: 'Image',
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        color: 'bg-green-500/10 text-green-300 border-green-500/20',
    },
];

export default function Usage() {
    function scrollTo(id: string) {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const [videoOpen, setVideoOpen] = useState(false);
    const handleCloseVideo = useCallback(() => setVideoOpen(false), []);

    return (
        <div className="dark flex min-h-screen flex-col text-foreground">
            <Header subtitle="Utilisation" />
            <VideoModal
                open={videoOpen}
                onClose={handleCloseVideo}
                videoId={YOUTUBE_VIDEO_ID}
                title="Démonstration LiveChat"
            />

            <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:px-6 sm:py-12">
                {/* Page intro */}
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Comment utiliser LiveChat ?</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                        Tout ce que vous devez savoir pour tirer le meilleur parti de LiveChat.
                    </p>
                </div>

                {/* Quick nav */}
                <div className="mt-8 flex flex-col items-center gap-3">
                    <button
                        onClick={() => setVideoOpen(true)}
                        className="w-full max-w-md rounded-full border border-white/15 bg-white/5 px-7 pb-3.5 pt-3 text-center text-sm font-semibold transition-colors duration-200 hover:border-white/25 hover:bg-white/10"
                    >
                        Démonstration vidéo
                    </button>
                    <nav className="flex flex-wrap justify-center gap-2">
                        {sections.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => scrollTo(s.id)}
                                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:border-foreground/25 hover:bg-white/5 hover:text-foreground"
                            >
                                {s.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Commands section */}
                <section id="commands" className="mt-16 scroll-mt-24">
                    <h2 className="text-2xl font-bold sm:text-3xl">Commandes Discord</h2>
                    <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                        LiveChat s'utilise via des commandes slash sur Discord. Voici la liste complète.
                    </p>

                    {/* /livechat */}
                    <div className="mt-6 space-y-4">
                        <details
                            className="group rounded-xl border border-border bg-white/2 [&_summary::-webkit-details-marker]:hidden"
                            open
                        >
                            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 outline-none transition-colors hover:text-muted-foreground sm:px-6">
                                <div className="flex items-center gap-3">
                                    <code className="rounded-md bg-white/5 px-2.5 py-1 text-sm font-bold">
                                        /livechat
                                    </code>
                                    <span className="text-sm font-normal text-muted-foreground">
                                        Commande principale - contient 4 sous-commandes
                                    </span>
                                </div>
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:-rotate-180" />
                            </summary>
                            <div className="border-t border-border/50 px-5 pb-5 pt-4 sm:px-6">
                                <div className="space-y-6">
                                    {/* lancer-url */}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <code className="rounded bg-purple-500/10 px-2 py-0.5 text-xs font-bold text-purple-300">
                                                lancer-url
                                            </code>
                                            <span className="text-sm text-muted-foreground">
                                                Lancer un LiveChat via un lien
                                            </span>
                                        </div>
                                        <ul className="mt-2.5 space-y-1.5 pl-1">
                                            {[
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
                                                { name: 'texte', desc: 'Texte à afficher en dessous du média' },
                                                {
                                                    name: 'fullscreen',
                                                    desc: "Afficher le média sur tout l'écran du stream (16:9)",
                                                },
                                                {
                                                    name: 'anonyme',
                                                    desc: "Masquer votre pseudo et photo de profil sur l'overlay",
                                                },
                                            ].map((opt) => (
                                                <li key={opt.name} className="flex items-start gap-2 text-sm">
                                                    <code className="mt-0.5 shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-xs">
                                                        {opt.name}
                                                    </code>
                                                    <span className="text-muted-foreground">{opt.desc}</span>
                                                    {opt.required && (
                                                        <span className="mt-0.5 shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-400">
                                                            Requis
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="h-px bg-border/50" />

                                    {/* lancer-fichier */}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <code className="rounded bg-purple-500/10 px-2 py-0.5 text-xs font-bold text-purple-300">
                                                lancer-fichier
                                            </code>
                                            <span className="text-sm text-muted-foreground">
                                                Lancer un LiveChat via un fichier uploadé
                                            </span>
                                        </div>
                                        <ul className="mt-2.5 space-y-1.5 pl-1">
                                            {[
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
                                                { name: 'texte', desc: 'Texte à afficher en dessous du média' },
                                                {
                                                    name: 'fullscreen',
                                                    desc: "Afficher le média sur tout l'écran du stream (16:9)",
                                                },
                                                {
                                                    name: 'anonyme',
                                                    desc: "Masquer votre pseudo et photo de profil sur l'overlay",
                                                },
                                            ].map((opt) => (
                                                <li key={opt.name} className="flex items-start gap-2 text-sm">
                                                    <code className="mt-0.5 shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-xs">
                                                        {opt.name}
                                                    </code>
                                                    <span className="text-muted-foreground">{opt.desc}</span>
                                                    {opt.required && (
                                                        <span className="mt-0.5 shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-400">
                                                            Requis
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="h-px bg-border/50" />

                                    {/* passer-au-suivant */}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <code className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-300">
                                                passer-au-suivant
                                            </code>
                                            <span className="text-sm text-muted-foreground">
                                                Passer au LiveChat suivant dans la file d'attente
                                            </span>
                                        </div>
                                        <ul className="mt-2.5 space-y-1.5 pl-1">
                                            <li className="flex items-start gap-2 text-sm">
                                                <code className="mt-0.5 shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-xs">
                                                    cible
                                                </code>
                                                <span className="text-muted-foreground">
                                                    Choisissez sur quel stream passer au suivant
                                                </span>
                                                <span className="mt-0.5 shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-400">
                                                    Requis
                                                </span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="h-px bg-border/50" />

                                    {/* stop-et-vider */}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <code className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-300">
                                                stop-et-vider
                                            </code>
                                            <span className="text-sm text-muted-foreground">
                                                Arrêter le LiveChat et vider la file d'attente
                                            </span>
                                        </div>
                                        <ul className="mt-2.5 space-y-1.5 pl-1">
                                            <li className="flex items-start gap-2 text-sm">
                                                <code className="mt-0.5 shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-xs">
                                                    cible
                                                </code>
                                                <span className="text-muted-foreground">
                                                    Choisissez sur quel stream arrêter le LiveChat
                                                </span>
                                                <span className="mt-0.5 shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-400">
                                                    Requis
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </details>

                        {/* /liste-des-plateformes */}
                        <details className="group rounded-xl border border-border bg-white/2 [&_summary::-webkit-details-marker]:hidden">
                            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 outline-none transition-colors hover:text-muted-foreground sm:px-6">
                                <div className="flex items-center gap-3">
                                    <code className="rounded-md bg-white/5 px-2.5 py-1 text-sm font-bold">
                                        /liste-des-plateformes
                                    </code>
                                    <span className="text-sm font-normal text-muted-foreground">
                                        Affiche les plateformes et formats supportés
                                    </span>
                                </div>
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:-rotate-180" />
                            </summary>
                            <div className="border-t border-border/50 px-5 pb-5 pt-4 sm:px-6">
                                <p className="text-sm text-muted-foreground">
                                    Affiche un embed récapitulatif de toutes les plateformes acceptées ainsi que les
                                    formats de fichiers supportés. Aucune option requise.
                                </p>
                            </div>
                        </details>

                        {/* /abonnement */}
                        <details className="group rounded-xl border border-border bg-white/2 [&_summary::-webkit-details-marker]:hidden">
                            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 outline-none transition-colors hover:text-muted-foreground sm:px-6">
                                <div className="flex items-center gap-3">
                                    <code className="rounded-md bg-white/5 px-2.5 py-1 text-sm font-bold">
                                        /abonnement
                                    </code>
                                    <span className="text-sm font-normal text-muted-foreground">
                                        Découvrez LiveChat Plus et soutenez le projet
                                    </span>
                                </div>
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:-rotate-180" />
                            </summary>
                            <div className="border-t border-border/50 px-5 pb-5 pt-4 sm:px-6">
                                <p className="text-sm text-muted-foreground">
                                    Affiche les informations sur l'abonnement LiveChat Plus (1,99$/mois). Cet abonnement
                                    optionnel permet de soutenir le projet et augmente le nombre d'emplacements de
                                    streameurs de 10 à 20 par serveur Discord.
                                </p>
                            </div>
                        </details>
                    </div>

                    {/* Target info */}
                    <div className="mt-5 rounded-lg border border-border bg-white/3 px-4 py-3 text-sm text-muted-foreground">
                        <strong className="text-foreground">💡 L'option « cible »</strong> - L'autocomplétion vous
                        propose la liste des streameurs actuellement connectés. Si deux streameurs ou plus sont
                        connectés, l'option{' '}
                        <strong className="text-foreground">📌 Envoyer à tous les streameurs connectés</strong> apparaît
                        en premier pour envoyer le média à tout le monde d'un coup.
                    </div>
                </section>

                {/* Platforms section */}
                <section id="platforms" className="mt-16 scroll-mt-24">
                    <h2 className="text-2xl font-bold sm:text-3xl">Plateformes supportées</h2>
                    <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                        Collez directement un lien de ces plateformes dans l'option{' '}
                        <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-foreground">url</code>, LiveChat
                        récupère automatiquement le média via son proxy intégré.
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {platforms.map((p) => (
                            <div
                                key={p.name}
                                className="flex items-center gap-4 rounded-xl border border-border bg-white/2 px-5 py-4"
                            >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-lg">
                                    {p.icon}
                                </span>
                                <div>
                                    <p className="text-sm font-semibold">{p.name}</p>
                                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-200/90">
                        ⚠️ Les liens de plateformes non listées ci-dessus ne sont pas supportés directement. Téléchargez
                        d'abord le média puis utilisez la sous-commande <strong>lancer-fichier</strong>.
                    </div>
                </section>

                {/* Formats section */}
                <section id="formats" className="mt-16 scroll-mt-24">
                    <h2 className="text-2xl font-bold sm:text-3xl">Formats de fichiers acceptés</h2>
                    <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                        Tous les formats que vous pouvez envoyer via la sous-commande{' '}
                        <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-foreground">lancer-fichier</code>{' '}
                        ou via un lien direct avec{' '}
                        <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-foreground">lancer-url</code>.
                    </p>

                    <div className="mt-6 space-y-3">
                        {formats.map((f) => (
                            <div
                                key={f.category}
                                className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-white/2 px-4 py-3"
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

                    <div className="mt-4 rounded-lg border border-border bg-white/3 px-4 py-3 text-sm text-muted-foreground">
                        <strong className="text-foreground">Durée d'affichage :</strong> Les vidéos et audios sont joués
                        en intégralité. Les images s'affichent pendant{' '}
                        <strong className="text-foreground">8 secondes</strong> automatiquement.
                    </div>
                </section>

                {/* Features section */}
                <section id="features" className="mt-16 scroll-mt-24">
                    <h2 className="text-2xl font-bold sm:text-3xl">Fonctionnalités</h2>
                    <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                        Les fonctionnalités clés de LiveChat à connaître.
                    </p>

                    <div className="mt-6 space-y-4">
                        {/* Skip button */}
                        <div className="rounded-xl border border-border bg-white/2 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm">
                                    ⏭️
                                </span>
                                <p className="font-semibold">Bouton « Passer le LiveChat »</p>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Après l'envoi d'un média, un bouton interactif apparaît sous le message Discord avec un
                                compte à rebours affichant le temps restant. Il suffit de cliquer dessus pour passer au
                                média suivant sans avoir besoin d'utiliser la sous-commande{' '}
                                <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-foreground">
                                    passer-au-suivant
                                </code>
                                .
                            </p>
                        </div>

                        {/* Multi-stream */}
                        <div className="rounded-xl border border-border bg-white/2 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm">
                                    👥
                                </span>
                                <p className="font-semibold">Multi-streameurs</p>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Plusieurs streameurs peuvent se connecter au même serveur Discord (jusqu'à{' '}
                                <strong className="text-foreground">10</strong>, ou{' '}
                                <strong className="text-foreground">20</strong> avec LiveChat Plus). Quand au moins 2
                                streameurs sont connectés, l'option{' '}
                                <strong className="text-foreground">📌 Envoyer à tous</strong> apparaît dans
                                l'autocomplétion de la cible.
                            </p>
                        </div>

                        {/* Texte */}
                        <div className="rounded-xl border border-border bg-white/2 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm">
                                    📝
                                </span>
                                <p className="font-semibold">Texte superposé</p>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                L'option{' '}
                                <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-foreground">texte</code>{' '}
                                ajoute un texte en dessous du média sur l'overlay, style mème. Parfait pour ajouter du
                                contexte ou une punchline.
                            </p>
                        </div>

                        {/* Fullscreen */}
                        <div className="rounded-xl border border-border bg-white/2 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm">
                                    🖥️
                                </span>
                                <p className="font-semibold">Mode plein écran</p>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                L'option{' '}
                                <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-foreground">
                                    fullscreen
                                </code>{' '}
                                affiche le média sur tout l'écran du stream en 16:9 horizontal. Pour les fichiers audio,
                                le mode plein écran est activé automatiquement.
                            </p>
                        </div>

                        {/* Proxy */}
                        <div className="rounded-xl border border-border bg-white/2 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm">
                                    🔒
                                </span>
                                <p className="font-semibold">Proxy intégré</p>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Tous les médias sont servis via le serveur LiveChat grâce au proxy intégré. L'adresse IP
                                des streameurs n'est jamais exposée aux services tiers.
                            </p>
                        </div>

                        {/* Queue */}
                        <div className="rounded-xl border border-border bg-white/2 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm">
                                    📋
                                </span>
                                <p className="font-semibold">File d'attente</p>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Les médias sont mis en file d'attente et joués les uns après les autres. Si plusieurs
                                personnes envoient des médias en même temps, ils se suivent dans l'ordre d'envoi.
                            </p>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <div className="mt-16 text-center">
                    <p className="text-sm text-muted-foreground sm:text-base">
                        Vous n'avez pas encore configuré LiveChat ?
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                        <a
                            href="/config"
                            className="rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
                        >
                            Configurer votre overlay
                        </a>
                        <a
                            href="/"
                            className="rounded-full border border-border px-7 py-3 text-sm font-semibold transition-colors duration-200 hover:border-foreground/25 hover:bg-white/5"
                        >
                            ← Retour à l'accueil
                        </a>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
