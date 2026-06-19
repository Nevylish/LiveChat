import { EthernetPort } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Seo from '../components/Seo';
import VideoModal from '../components/VideoModal';

const YOUTUBE_VIDEO_ID = 'iIK6me_W1BQ';

export default function Config() {
    const [username, setUsername] = useState('');
    const [guildId, setGuildId] = useState('');
    const [disableSplash, setDisableSplash] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [activeStep, setActiveStep] = useState('step-prereqs');
    const [videoOpen, setVideoOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLinkBlurred, setIsLinkBlurred] = useState(true);
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
        setError(null);
    }

    function validateGuildId(value: string) {
        setGuildId(value.replace(/[^0-9]/g, ''));
        setError(null);
    }

    function generateLink() {
        if (!username || !guildId) {
            setError('Veuillez remplir tous les champs.');
            return;
        }
        if (username.length < 4 || username.length > 25) {
            setError("Le nom d'utilisateur doit contenir entre 4 et 25 caractères.");
            return;
        }
        if (guildId.length < 17 || guildId.length > 21) {
            setError("L'ID du serveur doit contenir entre 17 et 21 caractères.");
            return;
        }
        setError(null);
        setIsLinkBlurred(true);
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
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const currentIndex = steps.findIndex((s) => s.id === activeStep);

    return (
        <div className="dark flex min-h-screen flex-col text-foreground">
            <Seo
                title="Configurer LiveChat - Bot Discord et overlay"
                description="Configurez LiveChat en quelques minutes : installation du bot Discord, génération du lien d'overlay et intégration dans OBS Studio."
                path="/config"
            />
            <Header subtitle="Configuration" />
            <VideoModal
                open={videoOpen}
                onClose={handleCloseVideo}
                videoId={YOUTUBE_VIDEO_ID}
                title="Tutoriel LiveChat"
            />

            <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-6 sm:py-12">
                <div className="grid gap-6 md:grid-cols-[200px_1fr] md:gap-10">
                    {/* Sidebar - select sur mobile, nav sur desktop */}
                    <aside>
                        {/* Mobile: select dropdown */}
                        <div className="md:hidden">
                            <select
                                value={activeStep}
                                onChange={(e) => goToStep(e.target.value)}
                                className="w-full appearance-none rounded-lg border border-border bg-white/2 px-4 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {steps.map((step) => (
                                    <option key={step.id} value={step.id} className="bg-card text-foreground">
                                        Étape {step.number} - {step.label}
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

                                    <div className="mt-6 space-y-6">
                                        <div className="flex gap-4 items-start">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[#5865F2]">
                                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107 14.36 14.36 0 0 0 1.226 1.99.076.076 0 0 0 .084-.03 19.86 19.86 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
                                                </svg>
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

                                        <div className="flex gap-4 items-start">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    className="h-5 w-5 text-foreground"
                                                    fill="currentColor"
                                                >
                                                    <path d="M12,24C5.383,24,0,18.617,0,12S5.383,0,12,0s12,5.383,12,12S18.617,24,12,24z M12,1.109 C5.995,1.109,1.11,5.995,1.11,12C1.11,18.005,5.995,22.89,12,22.89S22.89,18.005,22.89,12C22.89,5.995,18.005,1.109,12,1.109z M6.182,5.99c0.352-1.698,1.503-3.229,3.05-3.996c-0.269,0.273-0.595,0.483-0.844,0.78c-1.02,1.1-1.48,2.692-1.199,4.156 c0.355,2.235,2.455,4.06,4.732,4.028c1.765,0.079,3.485-0.937,4.348-2.468c1.848,0.063,3.645,1.017,4.7,2.548 c0.54,0.799,0.962,1.736,0.991,2.711c-0.342-1.295-1.202-2.446-2.375-3.095c-1.135-0.639-2.529-0.802-3.772-0.425 c-1.56,0.448-2.849,1.723-3.293,3.293c-0.377,1.25-0.216,2.628,0.377,3.772c-0.825,1.429-2.315,2.449-3.932,2.756 c-1.244,0.261-2.551,0.059-3.709-0.464c1.036,0.302,2.161,0.355,3.191-0.011c1.381-0.457,2.522-1.567,3.024-2.935 c0.556-1.49,0.345-3.261-0.591-4.54c-0.7-1.007-1.803-1.717-3.002-1.969c-0.38-0.068-0.764-0.098-1.148-0.134 c-0.611-1.231-0.834-2.66-0.528-3.996L6.182,5.99z" />
                                                </svg>
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

                                        <div className="flex gap-4 items-start">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                                                <EthernetPort className="h-5 w-5 text-foreground" />
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
                                    <div className="my-8">
                                        <a
                                            href="https://discord.com/oauth2/authorize?client_id=1379921658109890610"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full rounded-full bg-foreground px-7 py-3 text-center text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85 sm:inline sm:w-auto"
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

                                    {error && (
                                        <div className="config-error mt-5 rounded-lg border border-[#ff0054]/25 bg-[#ff0054]/5 px-4 py-3 text-sm font-semibold text-[#ff0054]">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        onClick={generateLink}
                                        className="mt-6 w-full rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85 sm:w-auto"
                                    >
                                        Générer mon lien
                                    </button>

                                    {generatedLink && (
                                        <div className="mt-6 rounded-lg border border-border bg-white/3 p-4">
                                            <label className="mb-2 block text-sm font-medium">
                                                Votre lien d'overlay :
                                            </label>
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                                <div
                                                    className="relative flex-1 cursor-pointer group"
                                                    onClick={() => isLinkBlurred && setIsLinkBlurred(false)}
                                                >
                                                    <code
                                                        className={`block w-full break-all rounded-lg bg-white/5 px-3 py-2 text-xs sm:text-sm transition-all duration-300 ${
                                                            isLinkBlurred
                                                                ? 'blur-sm select-none pointer-events-none'
                                                                : ''
                                                        }`}
                                                    >
                                                        {generatedLink}
                                                    </code>
                                                    {isLinkBlurred && (
                                                        <div className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-semibold text-white/90 bg-black/60 rounded-lg backdrop-blur-[1px] border border-white/5 group-hover:bg-black/50 transition-colors">
                                                            ATTENTION : Cliquez pour révéler le lien (Ne pas montrer en
                                                            stream)
                                                        </div>
                                                    )}
                                                </div>
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
                                            className="block w-full rounded-full bg-foreground px-7 py-3 text-center text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85 sm:inline sm:w-auto"
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
