import { useCallback, useRef, useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import VideoModal from '../components/VideoModal';

const YOUTUBE_VIDEO_ID = 'iIK6me_W1BQ';

export default function Config() {
    const [username, setUsername] = useState('');
    const [guildId, setGuildId] = useState('');
    const [disableSplash, setDisableSplash] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [activeStep, setActiveStep] = useState('step-prereqs');
    const [videoOpen, setVideoOpen] = useState(false);
    const handleCloseVideo = useCallback(() => setVideoOpen(false), []);

    const steps = [
        { id: 'step-prereqs', label: 'Pré-requis', number: 1 },
        { id: 'step-install', label: 'Bot Discord', number: 2 },
        { id: 'step-config', label: 'Lien Overlay', number: 3 },
        { id: 'step-obs', label: 'Configuration OBS', number: 4 },
        { id: 'step-finish', label: "C'est prêt !", number: 5 },
    ];

    function validateUsername(value: string) {
        let v = value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        if (v.startsWith('_')) v = v.substring(1);
        setUsername(v);
    }

    function validateGuildId(value: string) {
        setGuildId(value.replace(/[^0-9]/g, ''));
    }

    function generateLink() {
        if (!username || !guildId) {
            alert('Veuillez remplir tous les champs.');
            return;
        }
        if (username.length < 4 || username.length > 25) {
            alert("Le nom d'utilisateur doit contenir entre 4 et 25 caractères.");
            return;
        }
        if (guildId.length < 17 || guildId.length > 21) {
            alert("L'ID du serveur doit contenir entre 17 et 21 caractères.");
            return;
        }
        const link = `https://${window.location.host}/overlay/overlay.html?username=${username}&guildId=${guildId}${disableSplash ? '&noSplash=true' : ''}`;
        setGeneratedLink(link);
    }

    function copyToClipboard(text: string, buttonId: string) {
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById(buttonId);
            if (btn) {
                const original = btn.textContent;
                btn.textContent = 'Copié !';
                setTimeout(() => {
                    btn.textContent = original;
                }, 2000);
            }
        });
    }

    const directionRef = useRef<'forward' | 'backward'>('forward');

    function goToStep(id: string) {
        const targetIndex = steps.findIndex((s) => s.id === id);
        directionRef.current = targetIndex >= currentIndex ? 'forward' : 'backward';
        setActiveStep(id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const currentIndex = steps.findIndex((s) => s.id === activeStep);

    return (
        <div className="dark flex min-h-screen flex-col text-foreground">
            <Header subtitle="Configuration" />
            <VideoModal
                open={videoOpen}
                onClose={handleCloseVideo}
                videoId={YOUTUBE_VIDEO_ID}
                title="Tutoriel LiveChat"
            />

            <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-6 sm:py-12">
                <div className="grid gap-6 md:grid-cols-[200px_1fr] md:gap-10">
                    {/* Sidebar — select sur mobile, nav sur desktop */}
                    <aside>
                        {/* Mobile: select dropdown */}
                        <div className="md:hidden">
                            <select
                                value={activeStep}
                                onChange={(e) => goToStep(e.target.value)}
                                className="w-full appearance-none rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {steps.map((step) => (
                                    <option key={step.id} value={step.id}>
                                        Étape {step.number} — {step.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => setVideoOpen(true)}
                                className="mt-3 flex w-full items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 pb-3.5 pt-3 text-sm font-semibold leading-none transition-colors duration-200 hover:border-white/25 hover:bg-white/10"
                            >
                                Tutoriel vidéo
                            </button>
                        </div>

                        {/* Desktop: nav verticale */}
                        <nav className="sticky top-24 hidden md:block">
                            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Étapes
                            </p>
                            <ul className="space-y-0.5">
                                {steps.map((step, i) => {
                                    const isActive = activeStep === step.id;
                                    const isPast = i < currentIndex;
                                    return (
                                        <li key={step.id}>
                                            <button
                                                onClick={() => goToStep(step.id)}
                                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-200 ${
                                                    isActive
                                                        ? 'bg-white/[0.07] font-semibold text-foreground'
                                                        : 'text-muted-foreground hover:bg-white/4 hover:text-foreground'
                                                }`}
                                            >
                                                <span
                                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-200 ${
                                                        isActive
                                                            ? 'bg-foreground text-background'
                                                            : isPast
                                                              ? 'bg-white/10 text-foreground'
                                                              : 'bg-white/5 text-muted-foreground'
                                                    }`}
                                                >
                                                    {isPast ? '✓' : step.number}
                                                </span>
                                                {step.label}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                            <button
                                onClick={() => setVideoOpen(true)}
                                className="mt-6 flex w-full items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 pb-3.5 pt-3 text-sm font-semibold leading-none transition-colors duration-200 hover:border-white/25 hover:bg-white/10"
                            >
                                Tutoriel vidéo
                            </button>
                        </nav>
                    </aside>

                    {/* Contenu */}
                    <section className="min-w-0">
                        <div
                            key={activeStep}
                            className={`config-step-transition ${
                                directionRef.current === 'forward'
                                    ? 'config-step-enter-forward'
                                    : 'config-step-enter-backward'
                            }`}
                        >
                            {activeStep === 'step-prereqs' && (
                                <div className="config-card">
                                    <h2 className="config-title">Pré-requis</h2>
                                    <p className="mt-4 text-muted-foreground">
                                        Avant de commencer, assurez-vous d'avoir les éléments suivants.
                                    </p>

                                    <div className="mt-6 space-y-4">
                                        <div className="flex gap-4 rounded-xl border border-border bg-white/2 px-5 py-4">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-lg">
                                                💬
                                            </span>
                                            <div>
                                                <p className="font-semibold">Un compte Discord et un serveur</p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Vous devez avoir un compte Discord ainsi qu'un serveur (de
                                                    préférence <strong className="text-foreground">privé</strong>) sur
                                                    lequel vous inviterez le bot LiveChat.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 rounded-xl border border-border bg-white/2 px-5 py-4">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-lg">
                                                🎥
                                            </span>
                                            <div>
                                                <p className="font-semibold">Un logiciel de streaming</p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Un logiciel capable d'afficher des sources navigateur, par exemple{' '}
                                                    <strong className="text-foreground">OBS Studio</strong>,{' '}
                                                    <strong className="text-foreground">Streamlabs</strong> ou tout
                                                    autre logiciel compatible.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 rounded-xl border border-border bg-white/2 px-5 py-4">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-lg">
                                                🌐
                                            </span>
                                            <div>
                                                <p className="font-semibold">Une bonne connexion internet</p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Un débit minimum de{' '}
                                                    <strong className="text-foreground">10 Mbps en upload</strong> est
                                                    recommandé pour streamer confortablement tout en affichant les
                                                    médias LiveChat en temps réel.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="unselectable mt-6 flex justify-end">
                                        <button onClick={() => goToStep('step-install')} className="config-nav-btn">
                                            Suivant →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeStep === 'step-install' && (
                                <div className="config-card">
                                    <h2 className="config-title">Installation du bot Discord</h2>
                                    <p className="mt-4 text-muted-foreground">
                                        Invitez le bot sur votre serveur{' '}
                                        <strong className="text-foreground">privé</strong> Discord. C'est grâce à lui
                                        que vous pourrez faire afficher du contenu sur votre overlay.
                                    </p>
                                    <p className="mt-2 text-muted-foreground">
                                        Une fois installé, tapez{' '}
                                        <code className="rounded bg-white/5 px-1.5 py-0.5 text-sm text-foreground">
                                            /livechat
                                        </code>{' '}
                                        dans un salon textuel et vérifiez si les commandes apparaissent.
                                    </p>
                                    <div className="mt-5 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-200/90">
                                        Tous les membres présents sur le serveur pourront utiliser LiveChat et faire
                                        apparaître du contenu sur votre flux.
                                        <br />
                                        S'il vous plaît, n'invitez que des personnes de confiance.
                                    </div>
                                    <div className="mt-6">
                                        <a
                                            href="https://discord.com/oauth2/authorize?client_id=1379921658109890610"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
                                        >
                                            Installer le bot
                                        </a>
                                    </div>
                                    <div className="unselectable mt-6 flex justify-between">
                                        <button onClick={() => goToStep('step-prereqs')} className="config-nav-btn">
                                            ← Précédent
                                        </button>
                                        <button onClick={() => goToStep('step-config')} className="config-nav-btn">
                                            Suivant →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeStep === 'step-config' && (
                                <div className="config-card">
                                    <h2 className="config-title">Générer votre lien d'overlay</h2>
                                    <p className="mt-4 text-muted-foreground">
                                        Remplissez les informations ci-dessous pour générer votre lien d'overlay unique.
                                    </p>

                                    <div className="mt-6 space-y-5">
                                        <div>
                                            <label htmlFor="username" className="config-label">
                                                Nom d'utilisateur
                                            </label>
                                            <input
                                                type="text"
                                                id="username"
                                                placeholder="terracid"
                                                value={username}
                                                onChange={(e) => validateUsername(e.target.value)}
                                                className="config-input"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="guildId" className="config-label">
                                                Identifiant du serveur Discord{' '}
                                                <span
                                                    className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-white/10 text-[10px] text-muted-foreground"
                                                    title="Mode développeur Discord requis > Clic droit sur le serveur > Copier l'identifiant"
                                                >
                                                    ?
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                id="guildId"
                                                placeholder="1433585274507628556"
                                                value={guildId}
                                                onChange={(e) => validateGuildId(e.target.value)}
                                                className="config-input"
                                            />
                                        </div>
                                        <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                            <input
                                                type="checkbox"
                                                checked={disableSplash}
                                                onChange={(e) => setDisableSplash(e.target.checked)}
                                                className="h-4 w-4 accent-white"
                                            />
                                            Désactiver l'écran de démarrage (splash screen)
                                        </label>
                                    </div>

                                    <button
                                        onClick={generateLink}
                                        className="mt-6 rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
                                    >
                                        Générer mon lien
                                    </button>

                                    {generatedLink && (
                                        <div className="mt-6 rounded-lg border border-border bg-white/3 p-4">
                                            <label className="mb-2 block text-sm font-medium">
                                                Votre lien d'overlay :
                                            </label>
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                                <code className="flex-1 break-all rounded-lg bg-white/5 px-3 py-2 text-xs sm:text-sm">
                                                    {generatedLink}
                                                </code>
                                                <button
                                                    id="copy-link-btn"
                                                    onClick={() => copyToClipboard(generatedLink, 'copy-link-btn')}
                                                    className="shrink-0 rounded-lg border border-border px-4 py-2 text-sm transition-colors duration-200 hover:bg-white/5"
                                                >
                                                    Copier
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="unselectable mt-6 flex justify-between">
                                        <button onClick={() => goToStep('step-install')} className="config-nav-btn">
                                            ← Précédent
                                        </button>
                                        <button onClick={() => goToStep('step-obs')} className="config-nav-btn">
                                            Suivant →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeStep === 'step-obs' && (
                                <div className="config-card">
                                    <h2 className="config-title">
                                        Configurer l'overlay sur votre logiciel de streaming
                                    </h2>
                                    <p className="mt-4 text-muted-foreground">
                                        Suivez ces étapes pour ajouter l'overlay à OBS Studio ou Streamlabs.
                                        <br />
                                        <em className="text-sm opacity-70">
                                            Pour les autres logiciels référez-vous à leur documentation pour ajouter une
                                            source Navigateur.
                                        </em>
                                    </p>
                                    <ol className="mt-6 space-y-3 text-muted-foreground">
                                        {[
                                            <>
                                                Ajoutez une source{' '}
                                                <strong className="text-foreground">Navigateur</strong>
                                            </>,
                                            <>
                                                Collez le lien généré précédemment dans{' '}
                                                <strong className="text-foreground">URL</strong>
                                            </>,
                                            <>
                                                Réglez la <strong className="text-foreground">Largeur</strong> sur{' '}
                                                <strong className="text-foreground">1920</strong> et la{' '}
                                                <strong className="text-foreground">Hauteur</strong> sur{' '}
                                                <strong className="text-foreground">1080</strong>
                                            </>,
                                            <>
                                                Cochez{' '}
                                                <strong className="text-foreground">Contrôler l'audio via OBS</strong>
                                            </>,
                                            <>
                                                Dans <strong className="text-foreground">CSS personnalisé</strong>,
                                                collez le code suivant :
                                                <span className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                                                    <code className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-xs sm:text-sm">
                                                        {'#cf-wrapper { display: none; }'}
                                                    </code>
                                                    <button
                                                        id="copy-css-btn"
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                '#cf-wrapper { display: none; }',
                                                                'copy-css-btn',
                                                            )
                                                        }
                                                        className="shrink-0 rounded-lg border border-border px-4 py-2 text-sm transition-colors duration-200 hover:bg-white/5"
                                                    >
                                                        Copier
                                                    </button>
                                                </span>
                                            </>,
                                            <>
                                                Cliquez sur <strong className="text-foreground">OK</strong> et placez la
                                                source au-dessus
                                            </>,
                                            <>
                                                Dans le mélangeur audio : cliquez sur l'engrenage &gt; trouvez la ligne
                                                de LiveChat &gt; puis sélectionnez{' '}
                                                <strong className="text-foreground">Monitoring et sortie</strong>
                                            </>,
                                        ].map((content, i) => (
                                            <li key={i} className="flex gap-3 text-sm sm:text-base">
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-muted-foreground">
                                                    {i + 1}
                                                </span>
                                                <span className="pt-0.5">{content}</span>
                                            </li>
                                        ))}
                                    </ol>

                                    <div className="unselectable mt-6 flex justify-between">
                                        <button onClick={() => goToStep('step-config')} className="config-nav-btn">
                                            ← Précédent
                                        </button>
                                        <button onClick={() => goToStep('step-finish')} className="config-nav-btn">
                                            Suivant →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeStep === 'step-finish' && (
                                <div className="config-card">
                                    <h2 className="config-title">Installation terminée !</h2>
                                    <p className="mt-4 text-muted-foreground">
                                        Félicitations, votre LiveChat est configuré et prêt à l'emploi.
                                    </p>

                                    <div className="mt-6 rounded-lg border border-border bg-white/3 px-4 py-3 text-sm text-muted-foreground">
                                        <strong className="text-foreground">💡 Pour commencer</strong> - Tapez{' '}
                                        <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-foreground">
                                            /livechat
                                        </code>{' '}
                                        dans un salon textuel de votre serveur Discord pour envoyer votre premier média
                                        sur l'overlay.
                                    </div>

                                    <div className="mt-6">
                                        <a
                                            href="/usage"
                                            className="inline-block rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
                                        >
                                            Découvrir comment utiliser LiveChat →
                                        </a>
                                    </div>

                                    <div className="mt-6 space-y-3">
                                        <p className="text-sm text-muted-foreground">
                                            En cas de problème ou pour une demande, n'hésitez pas à nous contacter.
                                        </p>
                                        <div className="flex flex-col gap-1.5">
                                            {[
                                                {
                                                    href: 'mailto:bonjour@nevylish.fr',
                                                    label: 'bonjour@nevylish.fr',
                                                },
                                                {
                                                    href: 'https://twitter.com/Nevylish',
                                                    label: 'Twitter/@Nevylish',
                                                },
                                                {
                                                    href: 'https://github.com/Nevylish/LiveChat',
                                                    label: 'GitHub/Nevylish/LiveChat',
                                                },
                                            ].map((link) => (
                                                <a
                                                    key={link.href}
                                                    href={link.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-muted-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
                                                >
                                                    {link.label}
                                                </a>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="unselectable mt-6 flex items-center justify-between">
                                        <button onClick={() => goToStep('step-obs')} className="config-nav-btn">
                                            ← Précédent
                                        </button>
                                        <a
                                            href="/"
                                            className="rounded-full border border-border px-5 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-white/5"
                                        >
                                            Retour à l'accueil
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
