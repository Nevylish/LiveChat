import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DiscordGuild } from '@livechat/types';
import { ChevronRight, ExternalLink, HelpCircle, Lock, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { isGuildAdmin } from '../../lib/discord';

interface GuildGridProps {
    guilds: DiscordGuild[];
    fetchingGuilds: boolean;
    isSessionExpired: boolean;
    loadGuilds: (force: boolean) => void;
    handleLogin: () => void;
    onSelectGuild: (guildId: string) => void;
    restrictedGuildIds?: Set<string>;
}

const INVITE_URL = (guildId: string) =>
    `https://discord.com/oauth2/authorize?client_id=1379921658109890610&permissions=1049600&scope=bot&guild_id=${guildId}&disable_guild_select=true`;

function GuildIcon({ guild, muted = false }: { guild: DiscordGuild; muted?: boolean }) {
    if (guild.icon) {
        return (
            <img
                src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                alt=""
                className={`h-10 w-10 shrink-0 rounded-lg border border-border object-cover ${
                    muted ? 'opacity-60 grayscale' : ''
                }`}
            />
        );
    }
    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold uppercase text-muted-foreground">
            {guild.name.substring(0, 2)}
        </div>
    );
}

function roleOf(g: DiscordGuild): string {
    if (g.owner) return 'Propriétaire';
    return isGuildAdmin(g) ? 'Administrateur' : 'Membre';
}

export default function GuildGrid({
    guilds,
    fetchingGuilds,
    isSessionExpired,
    loadGuilds,
    handleLogin,
    onSelectGuild,
    restrictedGuildIds = new Set(),
}: GuildGridProps) {
    const [query, setQuery] = useState('');

    const { installed, others } = useMemo(() => {
        const q = query.trim().toLowerCase();
        const filtered = q ? guilds.filter((g) => g.name.toLowerCase().includes(q)) : guilds;
        return {
            installed: filtered.filter((g) => g.hasBot),
            others: filtered.filter((g) => !g.hasBot),
        };
    }, [guilds, query]);

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

    const showSearch = guilds.length > 6;
    const noResults = query.trim() !== '' && installed.length === 0 && others.length === 0;

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-lg font-bold leading-tight">Vos serveurs</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Sélectionnez un serveur pour gérer ses overlays.
                    </p>
                </div>
                {showSearch && (
                    <div className="relative w-full sm:w-64">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Rechercher un serveur..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                )}
            </div>

            {noResults ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-14 text-center">
                    <Search className="h-6 w-6 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                        Aucun serveur ne correspond à «&nbsp;{query}&nbsp;».
                    </p>
                </div>
            ) : (
                <>
                    {installed.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Avec LiveChat ({installed.length})
                                </h2>
                            </div>
                            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                                {installed.map((g) => {
                                    const count = g.overlayCount ?? 0;
                                    const isRestricted = restrictedGuildIds.has(g.id);
                                    return (
                                        <button
                                            key={g.id}
                                            onClick={() => onSelectGuild(g.id)}
                                            className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent"
                                        >
                                            <div className="relative shrink-0">
                                                <GuildIcon guild={g} />
                                                {isRestricted && (
                                                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 ring-2 ring-card">
                                                        <Lock className="h-2.5 w-2.5 text-white" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium">{g.name}</p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {isRestricted ? (
                                                        <span className="text-amber-600 dark:text-amber-400">
                                                            Accès restreint · rôle requis
                                                        </span>
                                                    ) : (
                                                        <>
                                                            {roleOf(g)} ·{' '}
                                                            {count > 0
                                                                ? `${count} overlay${count > 1 ? 's' : ''}`
                                                                : 'Aucun overlay'}
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {others.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Inviter LiveChat ({others.length})
                            </h2>
                            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                                {others.map((g) => (
                                    <div key={g.id} className="flex items-center gap-3 px-4 py-3.5">
                                        <GuildIcon guild={g} muted />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-muted-foreground">{g.name}</p>
                                            <p className="truncate text-xs text-muted-foreground/70">{roleOf(g)}</p>
                                        </div>
                                        <Button asChild variant="outline" size="sm" className="shrink-0">
                                            <a href={INVITE_URL(g.id)} target="_blank" rel="noopener noreferrer">
                                                Inviter
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
