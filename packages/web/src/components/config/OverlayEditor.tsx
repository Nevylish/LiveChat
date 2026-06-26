import { CheckCircle, Copy, Eye, EyeOff, LinkIcon, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import ObsGuide from './ObsGuide';

interface OverlayEditorProps {
    username: string;
    validateAndSetUsername: (val: string) => void;
    generatedLink: string;
    isLinkBlurred: boolean;
    setIsLinkBlurred: (val: boolean) => void;
    justRegenerated: boolean;
    isGenerating: boolean;
    regenerateLink: () => void;
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
            <div className="config-card space-y-5">
                <div>
                    <h3 className="text-lg font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <LinkIcon className="h-5 w-5" />
                        Lien d'overlay
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        Voici votre lien d'overlay, vous pouvez l'intégrer à n'importe quel logiciel qui supporte les
                        sources navigateur.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-white/3 p-4 sm:p-6 space-y-3.5">
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

                            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                                <button
                                    onClick={() => setIsLinkBlurred(!isLinkBlurred)}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-white/3 hover:bg-white/5 transition-colors cursor-pointer"
                                    title={isLinkBlurred ? 'Révéler' : 'Masquer'}
                                >
                                    {isLinkBlurred ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-lg border border-border bg-white/3 hover:bg-white/5 px-4 h-11 text-sm font-semibold transition-colors cursor-pointer"
                                >
                                    <Copy className="h-4 w-4" />
                                    {isLinkCopied ? 'Copié !' : 'Copier'}
                                </button>
                            </div>
                        </div>
                    </div>

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

            <ObsGuide />
        </div>
    );
}
