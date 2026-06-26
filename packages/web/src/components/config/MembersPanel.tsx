import type { OverlayConfigRow } from '@livechat/types';
import { RefreshCw, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MembersPanelProps {
    allGuildConfigs: OverlayConfigRow[];
    loadingAllConfigs: boolean;
    handleAdminDeleteConfig: (targetUsername: string) => void;
}

export default function MembersPanel({
    allGuildConfigs,
    loadingAllConfigs,
    handleAdminDeleteConfig,
}: MembersPanelProps) {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-base font-semibold">Overlays des membres</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Gérez et révoquez les overlays créés par les membres de ce serveur.
                </p>
            </div>

            {loadingAllConfigs ? (
                <div className="flex items-center gap-2 py-8">
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Chargement des configurations...</span>
                </div>
            ) : allGuildConfigs.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-14 text-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
                        <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Aucun overlay actif sur ce serveur.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {allGuildConfigs.map((c) => (
                        <div
                            key={c.username}
                            className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center"
                        >
                            <div className="min-w-0 flex-1 space-y-0.5">
                                <p className="truncate font-medium">{c.username}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                    ID : <span className="font-mono text-[10px]">{c.user_id}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Modifié :{' '}
                                    <span className="font-mono text-[10px]">
                                        {c.updated_at ? new Date(c.updated_at).toLocaleString() : '—'}
                                    </span>
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAdminDeleteConfig(c.username)}
                                className="w-full shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Révoquer
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
