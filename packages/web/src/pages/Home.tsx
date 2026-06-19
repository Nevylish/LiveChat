import { ChevronDown, Server, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import JsonLd from '../components/JsonLd';
import Seo from '../components/Seo';
import VideoModal from '../components/VideoModal';

declare global {
    interface Window {
        __LIVECHAT_STATS__?: {
            streamers: number;
            servers: number;
        };
    }
}

const YOUTUBE_VIDEO_ID = '50IjxVbd9Ew';

const faqs = [
    {
        question: 'Est-ce gratuit ?',
        answer: "Oui, LiveChat est totalement gratuit et open-source. Vous pouvez depuis Discord souscrire à un abonnement Plus, mais il ne débloque pas de fonctionnalités supplémentaires, seulement des slots additionnels (c'est surtout pour soutenir le projet).",
    },
    {
        question: 'Est-ce sécurisé ?',
        answer: 'Complètement, le code est libre et tout le monde peut le regarder, le système est prévu pour maîtriser les risques, notamment grâce au fait de créer un serveur Discord uniquement pour ça. De plus, vos informations personnelles sont protégées grâce à notre système de proxy, il est impossible de récupérer votre adresse IP par exemple.',
    },
    {
        question: 'Est-ce autorisé par Twitch ?',
        answer: "Sur Twitch et toutes les autres plateformes vous êtes libre de mettre ce que vous voulez à condition que ça respecte les conditions d'utilisations de la plateforme (pas de violence, nudité ou contenu protégé par des droits d'auteurs), nous vous invitons à donner l'accès à votre LiveChat seulement aux personnes de confiance, nous déclinons toute responsabilité en cas de sanction.",
    },
];

const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'LiveChat',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Discord, OBS Studio',
    description:
        "LiveChat est un bot Discord et un overlay pour streameurs qui permet d'afficher une image, une vidéo ou jouer un son sur un flux en direct, depuis une simple commande Discord.",
    url: 'https://livechat.nevylish.fr/',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
    },
};

const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
        },
    })),
};

