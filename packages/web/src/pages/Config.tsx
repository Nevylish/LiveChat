import { useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function Config() {
    const [username, setUsername] = useState('');
    const [guildId, setGuildId] = useState('');
    const [disableSplash, setDisableSplash] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [activeStep, setActiveStep] = useState('step-install');

    const steps = [
        { id: 'step-install', label: 'Bot Discord', number: 1 },
        { id: 'step-config', label: 'Configuration', number: 2 },
        { id: 'step-obs', label: 'Installation', number: 3 },
        { id: 'step-usage', label: 'Utilisation', number: 4 },
        { id: 'step-finish', label: "C'est bon !", number: 5 },
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

    function goToStep(id: string) {
        setActiveStep(id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const currentIndex = steps.findIndex((s) => s.id === activeStep);

    return (
        <div className="dark flex min-h-screen flex-col text-foreground">
            <Header subtitle="Configuration" />

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
                        </nav>
                    </aside>

                    {/* Contenu */}
                    <section className="min-w-0">
                        {activeStep === 'step-install' && (
                            <div className="config-card">
                                <h2 className="config-title">Installation du bot Discord</h2>
                                <p className="mt-4 text-muted-foreground">
                                    Pour commencer, invitez le bot sur votre serveur{' '}
                                    <strong className="text-foreground">privé</strong> Discord. Vous pouvez en créer un
                                    dédié à cette utilisation.
                                </p>
                                <p className="mt-2 text-muted-foreground">
                                    C'est grâce à lui que vous pourrez faire afficher du contenu sur votre overlay.
                                </p>
                                <p className="mt-2 text-muted-foreground">
                                    Tapez{' '}
                                    <code className="rounded bg-white/5 px-1.5 py-0.5 text-sm text-foreground">
                                        /livechat
                                    </code>{' '}
                                    dans un salon textuel pour afficher la commande. Nous reviendrons en profondeur sur
                                    son fonctionnement dans la quatrième partie.
                                </p>
                                <div className="mt-5 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-200/90">
                                    ⚠️ Gardez à l'esprit que tous les membres présents sur le serveur pourront utiliser
                                    le LiveChat et faire apparaître du contenu sur votre flux. N'invitez pas n'importe
                                    qui.
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
                                <div className="unselectable mt-6 flex justify-end">
                                    <button onClick={() => goToStep('step-config')} className="config-nav-btn">
                                        Suivant →
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeStep === 'step-config' && (
                            <div className="config-card">
                                <h2 className="config-title">Configuration</h2>
                                <p className="mt-4 text-muted-foreground">
                                    Remplissez les informations ci-dessous pour générer votre lien d'overlay unique.
                                </p>

                                <div className="mt-6 space-y-5">
                                    <div>
                                        <label htmlFor="username" className="config-label">
                                            Nom d'utilisateur Twitch
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
                                        <label className="mb-2 block text-sm font-medium">Votre lien d'overlay :</label>
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
                                <h2 className="config-title">Installation de l'overlay</h2>
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
                                            Ajoutez une source <strong className="text-foreground">Navigateur</strong>
                                        </>,
                                        <>
                                            Collez le lien généré précédemment dans{' '}
                                            <strong className="text-foreground">URL</strong>
                                        </>,
                                        <>
                                            Réglez la taille sur <strong className="text-foreground">1920x1080</strong>
                                        </>,
                                        <>
                                            Cochez{' '}
                                            <strong className="text-foreground">Contrôler l'audio via OBS</strong>
                                        </>,
                                        <>
                                            Cliquez sur <strong className="text-foreground">OK</strong> et placez la
                                            source au-dessus
                                        </>,
                                        <>
                                            Dans le mélangeur audio : clic droit &gt;{' '}
                                            <strong className="text-foreground">Propriétés audio avancées</strong> &gt;
                                            LiveChat &gt;{' '}
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

                                <div className="mt-6 rounded-lg border border-border bg-white/3 p-4">
                                    <p className="text-sm font-semibold">CSS Personnalisé (Optionnel)</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Pour masquer la page d'erreur Cloudflare si LiveChat est hors-ligne :
                                    </p>
                                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <code className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-xs sm:text-sm">
                                            {'#cf-wrapper { display: none; }'}
                                        </code>
                                        <button
                                            id="copy-css-btn"
                                            onClick={() =>
                                                copyToClipboard('#cf-wrapper { display: none; }', 'copy-css-btn')
                                            }
                                            className="shrink-0 rounded-lg border border-border px-4 py-2 text-sm transition-colors duration-200 hover:bg-white/5"
                                        >
                                            Copier
                                        </button>
                                    </div>
                                </div>

                                <div className="unselectable mt-6 flex justify-between">
                                    <button onClick={() => goToStep('step-config')} className="config-nav-btn">
                                        ← Précédent
                                    </button>
                                    <button onClick={() => goToStep('step-usage')} className="config-nav-btn">
                                        Suivant →
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeStep === 'step-usage' && (
                            <div className="config-card">
                                <h2 className="config-title">Utiliser LiveChat</h2>
                                <p className="mt-4 text-muted-foreground">
                                    Utilisez la commande{' '}
                                    <code className="rounded bg-white/5 px-1.5 py-0.5 text-sm text-foreground">
                                        /livechat
                                    </code>{' '}
                                    sur Discord pour partager des médias.
                                </p>
                                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground sm:text-base">
                                    {[
                                        { label: 'Cible', desc: 'Sélectionnez le streamer' },
                                        {
                                            label: 'URL',
                                            desc: "Lien direct ou lien d'une des plateformes supportées",
                                        },
                                        { label: 'Fichier', desc: 'Upload direct depuis votre PC' },
                                        { label: 'Texte', desc: 'Ajoute un texte style Meme' },
                                        {
                                            label: 'Fullscreen',
                                            desc: 'Affiche le média en plein écran',
                                        },
                                    ].map((item) => (
                                        <li key={item.label} className="flex gap-2">
                                            <strong className="shrink-0 text-foreground">{item.label} :</strong>
                                            <span>{item.desc}</span>
                                        </li>
                                    ))}
                                </ul>

                                <h3 className="mt-8 text-base font-semibold sm:text-lg">
                                    Vous avez trois manières de partager vos médias :
                                </h3>
                                <ol className="mt-4 space-y-2 text-sm text-muted-foreground sm:text-base">
                                    <li className="flex gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-bold">
                                            1
                                        </span>
                                        Envoyer un fichier depuis votre PC via l'option "Fichier"
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-bold">
                                            2
                                        </span>
                                        Envoyer un lien direct terminant par l'extension du fichier via "URL"
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-bold">
                                            3
                                        </span>
                                        Envoyer un lien d'une des plateformes supportées (TikTok, X, etc.) — pas besoin
                                        de télécharger le média !
                                    </li>
                                </ol>

                                <p className="mt-5 text-sm text-muted-foreground sm:text-base">
                                    Actuellement supporté :{' '}
                                    {['Discord', 'TikTok', 'Giphy', 'Tenor', 'X'].map((p, i) => (
                                        <span key={p}>
                                            <strong className="text-foreground">{p}</strong>
                                            {i < 4 ? ', ' : '.'}
                                        </span>
                                    ))}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Formats : .mp4, .webm, .mkv, .mov, .mp3, .wav, .ogg, .jpg, .png, .gif, .webp
                                </p>

                                <div className="mt-5 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-200/90">
                                    ⚠️ Les liens YouTube ou autres plateformes non cités ne sont pas supportés
                                    directement. Téléchargez d'abord le média puis utilisez l'option Fichier.
                                </div>

                                <p className="mt-5 text-sm text-muted-foreground sm:text-base">
                                    Il existe aussi deux autres commandes :
                                    <br />
                                    <code className="rounded bg-white/5 px-1.5 py-0.5 text-sm text-foreground">
                                        /skip
                                    </code>{' '}
                                    : Passer au média suivant
                                    <br />
                                    <code className="rounded bg-white/5 px-1.5 py-0.5 text-sm text-foreground">
                                        /clear
                                    </code>{' '}
                                    : Stopper le média actuel et vider la file d'attente
                                </p>

                                <div className="unselectable mt-6 flex justify-between">
                                    <button onClick={() => goToStep('step-obs')} className="config-nav-btn">
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
                                <h2 className="config-title">C'est bon ! 🎉</h2>
                                <p className="mt-4 text-muted-foreground">Félicitations, LiveChat est prêt.</p>
                                <div className="mt-6 space-y-3">
                                    <p className="text-muted-foreground">
                                        En cas de problème ou pour une demande, vous pouvez me contacter par mail, sur
                                        Twitter ou ouvrir une issue sur GitHub.
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
                                    <button onClick={() => goToStep('step-usage')} className="config-nav-btn">
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
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
