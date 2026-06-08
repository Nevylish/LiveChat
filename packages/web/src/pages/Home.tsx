import Footer from '../components/Footer';
import Header from '../components/Header';

export default function Home() {
    return (
        <div className="dark min-h-screen text-foreground">
            <div className="bg-layer" />
            <Header />

            <main>
                {/* Hero */}
                <section className="relative flex min-h-[calc(100vh-65px)] items-center py-16 md:py-0">
                    <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 md:grid-cols-2 md:items-center md:gap-16">
                        <div className="max-md:text-center">
                            <h1 className="text-[2.25rem] font-extrabold leading-[1.1] tracking-tight sm:text-[2.75rem] md:text-5xl">
                                Laissez vos amis
                                <br />
                                animer vos streams
                            </h1>
                            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                                Avec LiveChat, vos amis peuvent ajouter une couche d'humour à vos lives.
                                <br className="hidden sm:block" />
                                Et puis s'ils sont vos amis, c'est que vous les trouvez drôles, n'est-ce pas?
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3 max-md:justify-center">
                                <a
                                    href="/config"
                                    className="rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
                                >
                                    Configurer votre overlay
                                </a>
                                <a
                                    href="https://www.youtube.com/watch?v=50IjxVbd9Ew"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-full border border-border px-7 py-3 text-sm font-semibold transition-colors duration-200 hover:border-foreground/25 hover:bg-white/5"
                                >
                                    Démonstration vidéo
                                </a>
                            </div>
                        </div>
                        <div className="max-md:flex max-md:justify-center">
                            <img
                                src="/assets/images/livechat_preview.png"
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
                            <div className="max-md:text-center">
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
                                    src="/assets/images/card_tiktok.png"
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
                                    src="/assets/images/card_streamtogether.png"
                                    alt="Streamez à plusieurs"
                                    className="feature-visual-img w-full max-w-sm rounded-xl md:max-w-none"
                                    draggable={false}
                                />
                            </div>
                            <div className="order-1 max-md:text-center md:order-2">
                                <h2 className="text-2xl font-bold sm:text-3xl">Streamez à plusieurs</h2>
                                <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                    Invitez vos amis à installer LiveChat en configurant le même serveur Discord que
                                    vous et streamez ensemble !
                                </p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="grid items-center gap-8 sm:gap-12 md:grid-cols-2">
                            <div className="max-md:text-center">
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
                                    src="/assets/images/card_platforms.png"
                                    alt="Compatible avec toutes les applications de streaming"
                                    className="feature-visual-img w-full max-w-sm rounded-xl md:max-w-none"
                                    draggable={false}
                                />
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="text-center">
                            <h2 className="text-2xl font-bold sm:text-3xl">En route vers le succès 🏆</h2>
                            <p className="text-left mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
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
                                    className="rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
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
