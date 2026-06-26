import type { DiscordGuild, DiscordRole, OverlayConfigRow } from '@livechat/types';
import { ArrowLeft, Play, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
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
import { useAuth } from '../hooks/useAuth';
import { useGuildList } from '../hooks/useGuildList';
import { buildOverlayLink } from '../lib/constants';
import { isGuildAdmin } from '../lib/discord';
import { getErrorMessage } from '../lib/errors';
import { supabase } from '../lib/supabase';
import VideoModal from '../components/VideoModal';

import GuildGrid from '../components/config/GuildGrid';
import LoginView from '../components/config/LoginView';
import OnboardingView from '../components/config/OnboardingView';
import OverlayEditor from '../components/config/OverlayEditor';
import OverlaysDashboard from '../components/config/OverlaysDashboard';
import RestrictedView from '../components/config/RestrictedView';

const YOUTUBE_VIDEO_ID = 'iIK6me_W1BQ';

export default function Config() {
    const { guildId } = useParams<{ guildId?: string }>();
    const navigate = useNavigate();
    const { session, user, authLoading, refreshSession } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const setErrorMessage = useCallback((message: string | null) => setError(message), []);

    const handleLogin = useCallback(async () => {
        try {
            const { data, error: authError } = await supabase.auth.signInWithOAuth({
                provider: 'discord',
                options: {
                    redirectTo: window.location.origin + '/config',
                    scopes: 'identify guilds',
                    skipBrowserRedirect: true,
                },
            });

            if (authError) throw authError;
            if (data?.url) {
                const width = 600;
                const height = 800;
                const left = window.screen.width / 2 - width / 2;
                const top = window.screen.height / 2 - height / 2;
                window.open(
                    data.url,
                    'discord-login',
                    `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=no`,
                );
            }
        } catch (err: unknown) {
            console.error('Login error', err);
            setError(getErrorMessage(err, 'Une erreur est survenue lors de la connexion avec Discord.'));
        }
    }, []);

    const { guilds, fetchingGuilds, isSessionExpired, loadGuilds } = useGuildList({
        session,
        onError: setErrorMessage,
        onReauthenticate: handleLogin,
    });

    const [selectedGuild, setSelectedGuild] = useState<DiscordGuild | null>(null);

    const [configs, setConfigs] = useState<OverlayConfigRow[]>([]);
    const [activeConfig, setActiveConfig] = useState<OverlayConfigRow | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newOverlayName, setNewOverlayName] = useState('');

    const [allGuildConfigs, setAllGuildConfigs] = useState<OverlayConfigRow[]>([]);
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
                const data = await fetchAllGuildOverlayConfigs(
                    { accessToken: session.access_token },
                    selectedGuild.id,
                );
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
                const settingsData = await fetchGuildSettings(
                    { accessToken: session.access_token },
                    selectedGuild.id,
                );
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
            if (event.data?.type === 'supabase-auth-success') {
                void refreshSession();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [refreshSession]);

    useEffect(() => {
        if (session && window.name === 'discord-login' && window.opener) {
            try {
                window.opener.postMessage({ type: 'supabase-auth-success' }, window.location.origin);
                window.close();
            } catch (e) {
                console.error(e);
            }
        }
    }, [session]);

    useEffect(() => {
        if (session && user) {
            const discordUsername = user?.user_metadata?.preferred_username || user?.user_metadata?.name || '';
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
            const userId = session.user?.user_metadata?.provider_id || session.user?.user_metadata?.sub;
            if (!userId) {
                throw new Error("Impossible d'identifier votre compte Discord.");
            }
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
                `ATTENTION : En tant qu'administrateur, vous allez supprimer définitivement l'overlay de "${targetUsername}". Cette action est irréversible. Voulez-vous continuer ?`,
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
                <main className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="h-10 w-10 animate-spin text-white/60" />
                        <p className="text-sm font-semibold text-muted-foreground">Chargement du dashboard...</p>
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

            <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 sm:px-10 sm:py-12">
                {!session ? (
                    <LoginView onLogin={handleLogin} />
                ) : (
                    <div className="space-y-6">
                        <div className="sticky top-[80px] md:top-[72px] z-40 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-background/80 border border-border/40 backdrop-blur-md rounded-2xl p-4 sm:px-6 shadow-lg shadow-black/20 transition-all">
                            <div className="flex items-center gap-3.5">
                                {selectedGuild ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                if (isEditing) {
                                                    if (hasUnsavedChanges) {
                                                        const confirm = window.confirm(
                                                            'Vous avez des modifications non sauvegardées sur votre overlay. Voulez-vous vraiment les annuler ?',
                                                        );
                                                        if (!confirm) return;
                                                    }
                                                    setIsEditing(false);
                                                    setActiveConfig(null);
                                                    setUsername('');
                                                    setDbUsername('');
                                                    setGeneratedLink('');
                                                    setError(null);
                                                } else {
                                                    if (hasUnsavedSettings) {
                                                        const confirm = window.confirm(
                                                            'Vous avez des modifications de paramètres serveur non sauvegardées. Voulez-vous vraiment les annuler ?',
                                                        );
                                                        if (!confirm) return;
                                                    }
                                                    navigate('/config');
                                                }
                                            }}
                                            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white/3 hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                                            title={
                                                isEditing
                                                    ? 'Retour à la liste des overlays'
                                                    : 'Retour à la liste des serveurs'
                                            }
                                        >
                                            <ArrowLeft className="h-4.5 w-4.5" />
                                        </button>
                                        {selectedGuild.icon ? (
                                            <img
                                                src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`}
                                                alt=""
                                                className="h-10 w-10 rounded-xl object-cover border border-white/10 shrink-0"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-base font-bold text-muted-foreground uppercase">
                                                {selectedGuild.name.substring(0, 2)}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold text-sm">{selectedGuild.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {isEditing && activeConfig
                                                    ? `Configuration de l'overlay : ${activeConfig.username}`
                                                    : 'Sélectionnez ou créez un overlay'}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <img
                                            src={
                                                user?.user_metadata?.avatar_url ||
                                                'https://cdn.discordapp.com/embed/avatars/0.png'
                                            }
                                            alt="Avatar"
                                            className="h-10 w-10 rounded-full border border-white/10"
                                        />
                                        <div>
                                            <p className="font-semibold text-sm">
                                                Bonjour,{' '}
                                                {user?.user_metadata?.global_name ||
                                                    user?.user_metadata?.custom_claims?.global_name ||
                                                    user?.user_metadata?.full_name ||
                                                    user?.user_metadata?.name ||
                                                    'Utilisateur Discord'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Sélectionnez un serveur</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                {selectedGuild && isEditing && activeConfig && (
                                    <>
                                        <button
                                            onClick={handleSaveConfig}
                                            disabled={!hasUnsavedChanges}
                                            className={`flex items-center justify-center rounded-lg px-4 h-9 text-xs font-bold transition-colors w-full sm:w-auto ${
                                                hasUnsavedChanges
                                                    ? 'bg-white text-black hover:bg-white/95 cursor-pointer shadow-md'
                                                    : 'bg-white/5 border border-border text-muted-foreground cursor-not-allowed opacity-50'
                                            }`}
                                        >
                                            Sauvegarder
                                        </button>
                                        <button
                                            onClick={() => handleDeleteConfig(activeConfig.token)}
                                            className="flex h-9 items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-4 py-1.5 text-xs font-bold text-red-200 transition-colors duration-200 cursor-pointer w-full sm:w-auto"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Supprimer
                                        </button>
                                    </>
                                )}
                                {!selectedGuild && (
                                    <button
                                        onClick={() => loadGuilds(true)}
                                        disabled={fetchingGuilds}
                                        title="Actualiser la liste des serveurs"
                                        className="flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-white/3 hover:bg-white/5 px-4 py-1.5 text-xs font-semibold text-muted-foreground transition-colors duration-200 disabled:opacity-50 hover:text-foreground cursor-pointer w-full sm:w-auto"
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 ${fetchingGuilds ? 'animate-spin' : ''}`} />
                                        Actualiser
                                    </button>
                                )}
                                <button
                                    onClick={() => setVideoOpen(true)}
                                    className="flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-white/3 hover:bg-white/5 px-4 py-1.5 text-xs font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground cursor-pointer w-full sm:w-auto"
                                >
                                    <Play className="h-3.5 w-3.5" />
                                    Tutoriel vidéo
                                </button>
                            </div>
                        </div>

                        {error && !isRestricted && (
                            <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3.5 text-sm text-red-200">
                                <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
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
                            />
                        ) : !selectedGuild ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <RefreshCw className="h-10 w-10 animate-spin text-white/60" />
                                <span className="text-sm font-semibold text-muted-foreground">
                                    Validation du serveur...
                                </span>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {checkingLink ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                                        <RefreshCw className="h-8 w-8 animate-spin text-white/60" />
                                        <span className="text-sm font-semibold text-muted-foreground">
                                            Vérification de la configuration...
                                        </span>
                                    </div>
                                ) : isRestricted ? (
                                    <RestrictedView error={error} />
                                ) : !hasExistingLink ? (
                                    <OnboardingView
                                        selectedGuild={selectedGuild}
                                        username={username}
                                        validateAndSetUsername={validateAndSetUsername}
                                        error={error}
                                        isGenerating={isGenerating}
                                        handleCreateConfig={handleCreateConfig}
                                    />
                                ) : !isEditing ? (
                                    <OverlaysDashboard
                                        selectedGuild={selectedGuild}
                                        configs={configs}
                                        maxOverlays={maxOverlays}
                                        newOverlayName={newOverlayName}
                                        setNewOverlayName={setNewOverlayName}
                                        isGenerating={isGenerating}
                                        handleCreateConfig={handleCreateConfig}
                                        handleConfigureConfig={handleConfigureConfig}
                                        handleDeleteConfig={handleDeleteConfig}
                                        allGuildConfigs={allGuildConfigs}
                                        loadingAllConfigs={loadingAllConfigs}
                                        handleAdminDeleteConfig={handleAdminDeleteConfig}
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
                                ) : (
                                    <OverlayEditor
                                        username={username}
                                        validateAndSetUsername={validateAndSetUsername}
                                        generatedLink={generatedLink}
                                        isLinkBlurred={isLinkBlurred}
                                        setIsLinkBlurred={setIsLinkBlurred}
                                        justRegenerated={justRegenerated}
                                        isGenerating={isGenerating}
                                        regenerateLink={regenerateLink}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </PageShell>
    );
}
