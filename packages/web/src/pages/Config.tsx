import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DiscordGuild, DiscordRole, OverlayConfigAdminRow, OverlayConfigRow } from '@livechat/types';
import { Play, RefreshCw, Settings2, ShieldAlert, Tv, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    adminDeleteOverlayConfig,
    createOverlayConfig,
    deleteOverlayConfig,
    fetchAllGuildOverlayConfigs,
    fetchGuildRoles,
    fetchGuildSettings,
    fetchUserOverlayConfigs,
    regenerateOverlayToken,
    saveGuildSettings,
    saveOverlayConfig,
} from '../api/configApi';
import PageShell from '../components/PageShell';
import VideoModal from '../components/VideoModal';
import { useAuth } from '../hooks/useAuth';
import { useGuildList } from '../hooks/useGuildList';
import { buildOverlayLink } from '../lib/constants';
import { isGuildAdmin } from '../lib/discord';
import { getErrorMessage } from '../lib/errors';
import { openDiscordLoginPopup } from '../lib/authApi';

import ConfigBreadcrumb, { type BreadcrumbSegment } from '../components/config/ConfigBreadcrumb';
import ConfigTabs, { type TabItem } from '../components/config/ConfigTabs';
import CreateOverlayDialog from '../components/config/CreateOverlayDialog';
import GuildGrid from '../components/config/GuildGrid';
import LoginView from '../components/config/LoginView';
import MembersPanel from '../components/config/MembersPanel';
import OnboardingView from '../components/config/OnboardingView';
import OverlayEditor from '../components/config/OverlayEditor';
import OverlaysList from '../components/config/OverlaysList';
import PublicServerRoleReminder from '../components/config/PublicServerRoleReminder';
import RestrictedView from '../components/config/RestrictedView';
import ServerSettings from '../components/config/ServerSettings';

const YOUTUBE_VIDEO_ID = 'iIK6me_W1BQ';

type ConfigTab = 'overlays' | 'members' | 'settings';

