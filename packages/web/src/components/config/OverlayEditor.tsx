import { CheckCircle, Copy, Eye, EyeOff, LinkIcon, ShieldAlert, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import ObsGuide from './ObsGuide';

interface OverlayEditorProps {
    overlayName: string;
    username: string;
    validateAndSetUsername: (val: string) => void;
    generatedLink: string;
    isLinkBlurred: boolean;
    setIsLinkBlurred: (val: boolean) => void;
    justRegenerated: boolean;
    isGenerating: boolean;
    regenerateLink: () => void;
    hasUnsavedChanges: boolean;
    onSave: () => void;
    onDelete: () => void;
}

export default function OverlayEditor({
    overlayName,
    username,
    validateAndSetUsername,
    generatedLink,
    isLinkBlurred,
    setIsLinkBlurred,
    justRegenerated,
    isGenerating,
    regenerateLink,
    hasUnsavedChanges,
    onSave,
    onDelete,
}: OverlayEditorProps) {
    const [isLinkCopied, setIsLinkCopied] = useState(false);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink).then(() => {
            setIsLinkCopied(true);
            setTimeout(() => setIsLinkCopied(false), 2000);
        });
    };

    return (
        <div className="space-y-6">
            {/* Editor header with actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="truncate text-lg font-bold leading-tight">{overlayName}</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">Configuration de l'overlay</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={onSave} disabled={!hasUnsavedChanges || isGenerating} className="flex-1 sm:flex-initial">
                        Sauvegarder
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onDelete}
                        disabled={isGenerating}
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 space-y-5">
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <LinkIcon className="h-4 w-4" />
                        Lien d'overlay
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Intégrez ce lien dans n'importe quel logiciel supportant les sources navigateur.
                    </p>
                </div>

                {/* URL row */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div
                        className="relative min-w-0 flex-1 cursor-pointer"
                        onClick={() => isLinkBlurred && setIsLinkBlurred(false)}
                    >
                        <div className="overflow-x-hidden rounded-md border border-input bg-muted px-3 py-2.5">
                            <code
                                className={`block whitespace-pre font-mono text-xs ${isLinkBlurred ? 'pointer-events-none select-none blur-sm' : ''}`}
                            >
                                {generatedLink}
                            </code>
                        </div>
                        {isLinkBlurred && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/80 text-xs font-semibold transition-colors hover:bg-background/70">
                                Cliquez pour révéler
                            </div>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsLinkBlurred(!isLinkBlurred)}
                            title={isLinkBlurred ? 'Révéler' : 'Masquer'}
                        >
                            {isLinkBlurred ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" onClick={handleCopyLink} className="flex-1 sm:flex-initial">
                            <Copy className="h-4 w-4" />
                            {isLinkCopied ? 'Copié !' : 'Copier'}
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* Username edit */}
                <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-xs text-muted-foreground">
                        Modifier votre pseudo d'affichage
                    </Label>
                    <Input
                        id="username"
                        placeholder="pseudo"
                        value={username}
                        onChange={(e) => validateAndSetUsername(e.target.value)}
                    />
                </div>

                {/* Regenerate section */}
                <div
                    className={`flex flex-col gap-3 rounded-md border p-4 transition-colors duration-300 sm:flex-row sm:items-center sm:justify-between ${
                        justRegenerated
                            ? 'border-emerald-300 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5'
                            : 'border-destructive/20 bg-destructive/5'
                    }`}
                >
                    <div className="flex-1">
                        <p
                            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors duration-300 ${
                                justRegenerated
                                    ? 'text-emerald-700 dark:text-emerald-200'
                                    : 'text-destructive'
                            }`}
                        >
                            {justRegenerated ? (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                            ) : (
                                <ShieldAlert className="h-4 w-4" />
                            )}
                            {justRegenerated ? 'Votre nouveau lien est prêt !' : 'Vous avez fait fuiter ce lien ?'}
                        </p>
                        <p
                            className={`mt-0.5 text-xs leading-normal transition-colors duration-300 ${
                                justRegenerated
                                    ? 'text-emerald-600 dark:text-emerald-200/70'
                                    : 'text-destructive/70'
                            }`}
                        >
                            {justRegenerated
                                ? 'Le nouveau lien a été généré et est prêt à être copié.'
                                : "Régénérez le lien — l'ancien sera désactivé définitivement."}
                        </p>
                    </div>
                    <button
                        onClick={regenerateLink}
                        disabled={isGenerating || justRegenerated}
                        className={`shrink-0 cursor-pointer rounded-md border px-3 py-1.5 text-xs font-semibold transition-all duration-300 disabled:cursor-not-allowed ${
                            justRegenerated
                                ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-200'
                                : 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20'
                        }`}
                    >
                        {justRegenerated ? 'Régénéré' : 'Régénérer'}
                    </button>
                </div>
            </div>

            <ObsGuide />
        </div>
    );
}
