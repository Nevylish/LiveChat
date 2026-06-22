import { ExternalLink, HelpCircle, RefreshCw, ShieldAlert } from 'lucide-react';

interface DiscordGuild {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
    hasBot?: boolean;
    overlayCount?: number;
}

interface GuildGridProps {
    guilds: DiscordGuild[];
    fetchingGuilds: boolean;
    isSessionExpired: boolean;
    loadGuilds: (force: boolean) => void;
    handleLogin: () => void;
    onSelectGuild: (guildId: string) => void;
}

export default function GuildGrid({
    guilds,
    fetchingGuilds,
    isSessionExpired,
    loadGuilds,
    handleLogin,
    onSelectGuild,
}: GuildGridProps) {
    if (fetchingGuilds) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <RefreshCw className="h-10 w-10 animate-spin text-white/60" />
                <span className="text-sm font-semibold text-muted-foreground">Chargement de vos serveurs...</span>
            </div>
        );
    }

    if (isSessionExpired) {
        return (
            <div className="config-card py-16 text-center max-w-md mx-auto space-y-4">
                <ShieldAlert className="h-12 w-12 opacity-80 mx-auto text-amber-500" />
                <h3 className="font-bold text-lg text-foreground">Session Discord expirée</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Votre session Discord a expiré ou a été réinitialisée. Veuillez vous reconnecter pour actualiser la
                    liste de vos serveurs de stream.
                </p>
                <button
                    onClick={handleLogin}
                    className="rounded-lg bg-white hover:bg-white/90 text-black px-6 py-2.5 text-xs font-bold transition-colors cursor-pointer"
                >
                    Se connecter avec Discord
                </button>
            </div>
        );
    }

    if (guilds.length === 0) {
        return (
            <div className="config-card py-16 text-center max-w-md mx-auto space-y-4">
                <HelpCircle className="h-12 w-12 opacity-40 mx-auto text-muted-foreground" />
                <p className="text-base text-muted-foreground">Aucun serveur Discord administré n'a été trouvé.</p>
                <button
                    onClick={() => loadGuilds(true)}
                    className="rounded-full bg-white/10 hover:bg-white/15 px-6 py-2 text-sm font-semibold transition-colors cursor-pointer"
                >
                    Actualiser la liste
                </button>
            </div>
        );
    }

    const installedGuilds = guilds.filter((g) => g.hasBot);
    const otherGuilds = guilds.filter((g) => !g.hasBot);

    const renderGuildCard = (g: DiscordGuild) => {
        const perms = parseInt(g.permissions) || 0;
        const isOwner = g.owner;
        const isAdmin = (perms & 0x8) === 0x8 || (perms & 0x20) === 0x20;
        const roleLabel = isOwner ? 'Propriétaire' : isAdmin ? 'Administrateur' : 'Utilisateur';

        return (
            <div
                key={g.id}
                onClick={() => g.hasBot && onSelectGuild(g.id)}
                className={`config-card flex flex-col justify-between h-full p-6 transition-colors group border ${
                    g.hasBot
                        ? 'cursor-pointer hover:border-white/30 bg-white/2 hover:bg-white/4'
                        : 'bg-white/1 border-white/5 opacity-70'
                }`}
            >
                <div className="flex items-start gap-4">
                    {g.icon ? (
                        <img
                            src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`}
                            alt=""
                            className="h-14 w-14 rounded-2xl shrink-0 object-cover border border-white/10"
                        />
                    ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold text-muted-foreground uppercase">
                            {g.name.substring(0, 2)}
                        </div>
                    )}
                    <div className="space-y-1 min-w-0 flex-1">
                        <h3 className="font-bold text-base sm:text-lg truncate transition-colors">{g.name}</h3>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">{roleLabel}</span>
                            </div>
                            {g.hasBot && (
                                <p className="text-xs text-muted-foreground">
                                    {g.overlayCount && g.overlayCount > 0
                                        ? `${g.overlayCount} overlay${g.overlayCount > 1 ? 's' : ''} configuré${g.overlayCount > 1 ? 's' : ''}`
                                        : 'Aucun overlay créé'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {!g.hasBot ? (
                    <a
                        href={`https://discord.com/oauth2/authorize?client_id=1379921658109890610&permissions=1049600&scope=bot&guild_id=${g.id}&disable_guild_select=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] px-4 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Inviter le bot
                        <ExternalLink className="h-4 w-4" />
                    </a>
                ) : (
                    <div className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white hover:bg-white/90 px-4 py-2.5 text-sm font-bold text-black transition-colors">
                        {g.overlayCount && g.overlayCount > 0 ? 'Gérer mes overlays' : 'Créer mon overlay'}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-10">
            {installedGuilds.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                        Serveurs avec LiveChat ({installedGuilds.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {installedGuilds.map(renderGuildCard)}
                    </div>
                </div>
            )}

            {installedGuilds.length > 0 && otherGuilds.length > 0 && <div className="border-t border-white/5 my-8" />}

            {otherGuilds.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        Vos serveurs ({otherGuilds.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {otherGuilds.map(renderGuildCard)}
                    </div>
                </div>
            )}
        </div>
    );
}
