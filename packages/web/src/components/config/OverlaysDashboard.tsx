import { CheckCircle, RefreshCw, ShieldAlert, Sliders, Trash2, Tv } from 'lucide-react';

interface DiscordGuild {
    id: string;
    name: string;
    permissions: string;
    owner: boolean;
}

interface OverlayConfigRow {
    guild_id: string;
    username: string;
    token: string;
    user_id: string;
    updated_at?: string;
}

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

    allGuildConfigs: any[];
    loadingAllConfigs: boolean;
    handleAdminDeleteConfig: (targetUsername: string) => void;
    isRoleRestrictionEnabled: boolean;
    setIsRoleRestrictionEnabled: (val: boolean) => void;
    requiredRoleId: string | null;
    setRequiredRoleId: (val: string | null) => void;
    guildRoles: any[];
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
    const perms = parseInt(selectedGuild.permissions);
    const isUserAdmin = selectedGuild.owner || (perms & 0x8) === 0x8 || (perms & 0x20) === 0x20;

    return (
        <div className="space-y-8 max-w-6xl mx-auto animate-fade-in">
            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between pb-2">
                        <div>
                            <h3 className="text-lg font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Tv className="h-5 w-5" />
                                Vos Overlays ({configs.length}/{maxOverlays})
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Sélectionnez l'overlay que vous souhaitez configurer.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {configs.length === 0 ? (
                            <div className="config-card py-10 text-center text-sm text-muted-foreground">
                                Aucun overlay créé sur ce serveur. Utilisez le formulaire ci-contre pour en créer un.
                            </div>
                        ) : (
                            configs.map((config) => (
                                <div
                                    key={config.token}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 transition-colors"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white">
                                            <Tv className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-base text-foreground truncate">
                                                {config.username}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 sm:justify-end">
                                        <button
                                            onClick={() => handleConfigureConfig(config)}
                                            className="flex items-center gap-2 rounded-lg border border-border bg-white/3 hover:bg-white/5 px-4 h-10 text-xs font-bold text-foreground transition-colors cursor-pointer"
                                        >
                                            <Sliders className="h-3.5 w-3.5" />
                                            Configurer
                                        </button>
                                        <button
                                            onClick={() => handleDeleteConfig(config.token)}
                                            className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 px-4 h-10 text-xs font-bold text-red-200 transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="w-full md:w-80 shrink-0">
                    {configs.length < maxOverlays ? (
                        <div className="config-card flex flex-col items-start text-left space-y-4">
                            <div className="space-y-1">
                                <h4 className="font-bold text-base text-foreground">Créer un overlay</h4>
                                <p className="text-xs text-muted-foreground leading-normal">
                                    Ajoutez un nouvel overlay indépendant pour ce serveur Discord.
                                </p>
                            </div>
                            <div className="w-full space-y-3 pt-2">
                                <div>
                                    <label
                                        htmlFor="newOverlayName"
                                        className="config-label text-xs text-muted-foreground font-semibold"
                                    >
                                        Pseudo d'affichage
                                    </label>
                                    <input
                                        type="text"
                                        id="newOverlayName"
                                        placeholder="noobmaster69"
                                        value={newOverlayName}
                                        onChange={(e) => {
                                            let clean = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                                            if (clean.startsWith('_')) clean = clean.substring(1);
                                            setNewOverlayName(clean);
                                        }}
                                        className="config-input py-2 px-3 text-sm"
                                    />
                                </div>
                                <button
                                    onClick={() => handleCreateConfig(newOverlayName)}
                                    disabled={isGenerating || !newOverlayName}
                                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-white/90 px-4 py-2.5 text-xs font-semibold text-black transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {isGenerating ? 'Création...' : 'Créer mon nouvel overlay'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="config-card border-amber-500/20 bg-amber-500/5 flex flex-col items-start text-left space-y-4">
                            <div className="space-y-1">
                                <h4 className="font-bold text-base text-amber-200">Limite atteinte</h4>
                                <p className="text-xs text-amber-200/70 leading-normal">
                                    Vous avez atteint la limite maximale de {maxOverlays} overlay
                                    {maxOverlays > 1 ? 's' : ''} par personne sur ce serveur.
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground leading-normal pt-1">
                                Pour créer un nouvel overlay, veuillez d'abord en supprimer un parmi vos configurations
                                actives sur ce serveur.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {isUserAdmin && (
                <div className="border-t border-white/5 pt-8 space-y-6">
                    <div>
                        <h3 className="text-lg font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5" />
                            Administration du serveur
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gérez les overlays des membres et configurez les autorisations d'utilisation de LiveChat
                            pour ce serveur.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Tv className="h-4.5 w-4.5" />
                                Overlays des membres ({allGuildConfigs.length})
                            </h4>

                            {loadingAllConfigs ? (
                                <div className="py-8 flex items-center gap-3">
                                    <RefreshCw className="h-5 w-5 animate-spin text-white/40" />
                                    <span className="text-xs text-muted-foreground font-semibold">
                                        Chargement des configurations...
                                    </span>
                                </div>
                            ) : allGuildConfigs.length === 0 ? (
                                <div className="config-card py-6 text-center text-xs text-muted-foreground">
                                    Aucune configuration active d'overlay sur ce serveur.
                                </div>
                            ) : (
                                <div className="grid gap-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                                    {allGuildConfigs.map((c) => (
                                        <div
                                            key={c.username}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-white/1"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-sm text-foreground truncate">
                                                    {c.username}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                    Créateur: <span className="font-mono text-[10px]">{c.user_id}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                    Dernière modification:{' '}
                                                    <span className="font-mono text-[10px]">
                                                        {new Date(c.updated_at).toLocaleString()}
                                                    </span>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleAdminDeleteConfig(c.username)}
                                                className="flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/20 px-3 h-8.5 text-xs font-bold text-red-200 transition-colors cursor-pointer shrink-0 w-full sm:w-auto"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Révoquer
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Sliders className="h-4.5 w-4.5" />
                                Configuration du Serveur
                            </h4>

                            <div className="config-card space-y-5">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-semibold text-foreground">Restreindre par rôle</p>
                                        <p className="text-xs text-muted-foreground max-w-xs leading-normal">
                                            Exiger un rôle Discord spécifique pour créer ou utiliser des overlays et les
                                            commandes /livechat.
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
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isRoleRestrictionEnabled ? 'bg-white' : 'bg-white/10'}`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${isRoleRestrictionEnabled ? 'bg-black translate-x-5' : 'bg-white translate-x-0'}`}
                                        />
                                    </button>
                                </div>

                                {isRoleRestrictionEnabled && (
                                    <div className="space-y-3 pt-2 border-t border-white/5">
                                        <label className="text-xs font-semibold text-muted-foreground block">
                                            Rôle requis
                                        </label>
                                        {loadingRoles ? (
                                            <div className="py-2 flex items-center gap-2">
                                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-white/40" />
                                                <span className="text-xs text-muted-foreground">
                                                    Chargement des rôles...
                                                </span>
                                            </div>
                                        ) : (
                                            <select
                                                value={requiredRoleId || ''}
                                                onChange={(e) => setRequiredRoleId(e.target.value || null)}
                                                className="config-input w-full py-2 px-3 text-sm rounded-lg"
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

                                <div className="space-y-3 pt-4 border-t border-white/5">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-semibold text-foreground">
                                            Limite d'overlays par personne
                                        </p>
                                        <p className="text-xs text-muted-foreground leading-normal">
                                            Nombre maximum d'overlays que chaque membre peut créer (min 1, max 20).
                                        </p>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="5"
                                        value={maxOverlaysInput}
                                        onChange={(e) => {
                                            const clean = e.target.value.replace(/[^0-9]/g, '');
                                            setMaxOverlaysInput(clean);
                                        }}
                                        className="config-input w-full py-2 px-3 text-sm rounded-lg"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={handleSaveSettings}
                                        disabled={savingSettings || !hasUnsavedSettings}
                                        className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 h-10 text-xs font-bold transition-all ${
                                            hasUnsavedSettings
                                                ? 'bg-white text-black hover:bg-white/95 cursor-pointer shadow-md'
                                                : 'bg-white/5 border border-border text-muted-foreground cursor-not-allowed opacity-50'
                                        }`}
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
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
