import type { DiscordGuild } from '@livechat/types';
import { ExternalLink, HelpCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isGuildAdmin } from '../../lib/discord';

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
            <div className="flex flex-col items-center justify-center gap-4 py-20">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Chargement de vos serveurs...</span>
            </div>
        );
    }

    if (isSessionExpired) {
        return (
            <div className="mx-auto max-w-sm py-12 text-center">
                <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-amber-500" />
                <h3 className="font-bold">Session Discord expirée</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Votre session a expiré. Veuillez vous reconnecter pour actualiser la liste de vos serveurs.
                </p>
                <Button variant="outline" onClick={handleLogin} className="mt-4">
                    Se reconnecter avec Discord
                </Button>
            </div>
        );
    }

    if (guilds.length === 0) {
        return (
            <div className="mx-auto max-w-sm py-12 text-center">
                <HelpCircle className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Aucun serveur Discord administré n'a été trouvé.</p>
                <Button variant="outline" onClick={() => loadGuilds(true)} className="mt-4">
                    Actualiser la liste
                </Button>
            </div>
        );
    }

    const installedGuilds = guilds.filter((g) => g.hasBot);
    const otherGuilds = guilds.filter((g) => !g.hasBot);

    const renderGuildCard = (g: DiscordGuild) => {
        const isOwner = g.owner;
        const isAdmin = isGuildAdmin(g);
        const roleLabel = isOwner ? 'Propriétaire' : isAdmin ? 'Administrateur' : 'Utilisateur';

        return (
            <div
                key={g.id}
                onClick={() => g.hasBot && onSelectGuild(g.id)}
                className={`flex flex-col justify-between rounded-lg border border-border bg-card p-5 transition-colors ${
                    g.hasBot ? 'cursor-pointer hover:bg-accent' : 'opacity-60'
                }`}
            >
                <div className="flex items-start gap-3">
                    {g.icon ? (
                        <img
                            src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-md border border-border object-cover"
                        />
                    ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-secondary text-sm font-bold uppercase text-muted-foreground">
                            {g.name.substring(0, 2)}
                        </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="truncate font-semibold">{g.name}</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{roleLabel}</span>
                            {g.hasBot && (
                                <Badge variant="secondary" className="text-[10px]">
                                    Bot installé
                                </Badge>
                            )}
                        </div>
                        {g.hasBot && (
                            <p className="text-xs text-muted-foreground">
                                {g.overlayCount && g.overlayCount > 0
                                    ? `${g.overlayCount} overlay${g.overlayCount > 1 ? 's' : ''}`
                                    : 'Aucun overlay'}
                            </p>
                        )}
                    </div>
                </div>

                {!g.hasBot ? (
                    <a
                        href={`https://discord.com/oauth2/authorize?client_id=1379921658109890610&permissions=1049600&scope=bot&guild_id=${g.id}&disable_guild_select=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#5865F2] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#4752C4]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Inviter le bot
                        <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                ) : (
                    <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-3 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90">
                        {g.overlayCount && g.overlayCount > 0 ? 'Gérer mes overlays' : 'Créer mon overlay'}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {installedGuilds.length > 0 && (
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Serveurs avec LiveChat ({installedGuilds.length})
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {installedGuilds.map(renderGuildCard)}
                    </div>
                </div>
            )}

            {installedGuilds.length > 0 && otherGuilds.length > 0 && <hr className="border-border" />}

            {otherGuilds.length > 0 && (
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Vos serveurs ({otherGuilds.length})
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {otherGuilds.map(renderGuildCard)}
                    </div>
                </div>
            )}
        </div>
    );
}
