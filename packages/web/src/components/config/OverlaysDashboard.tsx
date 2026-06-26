import type { DiscordGuild, DiscordRole, OverlayConfigRow } from '@livechat/types';
import { CheckCircle, RefreshCw, ShieldAlert, Sliders, Trash2, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { isGuildAdmin } from '../../lib/discord';

interface OverlaysDashboardProps {
    selectedGuild: DiscordGuild;
    configs: OverlayConfigRow[];
    maxOverlays: number;
    newOverlayName: string;
    setNewOverlayName: (val: string) => void;
    isGenerating: boolean;
    handleCreateConfig: (customName: string) => void;
    handleConfigureConfig: (config: OverlayConfigRow) => void;
    handleDeleteConfig: (token: string) => void;
    allGuildConfigs: OverlayConfigRow[];
    loadingAllConfigs: boolean;
    handleAdminDeleteConfig: (targetUsername: string) => void;
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

export default function OverlaysDashboard({
    selectedGuild,
    configs,
    maxOverlays,
    newOverlayName,
    setNewOverlayName,
    isGenerating,
    handleCreateConfig,
    handleConfigureConfig,
    handleDeleteConfig,
    allGuildConfigs,
    loadingAllConfigs,
    handleAdminDeleteConfig,
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
}: OverlaysDashboardProps) {
    const isUserAdmin = isGuildAdmin(selectedGuild);

    return (
        <div className="space-y-8">
            {/* Overlays list + create form */}
            <div className="flex flex-col gap-6 md:flex-row">
                {/* List */}
                <div className="flex-1 space-y-3">
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                            <Tv className="h-4 w-4" />
                            Vos overlays ({configs.length}/{maxOverlays})
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Sélectionnez l'overlay que vous souhaitez configurer.
                        </p>
                    </div>

                    <div className="space-y-2">
                        {configs.length === 0 ? (
                            <div className="rounded-lg border border-border bg-card py-10 text-center text-sm text-muted-foreground">
                                Aucun overlay créé. Utilisez le formulaire pour en créer un.
                            </div>
                        ) : (
                            configs.map((config) => (
                                <div
                                    key={config.token}
                                    className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary">
                                            <Tv className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <p className="font-semibold">{config.username}</p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleConfigureConfig(config)}
                                        >
                                            <Sliders className="h-3.5 w-3.5" />
                                            Configurer
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteConfig(config.token)}
                                            className="border-destructive/30 text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Supprimer
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Create form */}
                <div className="w-full shrink-0 md:w-72">
                    {configs.length < maxOverlays ? (
                        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold">Créer un overlay</h4>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Ajoutez un nouvel overlay indépendant pour ce serveur.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="newOverlayName" className="text-xs text-muted-foreground">
                                        Pseudo d'affichage
                                    </Label>
                                    <Input
                                        id="newOverlayName"
                                        placeholder="noobmaster69"
                                        value={newOverlayName}
                                        onChange={(e) => {
                                            let clean = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                                            if (clean.startsWith('_')) clean = clean.substring(1);
                                            setNewOverlayName(clean);
                                        }}
                                    />
                                </div>
                                <Button
                                    onClick={() => handleCreateConfig(newOverlayName)}
                                    disabled={isGenerating || !newOverlayName}
                                    className="w-full"
                                    size="sm"
                                >
                                    {isGenerating ? 'Création...' : 'Créer mon nouvel overlay'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-amber-300 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-5">
                            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">Limite atteinte</h4>
                            <p className="mt-1 text-xs leading-normal text-amber-700 dark:text-amber-200/70">
                                Vous avez atteint la limite de {maxOverlays} overlay{maxOverlays > 1 ? 's' : ''} sur ce
                                serveur. Supprimez-en un pour en créer un nouveau.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Admin section */}
            {isUserAdmin && (
                <>
                    <Separator />
                    <div className="space-y-6">
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
                                <ShieldAlert className="h-4 w-4" />
                                Administration du serveur
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Gérez les overlays des membres et configurez les autorisations pour ce serveur.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* All overlays list */}
                            <div className="space-y-3">
                                <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <Tv className="h-3.5 w-3.5" />
                                    Overlays des membres ({allGuildConfigs.length})
                                </h4>

                                {loadingAllConfigs ? (
                                    <div className="flex items-center gap-2 py-4">
                                        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Chargement...</span>
                                    </div>
                                ) : allGuildConfigs.length === 0 ? (
                                    <div className="rounded-lg border border-border bg-card py-5 text-center text-xs text-muted-foreground">
                                        Aucune configuration active sur ce serveur.
                                    </div>
                                ) : (
                                    <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                                        {allGuildConfigs.map((c) => (
                                            <div
                                                key={c.username}
                                                className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold">{c.username}</p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        ID:{' '}
                                                        <span className="font-mono text-[10px]">{c.user_id}</span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {c.updated_at
                                                            ? new Date(c.updated_at).toLocaleDateString()
                                                            : '—'}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAdminDeleteConfig(c.username)}
                                                    className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 sm:w-auto"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Révoquer
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Server settings */}
                            <div className="space-y-3">
                                <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <Sliders className="h-3.5 w-3.5" />
                                    Configuration du serveur
                                </h4>

                                <div className="rounded-lg border border-border bg-card p-5 space-y-5">
                                    {/* Role restriction toggle */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold">Restreindre par rôle</p>
                                            <p className="mt-0.5 text-xs leading-normal text-muted-foreground">
                                                Exiger un rôle Discord pour créer des overlays et utiliser /livechat.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const nextState = !isRoleRestrictionEnabled;
                                                setIsRoleRestrictionEnabled(nextState);
                                                if (nextState && !requiredRoleId && guildRoles.length > 0) {
                                                    setRequiredRoleId(guildRoles[0].id);
                                                }
                                            }}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${isRoleRestrictionEnabled ? 'bg-foreground' : 'bg-border'}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full shadow transition duration-200 ${isRoleRestrictionEnabled ? 'translate-x-4 bg-background' : 'translate-x-0 bg-background'}`}
                                            />
                                        </button>
                                    </div>

                                    {isRoleRestrictionEnabled && (
                                        <div className="space-y-1.5 border-t border-border pt-4">
                                            <Label className="text-xs text-muted-foreground">Rôle requis</Label>
                                            {loadingRoles ? (
                                                <div className="flex items-center gap-2 py-2">
                                                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">
                                                        Chargement des rôles...
                                                    </span>
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

                                    {/* Max overlays */}
                                    <div className="space-y-1.5 border-t border-border pt-4">
                                        <div>
                                            <p className="text-sm font-semibold">Limite d'overlays par personne</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                Maximum d'overlays par membre (1 à 20).
                                            </p>
                                        </div>
                                        <Input
                                            placeholder="5"
                                            value={maxOverlaysInput}
                                            onChange={(e) =>
                                                setMaxOverlaysInput(e.target.value.replace(/[^0-9]/g, ''))
                                            }
                                        />
                                    </div>

                                    <Button
                                        onClick={handleSaveSettings}
                                        disabled={savingSettings || !hasUnsavedSettings}
                                        className="w-full"
                                        size="sm"
                                    >
                                        {savingSettings ? (
                                            <>
                                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                Sauvegarde...
                                            </>
                                        ) : settingsSuccess ? (
                                            <>
                                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                                Configuration enregistrée !
                                            </>
                                        ) : (
                                            'Enregistrer la configuration'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
