import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
    DevCacheStatsResponse,
    DevConnectedStreamer,
    DevGuildRow,
    DevMediaResolveResponse,
    DevOverviewResponse,
    DevPaginationMeta,
    OverlayConfigRow,
} from '@livechat/types';
import {
    ExternalLink,
    Eye,
    EyeOff,
    LayoutDashboard,
    Loader2,
    Radio,
    RefreshCw,
    ScrollText,
    Search,
    Server,
    ShieldAlert,
    Trash2,
    Wifi,
    WifiOff,
    Wrench,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
    clearDevCache,
    deleteDevOverlay,
    fetchDevCacheStats,
    fetchDevGuilds,
    fetchDevOverview,
    fetchDevStreamers,
    resolveDevMediaUrl,
    searchDevOverlays,
    type DevOverlaySearchParams,
} from '../api/devApi';
import PageShell from '../components/PageShell';
import AdminLogViewer from '../components/admin/AdminLogViewer';
import ListPagination from '../components/admin/ListPagination';
import ConfigTabs, { type TabItem } from '../components/config/ConfigTabs';
import LoginView from '../components/config/LoginView';
import { useAuth } from '../hooks/useAuth';
import { useDevAdmin } from '../hooks/useDevAdmin';
import { openDiscordLoginPopup } from '../lib/authApi';
import { buildOverlayLink } from '../lib/constants';
import { getErrorMessage } from '../lib/errors';

type AdminTab = 'overview' | 'live' | 'guilds' | 'search' | 'logs' | 'tools';

function formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
            {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
        </div>
    );
}

