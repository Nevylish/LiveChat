import type { DiscordRole } from '@livechat/types';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ServerSettingsProps {
    isRoleRestrictionEnabled: boolean;
    setIsRoleRestrictionEnabled: (val: boolean) => void;
    requiredRoleId: string | null;
    setRequiredRoleId: (val: string | null) => void;
    guildRoles: DiscordRole[];
    loadingRoles: boolean;
    maxOverlaysInput: string;
    setMaxOverlaysInput: (val: string) => void;
    savingSettings: boolean;
    settingsSuccess: boolean;
    handleSaveSettings: () => void;
    hasUnsavedSettings: boolean;
}

export default function ServerSettings({
    isRoleRestrictionEnabled,
    setIsRoleRestrictionEnabled,
    requiredRoleId,
    setRequiredRoleId,
    guildRoles,
    loadingRoles,
    maxOverlaysInput,
    setMaxOverlaysInput,
    savingSettings,
    settingsSuccess,
    handleSaveSettings,
    hasUnsavedSettings,
}: ServerSettingsProps) {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-base font-semibold">Paramètres du serveur</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Configurez les autorisations d'utilisation de LiveChat sur ce serveur.
                </p>
            </div>

            <div className="divide-y divide-border rounded-lg border border-border bg-card">
                {/* Role restriction */}
                <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium">Restreindre par rôle</p>
                            <p className="mt-0.5 max-w-md text-xs leading-normal text-muted-foreground">
                                Exiger un rôle Discord spécifique pour créer des overlays et utiliser les commandes
                                /livechat.
                            </p>
                        </div>
                        <button
                            role="switch"
                            aria-checked={isRoleRestrictionEnabled}
                            aria-label="Restreindre par rôle"
                            onClick={() => {
                                const nextState = !isRoleRestrictionEnabled;
                                setIsRoleRestrictionEnabled(nextState);
                                if (nextState && !requiredRoleId && guildRoles.length > 0) {
                                    setRequiredRoleId(guildRoles[0].id);
                                }
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                                isRoleRestrictionEnabled ? 'bg-foreground' : 'bg-border'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-background shadow transition duration-200 ${
                                    isRoleRestrictionEnabled ? 'translate-x-4' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>

                    {isRoleRestrictionEnabled && (
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Rôle requis</Label>
                            {loadingRoles ? (
                                <div className="flex items-center gap-2 py-2">
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Chargement des rôles...</span>
                                </div>
                            ) : (
                                <select
                                    value={requiredRoleId || ''}
                                    onChange={(e) => setRequiredRoleId(e.target.value || null)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    {guildRoles.length === 0 ? (
                                        <option value="">Aucun rôle disponible</option>
                                    ) : (
                                        guildRoles.map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {role.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            )}
                        </div>
                    )}
                </div>

                {/* Max overlays */}
                <div className="space-y-3 p-5">
                    <div>
                        <p className="text-sm font-medium">Limite d'overlays par personne</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Nombre maximum d'overlays que chaque membre peut créer (1 à 20).
                        </p>
                    </div>
                    <Input
                        inputMode="numeric"
                        placeholder="5"
                        value={maxOverlaysInput}
                        onChange={(e) => setMaxOverlaysInput(e.target.value.replace(/[^0-9]/g, ''))}
                        className="max-w-[120px]"
                    />
                </div>

                {/* Save */}
                <div className="flex items-center justify-end gap-3 p-5">
                    {settingsSuccess && (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Enregistré
                        </span>
                    )}
                    <Button
                        onClick={handleSaveSettings}
                        disabled={savingSettings || !hasUnsavedSettings}
                        size="sm"
                    >
                        {savingSettings ? (
                            <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                Sauvegarde...
                            </>
                        ) : (
                            'Enregistrer'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
