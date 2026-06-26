import type { OverlayConfigRow } from '@livechat/types';
import { Plus, Settings2, Trash2, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OverlaysListProps {
    configs: OverlayConfigRow[];
    maxOverlays: number;
    onConfigure: (config: OverlayConfigRow) => void;
    onDelete: (token: string) => void;
    onOpenCreate: () => void;
}

export default function OverlaysList({
    configs,
    maxOverlays,
    onConfigure,
    onDelete,
    onOpenCreate,
}: OverlaysListProps) {
    const limitReached = configs.length >= maxOverlays;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold">Vos overlays</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {configs.length}/{maxOverlays} overlay{maxOverlays > 1 ? 's' : ''} sur ce serveur
                    </p>
                </div>
                <Button onClick={onOpenCreate} disabled={limitReached} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Créer un overlay
                </Button>
            </div>

            {limitReached && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-normal text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-200/80">
                    Limite de {maxOverlays} overlay{maxOverlays > 1 ? 's' : ''} atteinte. Supprimez-en un pour en créer
                    un nouveau.
                </div>
            )}

            {configs.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-14 text-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
                        <Tv className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Aucun overlay sur ce serveur.</p>
                    <Button variant="outline" size="sm" onClick={onOpenCreate}>
                        <Plus className="h-4 w-4" />
                        Créer un overlay
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                    {configs.map((config) => (
                        <div
                            key={config.token}
                            className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-center"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary">
                                    <Tv className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="font-medium">{config.username}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onConfigure(config)}
                                    className="flex-1 sm:flex-initial"
                                >
                                    <Settings2 className="h-3.5 w-3.5" />
                                    Configurer
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onDelete(config.token)}
                                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    aria-label={`Supprimer l'overlay ${config.username}`}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