function TabPanel({
    title,
    description,
    children,
    action,
}: {
    title: string;
    description?: string;
    children: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold">{title}</h2>
                    {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

function DataTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
    if (rows.length === 0) {
        return <p className="text-sm text-muted-foreground">Aucune donnée.</p>;
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="border-b border-border bg-muted/40">
                    <tr>
                        {headers.map((header) => (
                            <th key={header} className="px-3 py-2 font-medium text-muted-foreground">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((cells, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-border/60 last:border-0">
                            {cells.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-3 py-2 align-top">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function Admin() {
    const { session, authLoading } = useAuth();
    const accessToken = session?.access_token;
    const { isDevAdmin, accessChecked } = useDevAdmin(accessToken);

    const [activeTab, setActiveTab] = useState<AdminTab>('overview');

    const [overview, setOverview] = useState<DevOverviewResponse | null>(null);
    const [streamers, setStreamers] = useState<DevConnectedStreamer[]>([]);
    const [streamersPage, setStreamersPage] = useState(1);
    const [streamersPagination, setStreamersPagination] = useState<DevPaginationMeta | null>(null);
    const [guilds, setGuilds] = useState<DevGuildRow[]>([]);
    const [guildsPage, setGuildsPage] = useState(1);
    const [guildsPagination, setGuildsPagination] = useState<DevPaginationMeta | null>(null);
    const [cacheStats, setCacheStats] = useState<DevCacheStatsResponse | null>(null);

    const [overlayGuildId, setOverlayGuildId] = useState('');
    const [overlayUsername, setOverlayUsername] = useState('');
    const [overlayToken, setOverlayToken] = useState('');
    const [overlayUserId, setOverlayUserId] = useState('');
    const [overlayResults, setOverlayResults] = useState<OverlayConfigRow[]>([]);
    const [overlaysPage, setOverlaysPage] = useState(1);
    const [overlayPagination, setOverlayPagination] = useState<DevPaginationMeta | null>(null);
    const [overlaySearchActive, setOverlaySearchActive] = useState(false);
    const [revealedTokens, setRevealedTokens] = useState<Set<string>>(new Set());

    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaResult, setMediaResult] = useState<DevMediaResolveResponse | null>(null);

    const [loading, setLoading] = useState(false);
    const [sectionError, setSectionError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleLogin = useCallback(async () => {
        try {
            openDiscordLoginPopup();
        } catch (err) {
            console.error('Login error', getErrorMessage(err, 'Erreur de connexion.'));
        }
    }, []);

    const loadOverview = useCallback(async () => {
        if (!accessToken) return;
        const data = await fetchDevOverview(accessToken);
        setOverview(data);
    }, [accessToken]);

    const loadStreamers = useCallback(
        async (page: number) => {
            if (!accessToken) return;
            const data = await fetchDevStreamers(accessToken, { page });
            setStreamers(data.streamers);
            setStreamersPagination(data.pagination);
            setStreamersPage(data.pagination.page);
        },
        [accessToken],
    );

    const loadGuilds = useCallback(
        async (page: number) => {
            if (!accessToken) return;
            const data = await fetchDevGuilds(accessToken, { page });
            setGuilds(data.guilds);
            setGuildsPagination(data.pagination);
            setGuildsPage(data.pagination.page);
        },
        [accessToken],
    );

    const searchOverlays = useCallback(
        async (page: number, filters?: DevOverlaySearchParams) => {
            if (!accessToken) return;

            const resolvedFilters = filters ?? {
                guildId: overlayGuildId || undefined,
                username: overlayUsername || undefined,
                token: overlayToken || undefined,
                userId: overlayUserId || undefined,
            };

            if (
                !resolvedFilters.guildId &&
                !resolvedFilters.username &&
                !resolvedFilters.token &&
                !resolvedFilters.userId
            ) {
                return;
            }

            const data = await searchDevOverlays(accessToken, resolvedFilters, { page });
            setOverlayResults(data.overlays);
            setOverlayPagination(data.pagination);
            setOverlaysPage(data.pagination.page);
            setOverlaySearchActive(true);
        },
        [accessToken, overlayGuildId, overlayUsername, overlayToken, overlayUserId],
    );

    const loadCache = useCallback(async () => {
        if (!accessToken) return;
        const data = await fetchDevCacheStats(accessToken);
        setCacheStats(data);
    }, [accessToken]);

    const refreshAll = useCallback(async () => {
        if (!accessToken || !isDevAdmin) return;
        setLoading(true);
        setSectionError(null);
        try {
            await Promise.all([
                loadOverview(),
                loadStreamers(streamersPage),
                loadGuilds(guildsPage),
                loadCache(),
                overlaySearchActive ? searchOverlays(overlaysPage) : Promise.resolve(),
            ]);
        } catch (err) {
            setSectionError(getErrorMessage(err, 'Erreur lors du chargement.'));
        } finally {
            setLoading(false);
        }
    }, [
        accessToken,
        isDevAdmin,
        loadOverview,
        loadStreamers,
        streamersPage,
        loadGuilds,
        guildsPage,
        loadCache,
        overlaySearchActive,
        searchOverlays,
        overlaysPage,
    ]);

    useEffect(() => {
        if (!isDevAdmin || !accessToken) return;
        void loadOverview().catch(() => {});
        void loadCache().catch(() => {});
    }, [isDevAdmin, accessToken, loadOverview, loadCache]);

    useEffect(() => {
        if (!isDevAdmin || !accessToken) return;
        void loadStreamers(streamersPage).catch((err) => {
            setSectionError(getErrorMessage(err, 'Erreur lors du chargement des connexions.'));
        });
    }, [isDevAdmin, accessToken, streamersPage, loadStreamers]);

    useEffect(() => {
        if (!isDevAdmin || !accessToken) return;
        void loadGuilds(guildsPage).catch((err) => {
            setSectionError(getErrorMessage(err, 'Erreur lors du chargement des guilds.'));
        });
    }, [isDevAdmin, accessToken, guildsPage, loadGuilds]);

    const handleOverlaysPageChange = (page: number) => {
        setOverlaysPage(page);
        void searchOverlays(page).catch((err) => {
            setSectionError(getErrorMessage(err, 'Erreur lors de la recherche.'));
        });
    };

    useEffect(() => {
        if (!isDevAdmin || !accessToken) return;

        const interval = setInterval(() => {
            void loadOverview().catch(() => {});
        }, 10_000);

        return () => clearInterval(interval);
    }, [isDevAdmin, accessToken, loadOverview]);

    const handleSearchOverlays = async () => {
        if (!accessToken) return;
        if (!overlayGuildId && !overlayUsername && !overlayToken && !overlayUserId) {
            setSectionError('Renseignez au moins un filtre de recherche.');
            return;
        }

        setActionLoading('search');
        setSectionError(null);
        try {
            setOverlaysPage(1);
            await searchOverlays(1);
        } catch (err) {
            setSectionError(getErrorMessage(err, 'Recherche échouée.'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteOverlay = async (token: string, username: string) => {
        if (!accessToken) return;
        if (!window.confirm(`Supprimer définitivement l'overlay « ${username} » ?`)) return;

        setActionLoading(`delete-${token}`);
        setSectionError(null);
        try {
            await deleteDevOverlay(accessToken, token);
            const nextPage = overlayResults.length === 1 && overlaysPage > 1 ? overlaysPage - 1 : overlaysPage;
            if (nextPage !== overlaysPage) {
                setOverlaysPage(nextPage);
            } else {
                await searchOverlays(overlaysPage);
            }
            await Promise.all([loadOverview(), loadGuilds(guildsPage)]);
        } catch (err) {
            setSectionError(getErrorMessage(err, 'Suppression échouée.'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleResolveMedia = async () => {
        if (!accessToken || !mediaUrl.trim()) return;

        setActionLoading('media');
        setSectionError(null);
        setMediaResult(null);
        try {
            const result = await resolveDevMediaUrl(accessToken, mediaUrl.trim());
            setMediaResult(result);
        } catch (err) {
            setSectionError(getErrorMessage(err, 'Résolution échouée.'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleClearCache = async () => {
        if (!accessToken) return;
        if (!window.confirm('Vider tout le cache en mémoire du serveur ?')) return;

        setActionLoading('cache');
        setSectionError(null);
        try {
            await clearDevCache(accessToken);
            await Promise.all([loadCache(), loadOverview()]);
        } catch (err) {
            setSectionError(getErrorMessage(err, 'Vidage du cache échoué.'));
        } finally {
            setActionLoading(null);
        }
    };

    const toggleTokenReveal = (token: string) => {
        setRevealedTokens((prev) => {
            const next = new Set(prev);
            if (next.has(token)) next.delete(token);
            else next.add(token);
            return next;
        });
    };

    const handleOpenOverlay = (token: string, username: string) => {
        if (!window.confirm(`Ouvrir l'overlay « ${username} » dans un nouvel onglet ?`)) return;
        window.open(buildOverlayLink(token), '_blank', 'noopener,noreferrer');
    };

    const filterGuildOverlays = (guildId: string) => {
        setOverlayGuildId(guildId);
        setOverlayUsername('');
        setOverlayToken('');
        setOverlayUserId('');
        setOverlaysPage(1);
        setOverlaySearchActive(true);
        setActiveTab('search');
        void searchOverlays(1, { guildId }).catch((err) => {
            setSectionError(getErrorMessage(err, 'Recherche échouée.'));
        });
        document.getElementById('overlay-search')?.scrollIntoView({ behavior: 'smooth' });
    };

    const tabs = useMemo((): TabItem<AdminTab>[] => {
        return [
            {
                id: 'overview',
                label: "Vue d'ensemble",
                icon: <LayoutDashboard className="h-4 w-4" />,
            },
            {
                id: 'live',
                label: 'En direct',
                icon: <Radio className="h-4 w-4" />,
                count: overview?.streamers.connected ?? streamersPagination?.total,
            },
            {
                id: 'guilds',
                label: 'Serveurs',
                icon: <Server className="h-4 w-4" />,
                count: overview?.discord.guildCount ?? guildsPagination?.total,
            },
            {
                id: 'search',
                label: 'Rechercher',
                icon: <Search className="h-4 w-4" />,
                count: overlaySearchActive ? overlayPagination?.total : undefined,
            },
            {
                id: 'logs',
                label: 'Logs',
                icon: <ScrollText className="h-4 w-4" />,
            },
            {
                id: 'tools',
                label: 'Debug',
                icon: <Wrench className="h-4 w-4" />,
            },
        ];
    }, [overview, streamersPagination, guildsPagination, overlaySearchActive, overlayPagination]);

    return (
        <PageShell
            title="Développeur - LiveChat"
            description="Dashboard de debug et gestion pour les développeurs LiveChat."
            path="/admin"
        >
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
                {authLoading || !accessChecked ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Vérification des accès...</span>
                    </div>
                ) : !session || !accessToken ? (
                    <LoginView onLogin={handleLogin} />
                ) : !isDevAdmin ? (
                    <div className="flex flex-col items-center gap-4 py-20 text-center">
                        <ShieldAlert className="h-10 w-10 text-destructive" />
                        <h1 className="text-xl font-bold">Accès refusé</h1>
                        <p className="max-w-md text-sm text-muted-foreground">
                            Cette page est réservée aux développeurs LiveChat. Votre compte Discord n'est pas autorisé.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-lg font-bold leading-tight">Monitoring développeur</h1>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => void refreshAll()} disabled={loading}>
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                Tout actualiser
                            </Button>
                        </div>

                        {sectionError ? (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                {sectionError}
                            </div>
                        ) : null}

                        <ConfigTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

                        {activeTab === 'overview' ? (
                            <TabPanel
                                title="Vue d'ensemble"
                                description="État du bot, de la base de données et du cache."
                            >
                                {overview ? (
                                    <>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                                            {overview.discord.ready ? (
                                                <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-500">
                                                    <Wifi className="h-3.5 w-3.5" />
                                                    Bot connecté
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-destructive">
                                                    <WifiOff className="h-3.5 w-3.5" />
                                                    Bot déconnecté
                                                </span>
                                            )}
                                            <span className="text-xs">
                                                Ping {overview.discord.wsPing} ms · Uptime{' '}
                                                {formatUptime(overview.uptimeSeconds)} · {overview.nodeEnv}
                                            </span>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                            <StatCard label="Overlays connectés" value={overview.streamers.connected} />
                                            <StatCard label="Serveurs bot" value={overview.discord.guildCount} />
                                            <StatCard label="Overlays en DB" value={overview.database.overlayCount} />
                                            <StatCard
                                                label="Guild settings"
                                                value={overview.database.guildSettingsCount}
                                            />
                                            <StatCard
                                                label="Cache"
                                                value={overview.cache.size}
                                                sub={`${overview.cache.hits} hits / ${overview.cache.misses} miss`}
                                            />
                                            <StatCard label="Guilds Plus" value={overview.premium.plusGuildCount} />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Actualisation automatique toutes les 10 secondes.
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Chargement...</p>
                                )}
                            </TabPanel>
                        ) : null}

                        {activeTab === 'live' ? (
                            <TabPanel
                                title="En direct"
                                description="Liste des overlays connectés en temps réel."
                                action={
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => void loadStreamers(streamersPage)}
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Actualiser
                                    </Button>
                                }
                            >
                                <DataTable
                                    headers={["Nom d'affichage", 'Version', 'Identifiant du serveur', 'Socket ID']}
                                    rows={streamers.map((s) => [
                                        <span className="font-medium">{s.username}</span>,
                                        <Badge variant={s.overlayVersion === 'v2' ? 'default' : 'secondary'}>
                                            {s.overlayVersion}
                                        </Badge>,
                                        <span className="font-mono text-xs">{s.guildId}</span>,
                                        <span className="font-mono text-xs text-muted-foreground">{s.socketId}</span>,
                                    ])}
                                />
                                <ListPagination
                                    pagination={streamersPagination}
                                    onPageChange={setStreamersPage}
                                    disabled={loading}
                                />
                            </TabPanel>
                        ) : null}

                        {activeTab === 'guilds' ? (
                            <TabPanel
                                title="Serveurs"
                                description="Liste des serveurs Discord où est présent le bot."
                                action={
                                    <Button variant="outline" size="sm" onClick={() => void loadGuilds(guildsPage)}>
                                        <RefreshCw className="h-4 w-4" />
                                        Actualiser
                                    </Button>
                                }
                            >
                                <DataTable
                                    headers={['Nom', 'ID', 'Membres', 'Overlays DB', 'Connectés', 'Plus', '']}
                                    rows={guilds.map((g) => [
                                        <span className="font-medium">{g.name}</span>,
                                        <span className="font-mono text-xs">{g.id}</span>,
                                        <span>{g.memberCount}</span>,
                                        <span>{g.overlayCount}</span>,
                                        <span>{g.connectedCount}</span>,
                                        g.hasPlus ? (
                                            <Badge variant="secondary">Plus</Badge>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        ),
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0"
                                            onClick={() => filterGuildOverlays(g.id)}
                                        >
                                            Overlays
                                        </Button>,
                                    ])}
                                />
                                <ListPagination
                                    pagination={guildsPagination}
                                    onPageChange={setGuildsPage}
                                    disabled={loading}
                                />
                            </TabPanel>
                        ) : null}

                        {activeTab === 'search' ? (
                            <TabPanel
                                title="Rechercher"
                                description="Chercher un overlay par nom d'affichage, serveur, utilisateur ou token."
                            >
                                <div id="overlay-search" className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="search-username">Nom d'affichage</Label>
                                        <Input
                                            id="search-username"
                                            value={overlayUsername}
                                            onChange={(e) => setOverlayUsername(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="search-guild">Identifiant du serveur</Label>
                                        <Input
                                            id="search-guild"
                                            value={overlayGuildId}
                                            onChange={(e) => setOverlayGuildId(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="search-user">Identifiant de l'utilisateur</Label>
                                        <Input
                                            id="search-user"
                                            value={overlayUserId}
                                            onChange={(e) => setOverlayUserId(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="search-token">Token de l'overlay</Label>
                                        <Input
                                            id="search-token"
                                            value={overlayToken}
                                            onChange={(e) => setOverlayToken(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    className="w-full sm:w-auto"
                                    onClick={() => void handleSearchOverlays()}
                                    disabled={actionLoading === 'search'}
                                >
                                    {actionLoading === 'search' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    Rechercher
                                </Button>

                                {overlaySearchActive ? (
                                    overlayResults.length > 0 ? (
                                        <>
                                            <DataTable
                                                headers={['Username', 'Guild', 'User ID', 'Token', 'Créé', 'Actions']}
                                                rows={overlayResults.map((o) => {
                                                    const revealed = revealedTokens.has(o.token);
                                                    return [
                                                        <span className="font-medium">{o.username}</span>,
                                                        <span className="font-mono text-xs">{o.guild_id}</span>,
                                                        <span className="font-mono text-xs">{o.user_id}</span>,
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-mono text-xs">
                                                                {revealed ? o.token : '••••••••••••'}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => toggleTokenReveal(o.token)}
                                                                aria-label={
                                                                    revealed ? 'Masquer le token' : 'Révéler le token'
                                                                }
                                                            >
                                                                {revealed ? (
                                                                    <EyeOff className="h-3 w-3" />
                                                                ) : (
                                                                    <Eye className="h-3 w-3" />
                                                                )}
                                                            </Button>
                                                        </div>,
                                                        <span className="text-xs text-muted-foreground">
                                                            {o.created_at
                                                                ? new Date(o.created_at).toLocaleDateString('fr-FR')
                                                                : '—'}
                                                        </span>,
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => handleOpenOverlay(o.token, o.username)}
                                                                aria-label="Ouvrir l'overlay"
                                                            >
                                                                <ExternalLink className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                                disabled={actionLoading === `delete-${o.token}`}
                                                                onClick={() =>
                                                                    void handleDeleteOverlay(o.token, o.username)
                                                                }
                                                                aria-label="Supprimer l'overlay"
                                                            >
                                                                {actionLoading === `delete-${o.token}` ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </div>,
                                                    ];
                                                })}
                                            />
                                            <ListPagination
                                                pagination={overlayPagination}
                                                onPageChange={handleOverlaysPageChange}
                                                disabled={actionLoading === 'search'}
                                            />
                                        </>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Aucun overlay trouvé.</p>
                                    )
                                ) : null}
                            </TabPanel>
                        ) : null}

                        {activeTab === 'logs' ? (
                            <TabPanel
                                title="Logs"
                                description="Logs serveur en temps réel (buffer des 500 dernières entrées)."
                            >
                                <AdminLogViewer
                                    accessToken={accessToken}
                                    active={activeTab === 'logs'}
                                    onError={(message) => setSectionError(message)}
                                />
                            </TabPanel>
                        ) : null}

                        {activeTab === 'tools' ? (
                            <div className="space-y-8">
                                <TabPanel
                                    title="Tester la résolution d'URL"
                                    description="Tester la résolution d'URL ainsi que l'utilisation du proxy."
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <Input
                                            value={mediaUrl}
                                            onChange={(e) => setMediaUrl(e.target.value)}
                                            placeholder="https://tenor.com/..."
                                            className="flex-1"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') void handleResolveMedia();
                                            }}
                                        />
                                        <Button
                                            onClick={() => void handleResolveMedia()}
                                            disabled={actionLoading === 'media'}
                                        >
                                            {actionLoading === 'media' ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : null}
                                            Résoudre
                                        </Button>
                                    </div>
                                    {mediaResult ? (
                                        <div className="rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs">
                                            {mediaResult.error ? (
                                                <p className="text-destructive">{mediaResult.error}</p>
                                            ) : (
                                                <div className="space-y-1">
                                                    <p>
                                                        <span className="text-muted-foreground">URL :</span>{' '}
                                                        {mediaResult.url ?? '—'}
                                                    </p>
                                                    <p>
                                                        <span className="text-muted-foreground">Bypass proxy :</span>{' '}
                                                        {mediaResult.bypassProxy ? 'oui' : 'non'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </TabPanel>

                                <TabPanel
                                    title="Cache serveur"
                                    description="Statistiques du cache en mémoire et vidage manuel."
                                    action={
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => void handleClearCache()}
                                            disabled={actionLoading === 'cache'}
                                        >
                                            {actionLoading === 'cache' ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : null}
                                            Vider le cache
                                        </Button>
                                    }
                                >
                                    {cacheStats ? (
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                            <StatCard label="Entrées" value={cacheStats.size} />
                                            <StatCard label="Hits" value={cacheStats.hits} />
                                            <StatCard label="Misses" value={cacheStats.misses} />
                                            <StatCard label="Évictions" value={cacheStats.evictions} />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Chargement...</p>
                                    )}
                                </TabPanel>
                            </div>
                        ) : null}
                    </div>
                )}
            </main>
        </PageShell>
    );
}
