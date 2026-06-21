import { useState } from 'react';
import { Bell, CheckCircle, Copy, Eye, EyeOff, LinkIcon, Pause, Play, ShieldAlert } from 'lucide-react';
import ObsGuide from './ObsGuide';

interface ServerConfig {
    soundEnabled: boolean;
    soundType: string;
    soundVolume: number;
}

interface OverlayEditorProps {
    username: string;
    validateAndSetUsername: (val: string) => void;
    generatedLink: string;
    isLinkBlurred: boolean;
    setIsLinkBlurred: (val: boolean) => void;
    justRegenerated: boolean;
    isGenerating: boolean;
    regenerateLink: () => void;
    draftConfig: ServerConfig;
    updateDraftConfig: <K extends keyof ServerConfig>(key: K, value: ServerConfig[K]) => void;
    isPlayingSoundWave: boolean;
    handlePlaySound: (type: string, volume: number) => void;
}

export default function OverlayEditor({
    username,
    validateAndSetUsername,
    generatedLink,
    isLinkBlurred,
    setIsLinkBlurred,
    justRegenerated,
    isGenerating,
    regenerateLink,
    draftConfig,
    updateDraftConfig,
    isPlayingSoundWave,
    handlePlaySound,
}: OverlayEditorProps) {
    const [isLinkCopied, setIsLinkCopied] = useState(false);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink).then(() => {
            setIsLinkCopied(true);
            setTimeout(() => setIsLinkCopied(false), 2000);
        });
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
            {/* Card 1 : Lien d'Overlay */}
            <div className="config-card space-y-6">
                <div>
                    <h3 className="text-lg font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <LinkIcon className="h-5 w-5" />
                        Lien d'overlay
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Lien unique source navigateur à intégrer sur OBS.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-white/3 p-4 sm:p-6 space-y-3.5">
                        <label className="block text-sm font-semibold text-muted-foreground">
                            URL Source Navigateur
                        </label>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div
                                className="relative flex-1 cursor-pointer group min-w-0"
                                onClick={() => isLinkBlurred && setIsLinkBlurred(false)}
                            >
                                <div className="overflow-x-hidden whitespace-pre font-mono scrollbar-thin rounded-lg bg-black/40 px-4 py-3 text-sm border border-white/5">
                                    <code className={isLinkBlurred ? 'blur-md select-none pointer-events-none' : ''}>
                                        {generatedLink}
                                    </code>
                                </div>
                                {isLinkBlurred && (
                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white bg-black/80 rounded-lg border border-white/5 group-hover:bg-black/75 transition-colors">
                                        Cliquez pour révéler le lien
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0 justify-end">
                                <button
                                    onClick={() => setIsLinkBlurred(!isLinkBlurred)}
                                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-white/3 hover:bg-white/5 transition-colors cursor-pointer"
                                    title={isLinkBlurred ? 'Révéler' : 'Masquer'}
                                >
                                    {isLinkBlurred ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    className="flex items-center gap-2 rounded-lg border border-border bg-white/3 hover:bg-white/5 px-4 h-11 text-sm font-semibold transition-colors cursor-pointer"
                                >
                                    <Copy className="h-4 w-4" />
                                    {isLinkCopied ? 'Copié !' : 'Copier'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Modification du pseudo inline */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                        <label htmlFor="username" className="text-xs font-semibold text-muted-foreground">
                            Modifier votre pseudo d'affichage
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                id="username"
                                placeholder="pseudo"
                                value={username}
                                onChange={(e) => validateAndSetUsername(e.target.value)}
                                className="config-input py-2 px-3 text-sm flex-1"
                            />
                        </div>
                    </div>

                    {/* Compromis token */}
                    <div
                        className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-300 ${
                            justRegenerated
                                ? 'border-emerald-500/20 bg-emerald-500/5'
                                : 'border-red-500/20 bg-red-500/5'
                        }`}
                    >
                        <div className="space-y-1 flex-1">
                            <p
                                className={`text-sm font-bold flex items-center gap-1.5 transition-colors duration-300 ${
                                    justRegenerated ? 'text-emerald-200' : 'text-red-200'
                                }`}
                            >
                                {justRegenerated ? (
                                    <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
                                ) : (
                                    <ShieldAlert className="h-4.5 w-4.5 text-red-400" />
                                )}
                                {justRegenerated ? 'Votre nouveau lien est prêt !' : 'Vous avez fait fuiter ce lien ?'}
                            </p>
                            <p
                                className={`text-xs leading-normal transition-colors duration-300 ${
                                    justRegenerated ? 'text-emerald-200/70' : 'text-red-200/70'
                                }`}
                            >
                                {justRegenerated
                                    ? 'Le nouveau lien a été généré et est prêt à être copié.'
                                    : "Pas de panique, si vous avez montré ce lien en stream, régénérez-le. L'ancien lien sera désactivé pour toujours."}
                            </p>
                        </div>
                        <button
                            onClick={regenerateLink}
                            disabled={isGenerating || justRegenerated}
                            className={`shrink-0 rounded-lg border px-4 py-2 text-xs font-bold transition-all duration-300 cursor-pointer ${
                                justRegenerated
                                    ? 'border-emerald-500/30 bg-emerald-500/25 text-emerald-200 cursor-not-allowed'
                                    : 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-200'
                            }`}
                        >
                            {justRegenerated ? 'Régénéré' : 'Régénérer'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Card 2 : Sons de Notification */}
            <div className="config-card space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Sons de Notification
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Alerte sonore lors de la réception d'un nouveau message.
                        </p>
                    </div>
                    <button
                        onClick={() => updateDraftConfig('soundEnabled', !draftConfig.soundEnabled)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${draftConfig.soundEnabled ? 'bg-white' : 'bg-white/10'}`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${draftConfig.soundEnabled ? 'bg-black translate-x-5' : 'bg-white translate-x-0'}`}
                        />
                    </button>
                </div>

                {draftConfig.soundEnabled && (
                    <div className="space-y-6 border-t border-white/5 pt-6">
                        {/* Type de signal */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-muted-foreground block">
                                Type de signal audio
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    {
                                        id: 'ping',
                                        name: 'Ping',
                                        desc: 'Signal bref et aigu',
                                    },
                                    {
                                        id: 'chime',
                                        name: 'Mélodique',
                                        desc: 'Accord arpégé',
                                    },
                                    {
                                        id: 'arcade',
                                        name: 'Arcade 8-bit',
                                        desc: 'Double bip rétro façon jeu vidéo',
                                    },
                                    {
                                        id: 'success',
                                        name: 'Succès',
                                        desc: 'Deux notes ascendantes, façon victoire',
                                    },
                                ].map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => updateDraftConfig('soundType', s.id)}
                                        className={`p-4 rounded-xl text-left border transition-colors text-xs font-semibold cursor-pointer ${
                                            draftConfig.soundType === s.id
                                                ? 'border-white bg-white/5'
                                                : 'border-white/5 bg-white/2 hover:bg-white/3'
                                        }`}
                                    >
                                        <p className="text-foreground font-bold text-sm">{s.name}</p>
                                        <p className="text-xs text-muted-foreground mt-1 font-normal leading-normal">
                                            {s.desc}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Test Button & State */}
                        <div className="flex flex-col items-center gap-3 pt-2">
                            <button
                                onClick={() => handlePlaySound(draftConfig.soundType, 50)}
                                disabled={isPlayingSoundWave}
                                className="flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/5 px-6 py-2.5 text-xs font-bold transition-colors text-center cursor-pointer"
                            >
                                {isPlayingSoundWave ? (
                                    <Pause className="h-3.5 w-3.5 fill-current text-white animate-pulse" />
                                ) : (
                                    <Play className="h-3.5 w-3.5 fill-current text-white" />
                                )}
                                Écouter le son
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Card 3 : Guide OBS */}
            <ObsGuide />
        </div>
    );
}
