import { ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import JsonLd from '../components/JsonLd';
import PageShell from '../components/PageShell';
import ScrollReveal from '../components/ScrollReveal';
import VideoModal from '../components/VideoModal';
import { API_BASE_URL } from '../lib/constants';

const YOUTUBE_VIDEO_ID = '50IjxVbd9Ew';

const faqs = [
    {
        question: 'Est-ce gratuit ?',
        answer: "Oui, LiveChat est totalement gratuit et open-source. Vous pouvez depuis Discord souscrire à un abonnement Plus, mais il ne débloque pas de fonctionnalités supplémentaires, seulement des slots additionnels (c'est surtout pour soutenir le projet).",
    },
    {
        question: 'Est-ce sécurisé ?',
        answer: "Complètement, le code est libre et tout le monde peut le regarder, le système est prévu pour maîtriser les risques, notamment grâce au fait de créer un serveur Discord uniquement pour ça. De plus, vos informations personnelles sont protégées grâce à notre système de proxy, il est impossible de récupérer votre adresse IP par exemple.Vous pouvez consulter notre politique de confidentialité pour plus d'informations.",
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
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
};

const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
};

export default function Home() {
    const [stats, setStats] = useState<{ streamers: number; servers: number } | null>(null);
    const [videoOpen, setVideoOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const handleCloseVideo = useCallback(() => setVideoOpen(false), []);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/stats`)
            .then((res) => res.json())
            .then((data) => setStats(data))
            .catch(() => {});
    }, []);

    return (
        <PageShell
            title="LiveChat - Laissez vos amis animer vos streams"
            description="LiveChat est un bot Discord et un overlay pour streameurs qui permet d'afficher une image, une vidéo ou jouer un son sur un flux en direct, depuis une simple commande Discord."
            path="/"
        >
            <JsonLd data={softwareApplicationSchema} />
            <JsonLd data={faqPageSchema} />
            <VideoModal
                open={videoOpen}
                onClose={handleCloseVideo}
                videoId={YOUTUBE_VIDEO_ID}
                title="Démonstration LiveChat"
            />

            <main>
                {/* Hero */}
                <section className="relative flex min-h-[calc(100dvh-3.5rem)] items-center py-12 lg:h-[calc(100dvh-3.5rem)] lg:min-h-0 lg:py-0">
                    <div className="mx-auto w-full max-w-6xl -translate-y-3 px-4 sm:-translate-y-4 sm:px-6">
                        <div className="mx-auto grid w-full max-w-5xl gap-8 md:grid-cols-2 md:items-center md:gap-x-14 md:gap-y-10">
                            <div>
                                <h1 className="text-[2.25rem] font-extrabold leading-[1.1] tracking-tight sm:text-[2.75rem] md:text-5xl">
                                    Laissez vos amis
                                    <br />
                                    animer vos streams
                                </h1>
                                <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                                    Avec LiveChat, vos amis peuvent ajouter une couche d'humour à vos lives.
                                </p>

                                <div className="mt-8 flex select-none flex-col gap-3 sm:flex-row sm:flex-wrap">
                                    <a
                                        href="/config"
                                        className="inline-flex w-full items-center justify-center rounded-full bg-foreground px-7 py-3 text-center text-sm font-semibold text-background transition-opacity hover:opacity-85 sm:w-auto"
                                    >
                                        Configurer votre overlay
                                    </a>
                                    <button
                                        onClick={() => setVideoOpen(true)}
                                        className="btn-secondary w-full justify-center px-7 sm:w-auto"
                                    >
                                        Démonstration vidéo
                                    </button>
                                </div>

                                <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-8 sm:flex sm:gap-x-14">
                                    <div>
                                        <p className="flex items-baseline gap-2.5">
                                            <span className="text-3xl font-bold tracking-tight tabular-nums">
                                                {stats !== null ? stats.streamers : '—'}
                                            </span>
                                            {stats !== null && stats.streamers > 0 && (
                                                <span className="relative flex h-1.5 w-1.5 shrink-0 translate-y-[-3px]">
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                </span>
                                            )}
                                        </p>
                                        <p className="mt-1.5 text-sm text-muted-foreground">
                                            {stats !== null && stats.streamers <= 1
                                                ? 'Streameur·euse en direct'
                                                : 'Streameurs·euses en direct'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold tracking-tight tabular-nums">
                                            {stats !== null ? stats.servers : '—'}
                                        </p>
                                        <p className="mt-1.5 text-sm text-muted-foreground">
                                            {stats !== null && stats.servers <= 1
                                                ? 'Serveur Discord'
                                                : 'Serveurs Discord'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center pb-2 md:justify-end md:pb-0">
                                <img
                                    src="/assets/images/livechat_preview.png"
                                    alt="Prévisualisation de l'overlay LiveChat"
                                    className="w-full max-w-[220px] rounded-xl sm:max-w-[280px] md:max-w-[340px]"
                                    width={349}
                                    height={518}
                                    draggable={false}
                                    loading="eager"
                                    fetchPriority="high"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 animate-bounce text-muted-foreground transition-colors hover:text-foreground md:block"
                        aria-label="Défiler vers le bas"
                    >
                        <ChevronDown className="h-6 w-6" />
                    </button>
                </section>

                {/* Features */}
                <section id="features" className="py-20 sm:py-28">
                    <div className="mx-auto max-w-6xl space-y-20 px-4 sm:space-y-28 sm:px-6">
                        <ScrollReveal direction="up">
                            <div className="mx-auto max-w-4xl space-y-4 border-b border-border pb-12 text-left sm:pb-16">
                                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                    Une nouvelle manière d'intégrer vos proches à vos streams.
                                </h2>
                                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                                    LiveChat réinvente l'interaction avec vos spectateurs. En associant un bot Discord à
                                    un overlay de stream, cette solution open-source gratuite permet à vos amis
                                    d'afficher des images, de lancer des vidéos ou de jouer des sons en direct sur vos
                                    streams Twitch, YouTube, Kick ou n'importe quelle autre plateforme. Que ce soit pour
                                    faire des blagues, montrer une photo de vacances ou juste mettre un cri effrayant à
                                    3 heures du matin, LiveChat est là et prêt à être utilisé.
                                </p>
                                <p className="text-xs leading-relaxed text-muted-foreground/60 sm:text-sm">
                                    Faites défiler la page pour découvrir quelques-unes des fonctionnalités que nous
                                    proposons.
                                </p>
                            </div>
                        </ScrollReveal>

                        <div className="grid items-center gap-8 sm:gap-12 md:grid-cols-2">
                            <ScrollReveal direction="up">
                                <div>
                                    <h2 className="text-2xl font-bold sm:text-3xl">
                                        Prise en charge de plusieurs plateformes
                                    </h2>
                                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                        Partager des TikToks, des Tweets et plus encore en envoyant simplement un lien
                                        sans devoir télécharger l'image ou la vidéo.
                                    </p>
                                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                        Utilisez la commande{' '}
                                        <strong className="text-foreground">/liste-des-plateformes</strong> ou{' '}
                                        <a
                                            href="/usage#platforms"
                                            className="text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
                                        >
                                            cliquez ici
                                        </a>{' '}
                                        pour découvrir la liste des plateformes supportées.
                                        <br />
                                        Et bien sûr, vous pouvez uploader vos propres fichiers.
                                    </p>
                                </div>
                            </ScrollReveal>
                            <ScrollReveal direction="left" delay={150} className="max-md:flex max-md:justify-center">
                                <img
                                    src="/assets/images/card_tiktok.png"
                                    alt="Prise en charge TikTok"
                                    className="w-full max-w-sm rounded-xl border border-border transition-transform duration-300 md:max-w-none"
                                    width={540}
                                    height={304}
                                    draggable={false}
                                    loading="lazy"
                                />
                            </ScrollReveal>
                        </div>

                        <div className="grid items-center gap-8 sm:gap-12 md:grid-cols-2">
                            <ScrollReveal
                                direction="right"
                                delay={150}
                                className="order-2 max-md:flex max-md:justify-center md:order-1"
                            >
                                <img
                                    src="/assets/images/card_streamtogether_white.png"
                                    alt="Streamez à plusieurs"
                                    className="w-full max-w-sm rounded-xl border border-border transition-transform duration-300 dark:hidden md:max-w-none"
                                    width={540}
                                    height={304}
                                    draggable={false}
                                    loading="lazy"
                                />
                                <img
                                    src="/assets/images/card_streamtogether.png"
                                    alt=""
                                    aria-hidden
                                    className="hidden w-full max-w-sm rounded-xl border border-border transition-transform duration-300 dark:block md:max-w-none"
                                    width={540}
                                    height={304}
                                    draggable={false}
                                    loading="lazy"
                                />
                            </ScrollReveal>
                            <ScrollReveal direction="up" className="order-1 md:order-2">
                                <div>
                                    <h2 className="text-2xl font-bold sm:text-3xl">Streamez à plusieurs</h2>
                                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                        Invitez vos amis à installer LiveChat en configurant le même serveur Discord que
                                        vous et streamez ensemble !
                                    </p>
                                </div>
                            </ScrollReveal>
                        </div>

                        <div className="grid items-center gap-8 sm:gap-12 md:grid-cols-2">
                            <ScrollReveal direction="up">
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
                                        et tous les autres logiciels sur lesquels vous pouvez ajouter une source
                                        Navigateur Web.
                                    </p>
                                </div>
                            </ScrollReveal>
                            <ScrollReveal direction="left" delay={150} className="max-md:flex max-md:justify-center">
                                <img
                                    src="/assets/images/card_platforms.png"
                                    alt="Compatible avec toutes les applications de streaming"
                                    className="w-full max-w-sm rounded-xl border border-border transition-transform duration-300 md:max-w-none"
                                    width={540}
                                    height={304}
                                    draggable={false}
                                    loading="lazy"
                                />
                            </ScrollReveal>
                        </div>

                        {/* FAQ */}
                        <div className="mx-auto w-full max-w-2xl">
                            <ScrollReveal direction="up">
                                <h2 className="text-center text-2xl font-bold sm:text-3xl">Questions fréquentes</h2>
                            </ScrollReveal>
                            <div className="mt-10 divide-y divide-border border-y border-border">
                                {faqs.map((faq, i) => {
                                    const isOpen = openFaq === i;
                                    return (
                                        <ScrollReveal key={i} direction="up" delay={i * 80}>
                                            <div className="py-5">
                                                <button
                                                    onClick={() => setOpenFaq(isOpen ? null : i)}
                                                    className="flex w-full select-none items-center justify-between gap-4 text-left text-base font-semibold outline-none transition-colors hover:text-muted-foreground"
                                                >
                                                    {faq.question}
                                                    <ChevronDown
                                                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${
                                                            isOpen ? '-rotate-180' : ''
                                                        }`}
                                                    />
                                                </button>
                                                <div
                                                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                                                        isOpen
                                                            ? 'grid-rows-[1fr] opacity-100'
                                                            : 'grid-rows-[0fr] opacity-0'
                                                    }`}
                                                >
                                                    <div className="overflow-hidden">
                                                        <p className="pt-3 text-sm leading-relaxed text-muted-foreground">
                                                            {faq.answer}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </ScrollReveal>
                                    );
                                })}
                            </div>
                        </div>

                        {/* CTA bottom */}
                        <ScrollReveal direction="up">
                            <div className="mx-auto max-w-2xl">
                                <h2 className="text-center text-2xl font-bold sm:text-3xl">
                                    En route vers le succès 🏆
                                </h2>
                                <p className="mt-4 text-left text-sm leading-relaxed text-muted-foreground sm:text-base">
                                    LiveChat est une fonctionnalité rendue populaire par le groupe de streameurs Cacabox
                                    (
                                    <a
                                        href="https://x.com/cacaboxtv"
                                        className="text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
                                    >
                                        @cacaboxtv
                                    </a>{' '}
                                    sur X). En ayant accès aux mêmes technologies qu'eux, vous pouvez agrandir votre
                                    audience à partir de contenus courts verticaux qui peut-être deviendront viraux.
                                </p>
                                <div className="mt-8 text-center">
                                    <a
                                        href="/config"
                                        className="inline-block select-none rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-85"
                                    >
                                        Passer à la configuration de votre overlay
                                    </a>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </section>
            </main>
        </PageShell>
    );
}