export default function Home() {
    const [stats, setStats] = useState<{ streamers: number; servers: number } | null>(
        typeof window !== 'undefined' && window.__LIVECHAT_STATS__ ? window.__LIVECHAT_STATS__ : null,
    );
    const [videoOpen, setVideoOpen] = useState(false);
    const handleCloseVideo = useCallback(() => setVideoOpen(false), []);

    useEffect(() => {
        if (!stats) {
            fetch('/api/stats')
                .then((res) => res.json())
                .then((data) => setStats(data))
                .catch(() => {});
        }
    }, [stats]);

    return (
        <div className="dark min-h-screen text-foreground">
            <Seo
                title="LiveChat - Laissez vos amis animer vos streams"
                description="LiveChat est un bot Discord et un overlay pour streameurs qui permet d'afficher une image, une vidéo ou jouer un son sur un flux en direct, depuis une simple commande Discord."
                path="/"
            />
            <JsonLd data={softwareApplicationSchema} />
            <JsonLd data={faqPageSchema} />

            <div className="bg-layer" />
            <Header />
            <VideoModal
                open={videoOpen}
                onClose={handleCloseVideo}
                videoId={YOUTUBE_VIDEO_ID}
                title="Démonstration LiveChat"
            />

            <main>
                {/* Hero */}
                <section className="relative flex min-h-[calc(100vh-65px)] items-center py-16 md:py-0">
                    <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 md:grid-cols-2 md:items-center md:gap-16">
                        <div>
                            <h1 className="text-[2.25rem] font-extrabold leading-[1.1] tracking-tight sm:text-[2.75rem] md:text-5xl">
                                Laissez vos amis
                                <br />
                                animer vos streams
                            </h1>
                            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                                Avec LiveChat, vos amis peuvent ajouter une couche d'humour à vos lives.
                                {/* <br className="hidden sm:block" />
                                Et puis s'ils sont vos amis, c'est que vous les trouvez drôles, n'est-ce pas? */}
                            </p>
                            <div className="unselectable mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                <a
                                    href="/config"
                                    className="rounded-full bg-foreground px-7 py-3 text-center text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
                                >
                                    Configurer votre overlay
                                </a>
                                <button
                                    onClick={() => setVideoOpen(true)}
                                    className="rounded-full border border-border px-7 py-3 text-center text-sm font-semibold transition-colors duration-200 hover:border-foreground/25 hover:bg-white/5"
                                >
                                    Démonstration vidéo
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:gap-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                                        <Users className="h-4 w-4 text-foreground/80" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold leading-none tracking-tight">
                                                {stats !== null ? stats.streamers : '...'}
                                            </span>
                                            <span className="relative flex h-2 w-2">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                                            </span>
                                        </div>
                                        <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                            {stats !== null && stats.streamers <= 1
                                                ? 'Streameur·euse en direct'
                                                : 'Streameurs·euses en direct'}
                                        </span>
                                    </div>
                                </div>
                                <div className="hidden h-8 w-px bg-border sm:block"></div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                                        <Server className="h-4 w-4 text-foreground/80" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-lg font-bold leading-none tracking-tight">
                                            {stats !== null ? stats.servers : '...'}
                                        </span>
                                        <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                            {stats !== null && stats.servers <= 1
                                                ? 'Serveur Discord'
                                                : 'Serveurs Discord'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="max-md:flex max-md:justify-center">
                            <img
                                src="https://cdn.jsdelivr.net/gh/Nevylish/LiveChat@main/shared/assets/images/livechat_preview.png"
                                alt="Prévisualisation de l'overlay LiveChat"
                                className="w-full max-w-lg rounded-xl md:max-w-none"
                                draggable={false}
                            />
                        </div>
                    </div>

                    {/* Scroll indicator */}
                    <button
                        onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground transition-colors duration-200 hover:text-foreground"
                        aria-label="Défiler vers le bas"
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M7 6l5 5 5-5" />
                        </svg>
                    </button>
                </section>

                {/* Features */}
                <section id="features" className="py-20 sm:py-28">
                    <div className="mx-auto max-w-6xl space-y-20 px-5 sm:space-y-28 sm:px-6">
                        {/* Feature 1 */}
                        <div className="grid items-center gap-8 sm:gap-12 md:grid-cols-2">
                            <div>
                                <h2 className="text-2xl font-bold sm:text-3xl">
                                    Prise en charge de plusieurs plateformes
                                </h2>
                                <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                    Partager des TikToks, des Tweets et plus encore en envoyant simplement un lien sans
                                    devoir télécharger l'image ou la vidéo.
                                </p>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                    Actuellement supporté : <strong className="text-foreground">TikTok</strong>,{' '}
                                    <strong className="text-foreground">YouTube</strong>,{' '}
                                    <strong className="text-foreground">Instagram Reels</strong>,{' '}
                                    <strong className="text-foreground">Giphy</strong>,{' '}
                                    <strong className="text-foreground">Tenor</strong> &{' '}
                                    <strong className="text-foreground">X</strong>.
                                    <br />
                                    Et bien sûr, vous pouvez uploader vos propres fichiers.
                                </p>
                            </div>
                            <div className="max-md:flex max-md:justify-center">
                                <img
                                    src="https://cdn.jsdelivr.net/gh/Nevylish/LiveChat@main/shared/assets/images/card_tiktok.png"
                                    alt="Prise en charge TikTok"
                                    className="feature-visual-img w-full max-w-sm rounded-xl md:max-w-none"
                                    draggable={false}
                                />
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="grid items-center gap-8 sm:gap-12 md:grid-cols-2">
                            <div className="order-2 max-md:flex max-md:justify-center md:order-1">
                                <img
                                    src="https://cdn.jsdelivr.net/gh/Nevylish/LiveChat@main/shared/assets/images/card_streamtogether.png"
                                    alt="Streamez à plusieurs"
                                    className="feature-visual-img w-full max-w-sm rounded-xl md:max-w-none"
                                    draggable={false}
                                />
                            </div>
                            <div className="order-1 md:order-2">
                                <h2 className="text-2xl font-bold sm:text-3xl">Streamez à plusieurs</h2>
                                <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                    Invitez vos amis à installer LiveChat en configurant le même serveur Discord que
                                    vous et streamez ensemble !
                                </p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="grid items-center gap-8 sm:gap-12 md:grid-cols-2">
                            <div>
                                <h2 className="text-2xl font-bold sm:text-3xl">
                                    Compatible avec toutes les applications de streaming
                                </h2>
                                <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                    LiveChat est compatible avec{' '}
                                    <a
                                        href="https://obsproject.com/"
                                        className="text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
                                    >
                                        OBS Studio
                                    </a>
                                    ,{' '}
                                    <a
                                        href="https://streamlabs.com/"
                                        className="text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
                                    >
                                        Streamlabs
                                    </a>
                                    ,{' '}
                                    <a
                                        href="https://prismlive.com/en_us"
                                        className="text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
                                    >
                                        PRISM Live
                                    </a>{' '}
                                    et tous les autres logiciels sur lesquels vous pouvez ajouter une source Navigateur
                                    Web.
                                </p>
                            </div>
                            <div className="max-md:flex max-md:justify-center">
                                <img
                                    src="https://cdn.jsdelivr.net/gh/Nevylish/LiveChat@main/shared/assets/images/card_platforms.png"
                                    alt="Compatible avec toutes les applications de streaming"
                                    className="feature-visual-img w-full max-w-sm rounded-xl md:max-w-none"
                                    draggable={false}
                                />
                            </div>
                        </div>

                        {/* FAQ */}
                        <div className="mx-auto w-full max-w-2xl">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold sm:text-3xl">Questions fréquentes</h2>
                            </div>
                            <div className="mt-10 divide-y divide-border border-y border-border">
                                {faqs.map((faq, i) => (
                                    <details key={i} className="group py-5 [&_summary::-webkit-details-marker]:hidden">
                                        <summary className="unselectable flex cursor-pointer items-center justify-between gap-4 text-base font-semibold outline-none transition-colors hover:text-muted-foreground">
                                            {faq.question}
                                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:-rotate-180" />
                                        </summary>
                                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                            {faq.answer}
                                        </p>
                                    </details>
                                ))}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="md:text-center">
                            <h2 className="text-2xl font-bold sm:text-3xl">En route vers le succès 🏆</h2>
                            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-left">
                                LiveChat est une fonctionnalité rendue populaire par le groupe de streameurs Cacabox (
                                <a
                                    href="https://x.com/cacaboxtv"
                                    className="text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
                                >
                                    @cacaboxtv
                                </a>{' '}
                                sur X). En ayant accès aux mêmes technologies qu'eux, vous pouvez agrandir votre
                                audience à partir de contenus courts verticaux qui peut-être deviendront viraux.
                            </p>
                            <div className="mt-8">
                                <a
                                    href="/config"
                                    className="unselectable block w-full rounded-full bg-foreground px-7 py-3 text-center text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85 md:inline md:w-auto"
                                >
                                    Passer à la configuration de votre overlay
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