export default function Config() {
    const { guildId } = useParams<{ guildId?: string }>();
    const navigate = useNavigate();
    const { session, user, authLoading, refreshSession } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const setErrorMessage = useCallback((message: string | null) => setError(message), []);

    const handleLogin = useCallback(async () => {
        try {
            openDiscordLoginPopup();
        } catch (err: unknown) {
            console.error('Login error', err);
            setError(getErrorMessage(err, 'Une erreur est survenue lors de la connexion avec Discord.'));
        }
    }, []);

    const { guilds, fetchingGuilds, isSessionExpired, loadGuilds } = useGuildList({
        session,
        onError: setErrorMessage,
    });

    const [selectedGuild, setSelectedGuild] = useState<DiscordGuild | null>(null);

    const [configs, setConfigs] = useState<OverlayConfigRow[]>([]);
    const [activeConfig, setActiveConfig] = useState<OverlayConfigRow | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newOverlayName, setNewOverlayName] = useState('');

    const [allGuildConfigs, setAllGuildConfigs] = useState<OverlayConfigAdminRow[]>([]);
    const [loadingAllConfigs, setLoadingAllConfigs] = useState(false);

    const [username, setUsername] = useState('');
    const [dbUsername, setDbUsername] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [isLinkBlurred, setIsLinkBlurred] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [justRegenerated, setJustRegenerated] = useState(false);

    const [videoOpen, setVideoOpen] = useState(false);
    const handleCloseVideo = useCallback(() => setVideoOpen(false), []);

    const [hasExistingLink, setHasExistingLink] = useState<boolean | null>(null);
    const [checkingLink, setCheckingLink] = useState(false);

    const [isRestricted, setIsRestricted] = useState(false);
    const [restrictedGuildIds, setRestrictedGuildIds] = useState<Set<string>>(new Set());
    const [guildRoles, setGuildRoles] = useState<DiscordRole[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [requiredRoleId, setRequiredRoleId] = useState<string | null>(null);
    const [dbRequiredRoleId, setDbRequiredRoleId] = useState<string | null>(null);
    const [isRoleRestrictionEnabled, setIsRoleRestrictionEnabled] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsSuccess, setSettingsSuccess] = useState(false);
    const [maxOverlays, setMaxOverlays] = useState<number>(5);
    const [dbMaxOverlaysLimit, setDbMaxOverlaysLimit] = useState<number>(5);
    const [maxOverlaysInput, setMaxOverlaysInput] = useState<string>('5');
    const [hasPlusSubscription, setHasPlusSubscription] = useState(false);

    const [activeTab, setActiveTab] = useState<ConfigTab>('overlays');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    useEffect(() => {
        if (guildId && guilds.length > 0) {
            const matched = guilds.find((g) => g.id === guildId);
            if (matched) {
                if (!matched.hasBot) {
                    navigate('/config');
                } else {
                    setSelectedGuild(matched);
                }
            } else {
                setSelectedGuild(null);
            }
        } else if (!guildId) {
            setSelectedGuild(null);
        }
    }, [guildId, guilds, navigate]);

    useEffect(() => {
        let active = true;
        const checkExistingConfig = async () => {
            if (!selectedGuild) {
                setHasExistingLink(null);
                setConfigs([]);
                setActiveConfig(null);
                setIsEditing(false);
                setUsername('');
                setDbUsername('');
                setGeneratedLink('');
                setIsRestricted(false);
                setMaxOverlays(5);
                setHasPlusSubscription(false);
                setError(null);
                return;
            }
            if (!session) {
                return;
            }
            setCheckingLink(true);
            setError(null);
            setIsRestricted(false);
            try {
                const { ok, status, data } = await fetchUserOverlayConfigs(
                    { accessToken: session.access_token },
                    selectedGuild.id,
                );
                if (!active) return;
                if (status === 403) {
                    setError(data.error || "Vous n'avez pas l'autorisation d'utiliser LiveChat sur ce serveur.");
                    setIsRestricted(true);
                    setRestrictedGuildIds((prev) => new Set([...prev, selectedGuild.id]));
                    setConfigs([]);
                    setHasExistingLink(null);
                    return;
                }
                if (ok) {
                    if (data.exists && data.configs && data.configs.length > 0) {
                        setConfigs(data.configs);
                        setHasExistingLink(true);
                    } else {
                        setConfigs([]);
                        setHasExistingLink(false);
                    }
                    setMaxOverlays(data.maxOverlays ?? 5);
                    setHasPlusSubscription(data.hasPlusSubscription ?? false);
                } else {
                    setConfigs([]);
                    setHasExistingLink(false);
                }
            } catch (err: unknown) {
                if (!active) return;
                console.error(err);
                setError('Impossible de vérifier la configuration de ce serveur.');
                setConfigs([]);
                setHasExistingLink(false);
            } finally {
                if (active) {
                    setCheckingLink(false);
                }
            }
        };

        checkExistingConfig();
        return () => {
            active = false;
        };
    }, [selectedGuild, session]);

    useEffect(() => {
        let active = true;
        const fetchAllConfigs = async () => {
            if (!selectedGuild || isEditing || !session) {
                setAllGuildConfigs([]);
                return;
            }
            const isUserAdmin = isGuildAdmin(selectedGuild);
            if (!isUserAdmin) {
                setAllGuildConfigs([]);
                return;
            }

            setLoadingAllConfigs(true);
            try {
                const data = await fetchAllGuildOverlayConfigs({ accessToken: session.access_token }, selectedGuild.id);
                if (!active) return;
                if (data.configs) {
                    setAllGuildConfigs(data.configs);
                }
            } catch (err) {
                if (!active) return;
                console.error('Failed to fetch all configurations', err);
            } finally {
                if (active) {
                    setLoadingAllConfigs(false);
                }
            }
        };

        fetchAllConfigs();
        return () => {
            active = false;
        };
    }, [selectedGuild, isEditing, session]);

    useEffect(() => {
        let active = true;
        const fetchSettingsAndRoles = async () => {
            if (!selectedGuild || !session) {
                setGuildRoles([]);
                setRequiredRoleId(null);
                setDbRequiredRoleId(null);
                setIsRoleRestrictionEnabled(false);
                setDbMaxOverlaysLimit(5);
                setMaxOverlaysInput('5');
                return;
            }

            const isUserAdmin = isGuildAdmin(selectedGuild);
            if (!isUserAdmin) {
                setGuildRoles([]);
                setRequiredRoleId(null);
                setDbRequiredRoleId(null);
                setIsRoleRestrictionEnabled(false);
                setDbMaxOverlaysLimit(5);
                setMaxOverlaysInput('5');
                return;
            }

            setLoadingRoles(true);
            try {
                const settingsData = await fetchGuildSettings({ accessToken: session.access_token }, selectedGuild.id);
                if (!active) return;
                if (settingsData.settings) {
                    const roleId = settingsData.settings.required_role_id;
                    setRequiredRoleId(roleId);
                    setDbRequiredRoleId(roleId);
                    setIsRoleRestrictionEnabled(roleId !== null && roleId !== '');

                    const limit = settingsData.settings.max_overlays_per_user ?? 5;
                    setDbMaxOverlaysLimit(limit);
                    setMaxOverlaysInput(String(limit));
                }

                const rolesData = await fetchGuildRoles({ accessToken: session.access_token }, selectedGuild.id);
                if (!active) return;
                if (rolesData.roles) {
                    setGuildRoles(rolesData.roles);
                }
            } catch (err) {
                if (!active) return;
                console.error('Failed to fetch settings and roles', err);
            } finally {
                if (active) {
                    setLoadingRoles(false);
                }
            }
        };

        fetchSettingsAndRoles();
        return () => {
            active = false;
        };
    }, [selectedGuild, session]);

    useEffect(() => {
        setActiveTab('overlays');
    }, [selectedGuild?.id]);

    useEffect(() => {
        setCreateDialogOpen(false);
    }, [configs.length]);

    const openCreateDialog = () => {
        setError(null);
        setNewOverlayName((prev) => prev || username);
        setCreateDialogOpen(true);
    };

    const handleConfigureConfig = (config: OverlayConfigRow) => {
        setActiveConfig(config);
        setUsername(config.username);
        setDbUsername(config.username);
        setGeneratedLink(buildOverlayLink(config.token));
        setIsEditing(true);
        setError(null);
    };

    const handleSaveConfig = async () => {
        if (!selectedGuild || !activeConfig || !session) return;

        setError(null);
        setIsGenerating(true);

        try {
            if (username !== dbUsername) {
                if (!username || username.length < 4 || username.length > 25) {
                    throw new Error("Le nom d'utilisateur doit faire entre 4 et 25 caractères.");
                }

                const data = await saveOverlayConfig(
                    { accessToken: session.access_token },
                    {
                        username,
                        guildId: selectedGuild.id,
                        token: activeConfig.token,
                    },
                );
                if (data.success) {
                    setDbUsername(username);
                    const updatedConfig = { ...activeConfig, username };
                    setActiveConfig(updatedConfig);
                    setConfigs((prev) => prev.map((c) => (c.token === activeConfig.token ? updatedConfig : c)));
                } else {
                    throw new Error("Impossible d'enregistrer le nouveau pseudo.");
                }
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Une erreur est survenue lors de la sauvegarde.'));
        } finally {
            setIsGenerating(false);
        }
    };

    const hasUnsavedChanges = username !== dbUsername;

    const handleSaveSettings = async () => {
        if (!selectedGuild || !session) return;
        setSavingSettings(true);
        setSettingsSuccess(false);
        setError(null);

        const targetRoleId = isRoleRestrictionEnabled ? requiredRoleId : null;
        let parsedLimit = parseInt(maxOverlaysInput);
        if (isNaN(parsedLimit) || parsedLimit < 1) parsedLimit = 1;
        if (parsedLimit > 20) parsedLimit = 20;

        try {
            await saveGuildSettings(
                { accessToken: session.access_token },
                {
                    guildId: selectedGuild.id,
                    requiredRoleId: targetRoleId,
                    maxOverlaysPerUser: parsedLimit,
                },
            );

            setDbRequiredRoleId(targetRoleId);
            setDbMaxOverlaysLimit(parsedLimit);
            setMaxOverlaysInput(String(parsedLimit));
            setMaxOverlays(parsedLimit);
            setSettingsSuccess(true);
            setTimeout(() => setSettingsSuccess(false), 3000);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Une erreur est survenue lors de la sauvegarde.'));
        } finally {
            setSavingSettings(false);
        }
    };

    const hasUnsavedSettings =
        (isRoleRestrictionEnabled ? requiredRoleId : null) !== dbRequiredRoleId ||
        (parseInt(maxOverlaysInput) || 5) !== dbMaxOverlaysLimit;

    const backToServers = () => {
        if (hasUnsavedSettings) {
            if (
                !window.confirm(
                    'Vous avez des modifications de paramètres serveur non sauvegardées. Voulez-vous vraiment les annuler ?',
                )
            ) {
                return;
            }
        }
        navigate('/config');
    };

    const backToOverlays = () => {
        if (hasUnsavedChanges) {
            if (
                !window.confirm(
                    'Vous avez des modifications non sauvegardées sur votre overlay. Voulez-vous vraiment les annuler ?',
                )
            ) {
                return;
            }
        }
        setIsEditing(false);
        setActiveConfig(null);
        setUsername('');
        setDbUsername('');
        setGeneratedLink('');
        setError(null);
    };

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isEditing && hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isEditing, hasUnsavedChanges]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type === 'livechat-auth-success') {
                void refreshSession();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [refreshSession]);

    useEffect(() => {
        if (session && user) {
            const discordUsername = user.username ?? '';
            const formattedName = discordUsername.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
            setUsername((prev) => prev || formattedName);
        }
    }, [session, user]);

    const validateAndSetUsername = (val: string) => {
        let clean = val.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        if (clean.startsWith('_')) clean = clean.substring(1);
        setUsername(clean);
    };

    const handleCreateConfig = async (customName?: string) => {
        if (!selectedGuild || !session) return;
        const nameToCreate = typeof customName === 'string' ? customName : username;
        if (!nameToCreate || nameToCreate.length < 4 || nameToCreate.length > 25) {
            setError("Le nom d'utilisateur doit faire entre 4 et 25 caractères.");
            return;
        }
        setError(null);
        setIsGenerating(true);

        try {
            const userId = session.user.id;
            const data = await createOverlayConfig(
                { accessToken: session.access_token },
                {
                    username: nameToCreate,
                    guildId: selectedGuild.id,
                },
            );

            if (data.token) {
                const newConfig: OverlayConfigRow = {
                    guild_id: selectedGuild.id,
                    username: nameToCreate,
                    token: data.token,
                    user_id: userId,
                };

                const updatedConfigs = [...configs, newConfig];
                setConfigs(updatedConfigs);
                setHasExistingLink(true);

                setActiveConfig(null);
                setUsername('');
                setDbUsername('');
                setGeneratedLink('');
                setIsEditing(false);

                setNewOverlayName('');
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Une erreur est survenue lors de la création.'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteConfig = async (configToken: string) => {
        if (
            !confirm(
                'ATTENTION : Cette action supprimera définitivement cet overlay et sa configuration. Les scènes OBS utilisant cet overlay cesseront de fonctionner immédiatement. Voulez-vous continuer ?',
            )
        ) {
            return;
        }

        setError(null);
        setIsGenerating(true);

        try {
            if (!session) {
                throw new Error("Vous n'êtes pas connecté.");
            }
            await deleteOverlayConfig({ accessToken: session.access_token }, configToken);

            const updatedConfigs = configs.filter((c) => c.token !== configToken);
            setConfigs(updatedConfigs);

            if (activeConfig && activeConfig.token === configToken) {
                setActiveConfig(null);
                setUsername('');
                setDbUsername('');
                setGeneratedLink('');
                setIsEditing(false);
            }

            if (updatedConfigs.length === 0) {
                setHasExistingLink(false);
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Une erreur est survenue lors de la suppression.'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAdminDeleteConfig = async (targetUsername: string) => {
        if (
            !confirm(
                `En tant qu'administrateur, vous allez supprimer définitivement l'overlay de ${targetUsername}. Cette action est irréversible. Voulez-vous continuer ?`,
            )
        ) {
            return;
        }

        setError(null);
        setIsGenerating(true);

        try {
            if (!session) {
                throw new Error("Vous n'êtes pas connecté.");
            }
            await adminDeleteOverlayConfig(
                { accessToken: session.access_token },
                {
                    guildId: selectedGuild!.id,
                    username: targetUsername,
                },
            );

            const updatedAll = allGuildConfigs.filter((c) => c.username !== targetUsername);
            setAllGuildConfigs(updatedAll);

            const updatedConfigs = configs.filter((c) => c.username.toLowerCase() !== targetUsername.toLowerCase());
            setConfigs(updatedConfigs);
            if (updatedConfigs.length === 0) {
                setHasExistingLink(false);
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Une erreur est survenue lors de la suppression.'));
        } finally {
            setIsGenerating(false);
        }
    };

    const regenerateLink = async () => {
        if (!selectedGuild || !activeConfig || !session) return;
        if (
            !confirm(
                "ATTENTION : Si vous régénérez le lien, l'ancien jeton sera invalidé. L'overlay actuel configuré sur OBS cessera de fonctionner immédiatement. Voulez-vous continuer ?",
            )
        ) {
            return;
        }
        setError(null);
        setIsGenerating(true);

        try {
            const { token: newToken } = await regenerateOverlayToken(
                { accessToken: session.access_token },
                activeConfig.token,
            );

            const updatedConfig = { ...activeConfig, token: newToken };
            setActiveConfig(updatedConfig);
            setConfigs((prev) => prev.map((c) => (c.token === activeConfig.token ? updatedConfig : c)));
            setGeneratedLink(buildOverlayLink(newToken));
            setIsLinkBlurred(true);
            setJustRegenerated(true);
            setTimeout(() => {
                setJustRegenerated(false);
            }, 4000);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Une erreur est survenue lors de la régénération.'));
        } finally {
            setIsGenerating(false);
        }
    };

    if (authLoading) {
        return (
            <PageShell
                title="Configurer LiveChat - Dashboard Discord et overlay"
                description="Connectez-vous avec Discord, configurez vos liens d'overlay et intégrez-les directement dans OBS Studio."
                path="/config"
            >
                <main className="flex flex-1 items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Chargement du dashboard...</p>
                    </div>
                </main>
            </PageShell>
        );
    }

    return (
        <PageShell
            title="Configurer LiveChat - Dashboard Discord et overlay"
            description="Connectez-vous avec Discord, configurez vos liens d'overlay et intégrez-les directement dans OBS Studio."
            path="/config"
        >
            <VideoModal
                open={videoOpen}
                onClose={handleCloseVideo}
                videoId={YOUTUBE_VIDEO_ID}
                title="Tutoriel LiveChat"
            />

            <CreateOverlayDialog
                open={createDialogOpen}
                onOpenChange={(open) => {
                    setCreateDialogOpen(open);
                    if (!open) setError(null);
                }}
                value={newOverlayName}
                onChange={setNewOverlayName}
                onCreate={() => handleCreateConfig(newOverlayName)}
                isGenerating={isGenerating}
                error={error}
                title={hasExistingLink ? 'Créer un overlay' : 'Créer votre premier overlay'}
            />

            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
                {!session ? (
                    <LoginView onLogin={handleLogin} />
                ) : (
                    (() => {
                        const isAdmin = selectedGuild ? isGuildAdmin(selectedGuild) : false;
                        const roleLabel = selectedGuild?.owner ? 'Propriétaire' : isAdmin ? 'Administrateur' : 'Membre';

                        const guildIcon = selectedGuild ? (
                            selectedGuild.icon ? (
                                <img
                                    src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`}
                                    alt=""
                                    className="h-4 w-4 shrink-0 rounded-sm object-cover"
                                />
                            ) : (
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-secondary text-[8px] font-bold uppercase text-muted-foreground">
                                    {selectedGuild.name.substring(0, 1)}
                                </span>
                            )
                        ) : undefined;

                        const segments: BreadcrumbSegment[] = [{ label: 'Serveurs', onClick: backToServers }];
                        if (selectedGuild) {
                            segments.push({
                                label: selectedGuild.name,
                                icon: guildIcon,
                                onClick: isEditing ? backToOverlays : undefined,
                            });
                        }
                        if (isEditing && activeConfig) {
                            segments.push({ label: activeConfig.username });
                        }

                        const tabs: TabItem<ConfigTab>[] = [
                            {
                                id: 'overlays',
                                label: 'Overlays',
                                icon: <Tv className="h-4 w-4" />,
                            },
                            { id: 'members', label: 'Membres', icon: <Users className="h-4 w-4" /> },
                            { id: 'settings', label: 'Paramètres', icon: <Settings2 className="h-4 w-4" /> },
                        ];

                        const breadcrumbActions = (
                            <>
                                {!selectedGuild && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => loadGuilds(true)}
                                        disabled={fetchingGuilds}
                                        className="flex-1 sm:flex-initial"
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 ${fetchingGuilds ? 'animate-spin' : ''}`} />
                                        Actualiser
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setVideoOpen(true)}
                                    className="flex-1 sm:flex-initial"
                                >
                                    <Play className="h-3.5 w-3.5" />
                                    Tutoriel
                                </Button>
                            </>
                        );

                        return (
                            <>
                                <ConfigBreadcrumb segments={segments} actions={breadcrumbActions} />

                                {error && !isRestricted && !createDialogOpen && (
                                    <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                        <div>{error}</div>
                                    </div>
                                )}

                                {!guildId ? (
                                    <GuildGrid
                                        guilds={guilds}
                                        fetchingGuilds={fetchingGuilds}
                                        isSessionExpired={isSessionExpired}
                                        loadGuilds={loadGuilds}
                                        handleLogin={handleLogin}
                                        onSelectGuild={(id) => navigate(`/config/${id}`)}
                                        restrictedGuildIds={restrictedGuildIds}
                                    />
                                ) : !selectedGuild ? (
                                    <div className="flex flex-col items-center justify-center gap-4 py-20">
                                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Validation du serveur...</span>
                                    </div>
                                ) : checkingLink ? (
                                    <div className="flex flex-col items-center justify-center gap-4 py-20">
                                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            Vérification de la configuration...
                                        </span>
                                    </div>
                                ) : isRestricted ? (
                                    <RestrictedView error={error} />
                                ) : isEditing ? (
                                    <OverlayEditor
                                        overlayName={activeConfig?.username ?? ''}
                                        username={username}
                                        validateAndSetUsername={validateAndSetUsername}
                                        generatedLink={generatedLink}
                                        isLinkBlurred={isLinkBlurred}
                                        setIsLinkBlurred={setIsLinkBlurred}
                                        justRegenerated={justRegenerated}
                                        isGenerating={isGenerating}
                                        regenerateLink={regenerateLink}
                                        hasUnsavedChanges={hasUnsavedChanges}
                                        onSave={handleSaveConfig}
                                        onDelete={() => activeConfig && handleDeleteConfig(activeConfig.token)}
                                    />
                                ) : !hasExistingLink ? (
                                    <OnboardingView selectedGuild={selectedGuild} onOpenCreate={openCreateDialog} />
                                ) : (
                                    <>
                                        {/* Server header */}
                                        <div className="mb-6 flex items-center gap-3">
                                            {selectedGuild.icon ? (
                                                <img
                                                    src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`}
                                                    alt=""
                                                    className="h-11 w-11 shrink-0 rounded-lg border border-border object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold uppercase text-muted-foreground">
                                                    {selectedGuild.name.substring(0, 2)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <h1 className="truncate text-lg font-bold leading-tight">
                                                    {selectedGuild.name}
                                                </h1>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">{roleLabel}</span>
                                                    {hasPlusSubscription && (
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            LiveChat Plus
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {isAdmin && (
                                            <ConfigTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
                                        )}

                                        {activeTab === 'overlays' || !isAdmin ? (
                                            <OverlaysList
                                                configs={configs}
                                                maxOverlays={maxOverlays}
                                                onConfigure={handleConfigureConfig}
                                                onDelete={handleDeleteConfig}
                                                onOpenCreate={openCreateDialog}
                                            />
                                        ) : activeTab === 'members' ? (
                                            <MembersPanel
                                                allGuildConfigs={allGuildConfigs}
                                                loadingAllConfigs={loadingAllConfigs}
                                                handleAdminDeleteConfig={handleAdminDeleteConfig}
                                            />
                                        ) : (
                                            <ServerSettings
                                                isRoleRestrictionEnabled={isRoleRestrictionEnabled}
                                                setIsRoleRestrictionEnabled={setIsRoleRestrictionEnabled}
                                                requiredRoleId={requiredRoleId}
                                                setRequiredRoleId={setRequiredRoleId}
                                                guildRoles={guildRoles}
                                                loadingRoles={loadingRoles}
                                                maxOverlaysInput={maxOverlaysInput}
                                                setMaxOverlaysInput={setMaxOverlaysInput}
                                                savingSettings={savingSettings}
                                                settingsSuccess={settingsSuccess}
                                                handleSaveSettings={handleSaveSettings}
                                                hasUnsavedSettings={hasUnsavedSettings}
                                            />
                                        )}
                                        <PublicServerRoleReminder />
                                    </>
                                )}
                            </>
                        );
                    })()
                )}
            </main>
        </PageShell>
    );
}
