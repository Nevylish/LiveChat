import type { Session, User } from '@supabase/supabase-js';
import {
    ArrowLeft,
    Bell,
    CheckCircle,
    Copy,
    EthernetPort,
    ExternalLink,
    Eye,
    EyeOff,
    HelpCircle,
    LinkIcon,
    Pause,
    Play,
    RefreshCw,
    ShieldAlert,
    Sliders,
    Trash2,
    Tv,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ServerConfig {
    soundEnabled: boolean;
    soundType: string;
    soundVolume: number;
}

interface OverlayConfigRow {
    guild_id: string;
    username: string;
    token: string;
    user_id: string;
    updated_at?: string;
}

const DEFAULT_CONFIG: ServerConfig = {
    soundEnabled: true,
    soundType: 'chime',
    soundVolume: 50,
};

const playSynthSound = (type: string, volume: number) => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(volume / 100, audioCtx.currentTime);
        gainNode.connect(audioCtx.destination);

        if (type === 'chime') {
            const freqs = [523.25, 659.25, 783.99];
            freqs.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const noteGain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.06);
                osc.connect(noteGain);
                noteGain.connect(gainNode);
                const startTime = audioCtx.currentTime + i * 0.06;
                noteGain.gain.setValueAtTime(0, startTime);
                noteGain.gain.linearRampToValueAtTime(volume / 100, startTime + 0.02);
                noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
                osc.start(startTime);
                osc.stop(startTime + 0.6);
            });
        } else if (type === 'arcade') {
            const notes = [440, 659.25];
            notes.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const noteGain = audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.09);
                osc.connect(noteGain);
                noteGain.connect(gainNode);
                const startTime = audioCtx.currentTime + i * 0.09;
                noteGain.gain.setValueAtTime(0, startTime);
                noteGain.gain.linearRampToValueAtTime((volume / 100) * 0.5, startTime + 0.005);
                noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
                osc.start(startTime);
                osc.stop(startTime + 0.12);
            });
        } else if (type === 'success') {
            const notes = [659.25, 987.77];
            notes.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const noteGain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
                osc.connect(noteGain);
                noteGain.connect(gainNode);
                const startTime = audioCtx.currentTime + i * 0.1;
                noteGain.gain.setValueAtTime(0, startTime);
                noteGain.gain.linearRampToValueAtTime(volume / 100, startTime + 0.015);
                noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
                osc.start(startTime);
                osc.stop(startTime + 0.25);
            });
        } else {
            const notes = [466.16, 587.33];
            notes.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const noteGain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
                osc.connect(noteGain);
                noteGain.connect(gainNode);
                const startTime = audioCtx.currentTime + i * 0.1;
                noteGain.gain.setValueAtTime(0, startTime);
                noteGain.gain.linearRampToValueAtTime(volume / 100, startTime + 0.015);
                noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
                osc.start(startTime);
                osc.stop(startTime + 0.35);
            });
        }
    } catch (e) {
        console.error('Failed to play synth sound:', e);
    }
};

import Footer from '../components/Footer';
import Header from '../components/Header';
import Seo from '../components/Seo';
import VideoModal from '../components/VideoModal';

const YOUTUBE_VIDEO_ID = 'iIK6me_W1BQ';

interface DiscordGuild {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
    hasBot?: boolean;
    overlayCount?: number;
}

export default function Config() {
    const { guildId } = useParams<{ guildId?: string }>();
    const navigate = useNavigate();

    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    const lastFetchedToken = useRef<string | null>(null);
    const fetchInProgressToken = useRef<string | null>(null);

    const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
    const [fetchingGuilds, setFetchingGuilds] = useState(false);
    const [selectedGuild, setSelectedGuild] = useState<DiscordGuild | null>(null);

    const [configs, setConfigs] = useState<OverlayConfigRow[]>([]);
    const [activeConfig, setActiveConfig] = useState<OverlayConfigRow | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newOverlayName, setNewOverlayName] = useState('');

    const [allGuildConfigs, setAllGuildConfigs] = useState<any[]>([]);
    const [loadingAllConfigs, setLoadingAllConfigs] = useState(false);

    const [username, setUsername] = useState('');
    const [dbUsername, setDbUsername] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [isLinkBlurred, setIsLinkBlurred] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [justRegenerated, setJustRegenerated] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [videoOpen, setVideoOpen] = useState(false);
    const handleCloseVideo = useCallback(() => setVideoOpen(false), []);

    const [isPlayingSoundWave, setIsPlayingSoundWave] = useState(false);
    const [serverConfig, setServerConfig] = useState<ServerConfig>(DEFAULT_CONFIG);
    const [draftConfig, setDraftConfig] = useState<ServerConfig>(DEFAULT_CONFIG);

    const [hasExistingLink, setHasExistingLink] = useState<boolean | null>(null);
    const [checkingLink, setCheckingLink] = useState(false);
    const [showObsGuide, setShowObsGuide] = useState(false);

    const [isRestricted, setIsRestricted] = useState(false);
    const [guildRoles, setGuildRoles] = useState<any[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [requiredRoleId, setRequiredRoleId] = useState<string | null>(null);
    const [dbRequiredRoleId, setDbRequiredRoleId] = useState<string | null>(null);
    const [isRoleRestrictionEnabled, setIsRoleRestrictionEnabled] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsSuccess, setSettingsSuccess] = useState(false);
    const [isSessionExpired, setIsSessionExpired] = useState(false);
    const [maxOverlays, setMaxOverlays] = useState<number>(5);
    const [dbMaxOverlaysLimit, setDbMaxOverlaysLimit] = useState<number>(5);
    const [maxOverlaysInput, setMaxOverlaysInput] = useState<string>('5');

    const isLocal = window.location.hostname === 'localhost';
    const apiBase = isLocal ? 'http://localhost:3000' : 'https://livechat-api.nevylish.fr';
    const overlayBase = isLocal ? 'http://localhost:4000/v2/overlay' : 'https://livechat.nevylish.fr/v2/overlay.html';

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
        if (activeConfig && selectedGuild) {
            const savedToken = localStorage.getItem(`livechat_settings_${activeConfig.token}`);
            let loaded = DEFAULT_CONFIG;
            if (savedToken) {
                try {
                    loaded = JSON.parse(savedToken);
                } catch (_) {
                    loaded = DEFAULT_CONFIG;
                }
            } else {
                const savedGuild = localStorage.getItem(`livechat_settings_${selectedGuild.id}`);
                if (savedGuild) {
                    try {
                        loaded = JSON.parse(savedGuild);
                        localStorage.setItem(`livechat_settings_${activeConfig.token}`, savedGuild);
                    } catch (_) {
                        loaded = DEFAULT_CONFIG;
                    }
                }
            }
            setServerConfig(loaded);
            setDraftConfig(loaded);
        }
    }, [activeConfig, selectedGuild]);

    useEffect(() => {
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
            if (!user) {
                return;
            }
            const userId = user?.user_metadata?.provider_id || user?.user_metadata?.sub;
            if (!userId) {
                return;
            }
            setCheckingLink(true);
            setError(null);
            setIsRestricted(false);
            try {
                const response = await fetch(
                    `${apiBase}/api/config/get?guildId=${encodeURIComponent(selectedGuild.id)}&userId=${encodeURIComponent(userId)}`,
                );
                if (response.status === 403) {
                    const data = await response.json();
                    setError(data.error || "Vous n'avez pas l'autorisation d'utiliser LiveChat sur ce serveur.");
                    setIsRestricted(true);
                    setConfigs([]);
                    setHasExistingLink(null);
                    return;
                }
                if (response.ok) {
                    const data = await response.json();
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
            } catch (err: any) {
                console.error(err);
                setError('Impossible de vérifier la configuration de ce serveur.');
                setConfigs([]);
                setHasExistingLink(false);
            } finally {
                setCheckingLink(false);
            }
        };

        checkExistingConfig();
    }, [selectedGuild, user]);

    // Fetch all guild configs for administration if user is admin
    useEffect(() => {
        const fetchAllConfigs = async () => {
            if (!selectedGuild || isEditing || !user) {
                setAllGuildConfigs([]);
                return;
            }
            const perms = parseInt(selectedGuild.permissions);
            const isUserAdmin = selectedGuild.owner || (perms & 0x8) === 0x8 || (perms & 0x20) === 0x20;
            if (!isUserAdmin) {
                setAllGuildConfigs([]);
                return;
            }

            const userId = user?.user_metadata?.provider_id || user?.user_metadata?.sub;
            if (!userId) return;

            setLoadingAllConfigs(true);
            try {
                const response = await fetch(
                    `${apiBase}/api/config/all?guildId=${encodeURIComponent(selectedGuild.id)}&userId=${encodeURIComponent(userId)}`,
                );
                if (response.ok) {
                    const data = await response.json();
                    if (data.configs) {
                        setAllGuildConfigs(data.configs);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch all configurations', err);
            } finally {
                setLoadingAllConfigs(false);
            }
        };

        fetchAllConfigs();
    }, [selectedGuild, isEditing, user]);

    // Fetch server settings and roles for administration if user is admin
    useEffect(() => {
        const fetchSettingsAndRoles = async () => {
            if (!selectedGuild || !user) {
                setGuildRoles([]);
                setRequiredRoleId(null);
                setDbRequiredRoleId(null);
                setIsRoleRestrictionEnabled(false);
                setDbMaxOverlaysLimit(5);
                setMaxOverlaysInput('5');
                return;
            }

            const perms = parseInt(selectedGuild.permissions);
            const isUserAdmin = selectedGuild.owner || (perms & 0x8) === 0x8 || (perms & 0x20) === 0x20;
            if (!isUserAdmin) {
                setGuildRoles([]);
                setRequiredRoleId(null);
                setDbRequiredRoleId(null);
                setIsRoleRestrictionEnabled(false);
                setDbMaxOverlaysLimit(5);
                setMaxOverlaysInput('5');
                return;
            }

            const userId = user?.user_metadata?.provider_id || user?.user_metadata?.sub;
            if (!userId) return;

            setLoadingRoles(true);
            try {
                // Fetch settings
                const settingsRes = await fetch(
                    `${apiBase}/api/guild/settings?guildId=${encodeURIComponent(selectedGuild.id)}&userId=${encodeURIComponent(userId)}`,
                );
                if (settingsRes.ok) {
                    const data = await settingsRes.json();
                    if (data.settings) {
                        const roleId = data.settings.required_role_id;
                        setRequiredRoleId(roleId);
                        setDbRequiredRoleId(roleId);
                        setIsRoleRestrictionEnabled(roleId !== null && roleId !== '');

                        const limit = data.settings.max_overlays_per_user ?? 5;
                        setDbMaxOverlaysLimit(limit);
                        setMaxOverlaysInput(String(limit));
                    }
                }

                // Fetch roles
                const rolesRes = await fetch(
                    `${apiBase}/api/guild/roles?guildId=${encodeURIComponent(selectedGuild.id)}&userId=${encodeURIComponent(userId)}`,
                );
                if (rolesRes.ok) {
                    const data = await rolesRes.json();
                    if (data.roles) {
                        setGuildRoles(data.roles);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch settings and roles', err);
            } finally {
                setLoadingRoles(false);
            }
        };

        fetchSettingsAndRoles();
    }, [selectedGuild, user]);

    const updateDraftConfig = <K extends keyof ServerConfig>(key: K, value: ServerConfig[K]) => {
        setDraftConfig((prev) => ({ ...prev, [key]: value }));
    };

    const handleConfigureConfig = (config: OverlayConfigRow) => {
        setActiveConfig(config);
        setUsername(config.username);
        setDbUsername(config.username);
        setGeneratedLink(`${overlayBase}?token=${config.token}`);
        setIsEditing(true);
        setError(null);
    };

    const handleSaveConfig = async () => {
        if (!selectedGuild || !activeConfig) return;

        setError(null);
        setIsGenerating(true);

        try {
            localStorage.setItem(`livechat_settings_${activeConfig.token}`, JSON.stringify(draftConfig));
            setServerConfig(draftConfig);

            if (username !== dbUsername) {
                if (!username || username.length < 4 || username.length > 25) {
                    throw new Error("Le nom d'utilisateur doit faire entre 4 et 25 caractères.");
                }

                const userId = user?.user_metadata?.provider_id || user?.user_metadata?.sub;

                const response = await fetch(`${apiBase}/api/config/save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,
                        guildId: selectedGuild.id,
                        token: activeConfig.token,
                        userId: userId,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Impossible d'enregistrer le nouveau pseudo.");
                }

                const data = await response.json();
                if (data.success) {
                    setDbUsername(username);
                    const updatedConfig = { ...activeConfig, username: username };
                    setActiveConfig(updatedConfig);
                    setConfigs((prev) => prev.map((c) => (c.token === activeConfig.token ? updatedConfig : c)));
                } else {
                    throw new Error("Impossible d'enregistrer le nouveau pseudo.");
                }
            }
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue lors de la sauvegarde.');
        } finally {
            setIsGenerating(false);
        }
    };

    const hasUnsavedChanges = JSON.stringify(draftConfig) !== JSON.stringify(serverConfig) || username !== dbUsername;

    const handleSaveSettings = async () => {
        if (!selectedGuild || !user) return;
        setSavingSettings(true);
        setSettingsSuccess(false);
        setError(null);

        const userId = user?.user_metadata?.provider_id || user?.user_metadata?.sub;
        if (!userId) return;

        const targetRoleId = isRoleRestrictionEnabled ? requiredRoleId : null;
        let parsedLimit = parseInt(maxOverlaysInput);
        if (isNaN(parsedLimit) || parsedLimit < 1) parsedLimit = 1;
        if (parsedLimit > 20) parsedLimit = 20;

        try {
            const response = await fetch(`${apiBase}/api/guild/settings/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    guildId: selectedGuild.id,
                    requiredRoleId: targetRoleId,
                    maxOverlaysPerUser: parsedLimit,
                    userId: userId,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Impossible de sauvegarder les paramètres du serveur.');
            }

            setDbRequiredRoleId(targetRoleId);
            setDbMaxOverlaysLimit(parsedLimit);
            setMaxOverlaysInput(String(parsedLimit));
            setMaxOverlays(parsedLimit);
            setSettingsSuccess(true);
            setTimeout(() => setSettingsSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue lors de la sauvegarde.');
        } finally {
            setSavingSettings(false);
        }
    };

    const hasUnsavedSettings =
        (isRoleRestrictionEnabled ? requiredRoleId : null) !== dbRequiredRoleId ||
        (parseInt(maxOverlaysInput) || 5) !== dbMaxOverlaysLimit;

    const handlePlaySound = (type: string, volume: number) => {
        setIsPlayingSoundWave(true);
        playSynthSound(type, volume);
        setTimeout(() => setIsPlayingSoundWave(false), 800);
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setAuthLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadGuilds = useCallback(
        async (force = false) => {
            if (!session) return;
            const providerToken = session.provider_token;
            if (!providerToken) {
                console.warn('No Discord provider token found in session.');
                const hasTriedOAuth = sessionStorage.getItem('livechat_oauth_retry');
                if (!hasTriedOAuth) {
                    sessionStorage.setItem('livechat_oauth_retry', 'true');
                    handleLogin();
                } else {
                    setIsSessionExpired(true);
                }
                return;
            }
            sessionStorage.removeItem('livechat_oauth_retry');
            setIsSessionExpired(false);

            if (
                !force &&
                (lastFetchedToken.current === providerToken || fetchInProgressToken.current === providerToken)
            ) {
                return;
            }

            fetchInProgressToken.current = providerToken;
            setFetchingGuilds(true);
            setError(null);
            try {
                const res = await fetch('https://discord.com/api/users/@me/guilds', {
                    headers: {
                        Authorization: `Bearer ${providerToken}`,
                    },
                });
                if (!res.ok) throw new Error("Impossible de récupérer vos serveurs Discord depuis l'API Discord.");

                const userGuilds: DiscordGuild[] = await res.json();

                const chunkArray = (arr: any[], size: number): any[][] => {
                    const chunked: any[][] = [];
                    for (let i = 0; i < arr.length; i += size) {
                        chunked.push(arr.slice(i, i + size));
                    }
                    return chunked;
                };

                const userId = session.user?.user_metadata?.provider_id || session.user?.user_metadata?.sub;
                const userIdQuery = userId ? `&userId=${encodeURIComponent(userId)}` : '';

                const guildChunks = chunkArray(userGuilds, 80);
                const botPresenceMap: Record<string, { hasBot: boolean; overlayCount: number }> = {};

                await Promise.all(
                    guildChunks.map(async (chunk) => {
                        try {
                            const ids = chunk.map((g) => g.id).join(',');
                            const botRes = await fetch(
                                `${apiBase}/api/guild/check?guildId=${encodeURIComponent(ids)}${userIdQuery}`,
                            );
                            if (botRes.ok) {
                                const data = await botRes.json();
                                if (data.results) {
                                    Object.assign(botPresenceMap, data.results);
                                }
                            }
                        } catch (e) {
                            console.error('Failed to batch check guilds', e);
                        }
                    }),
                );

                const checkedGuilds = userGuilds
                    .map((g) => {
                        const status = botPresenceMap[g.id] || { hasBot: false, overlayCount: 0 };
                        return {
                            ...g,
                            hasBot: status.hasBot,
                            overlayCount: status.overlayCount,
                        };
                    })
                    .filter((g) => {
                        const perms = parseInt(g.permissions);
                        const isAdmin = g.owner || (perms & 0x8) === 0x8 || (perms & 0x20) === 0x20;
                        return isAdmin || g.hasBot;
                    });

                checkedGuilds.sort((a, b) => {
                    if (a.hasBot && !b.hasBot) return -1;
                    if (!a.hasBot && b.hasBot) return 1;
                    return a.name.localeCompare(b.name);
                });

                lastFetchedToken.current = providerToken;
                setGuilds(checkedGuilds);
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Erreur lors du chargement de vos serveurs.');
                lastFetchedToken.current = null;
            } finally {
                fetchInProgressToken.current = null;
                setFetchingGuilds(false);
            }
        },
        [session, apiBase],
    );

    useEffect(() => {
        if (session) {
            loadGuilds(false);
        }
    }, [session, loadGuilds]);

    useEffect(() => {
        if (session && user) {
            const discordUsername = user?.user_metadata?.preferred_username || user?.user_metadata?.name || '';
            const formattedName = discordUsername.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
            setUsername((prev) => prev || formattedName);
        }
    }, [session, user]);

    const handleLogin = async () => {
        try {
            await supabase.auth.signInWithOAuth({
                provider: 'discord',
                options: {
                    redirectTo: window.location.origin + '/config',
                    scopes: 'identify guilds',
                },
            });
        } catch (err) {
            console.error('Login error', err);
            setError('Une erreur est survenue lors de la connexion avec Discord.');
        }
    };

    const validateAndSetUsername = (val: string) => {
        let clean = val.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        if (clean.startsWith('_')) clean = clean.substring(1);
        setUsername(clean);
    };

    const handleCreateConfig = async (customName?: string) => {
        if (!selectedGuild) return;
        const nameToCreate = customName || username;
        if (!nameToCreate || nameToCreate.length < 4 || nameToCreate.length > 25) {
            setError("Le nom d'utilisateur doit faire entre 4 et 25 caractères.");
            return;
        }
        setError(null);
        setIsGenerating(true);

        try {
            const userId = user?.user_metadata?.provider_id || user?.user_metadata?.sub;
            if (!userId) {
                throw new Error("Impossible d'identifier votre compte Discord.");
            }
            const response = await fetch(`${apiBase}/api/config/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: nameToCreate,
                    guildId: selectedGuild.id,
                    userId: userId,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Impossible de créer la configuration de l'overlay.");
            }

            const data = await response.json();
            if (data.exists && data.token) {
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
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue lors de la création.');
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
            const userId = user?.user_metadata?.provider_id || user?.user_metadata?.sub;
            const response = await fetch(`${apiBase}/api/config/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: configToken,
                    userId: userId,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Impossible de supprimer la configuration.');
            }

            localStorage.removeItem(`livechat_settings_${configToken}`);

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
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue lors de la suppression.');
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
            const userId = user?.user_metadata?.provider_id || user?.user_metadata?.sub;
            const response = await fetch(`${apiBase}/api/config/admin/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    guildId: selectedGuild?.id,
                    username: targetUsername,
                    userId: userId,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Impossible de supprimer la configuration.');
            }

            // Remove from administrative list local state
            const updatedAll = allGuildConfigs.filter((c) => c.username !== targetUsername);
            setAllGuildConfigs(updatedAll);

            // Also check if this overlay belonged to the admin themselves, and update their own local configs list
            const updatedConfigs = configs.filter((c) => c.username.toLowerCase() !== targetUsername.toLowerCase());
            setConfigs(updatedConfigs);
            if (updatedConfigs.length === 0) {
                setHasExistingLink(false);
            }
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue lors de la suppression.');
        } finally {
            setIsGenerating(false);
        }
    };

    const regenerateLink = async () => {
        if (!selectedGuild || !activeConfig) return;
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
            const userId = user?.user_metadata?.provider_id || user?.user_metadata?.sub;
            const response = await fetch(`${apiBase}/api/config/regenerate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: activeConfig.token,
                    userId: userId,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Impossible de régénérer la clé.');
            }

            const { token: newToken } = await response.json();

            const savedSettings = localStorage.getItem(`livechat_settings_${activeConfig.token}`);
            if (savedSettings) {
                localStorage.setItem(`livechat_settings_${newToken}`, savedSettings);
                localStorage.removeItem(`livechat_settings_${activeConfig.token}`);
            }

            const updatedConfig = { ...activeConfig, token: newToken };
            setActiveConfig(updatedConfig);
            setConfigs((prev) => prev.map((c) => (c.token === activeConfig.token ? updatedConfig : c)));
            setGeneratedLink(`${overlayBase}?token=${newToken}`);
            setIsLinkBlurred(true);
            setJustRegenerated(true);
            setTimeout(() => {
                setJustRegenerated(false);
            }, 4000);
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue lors de la régénération.');
        } finally {
            setIsGenerating(false);
        }
    };

    function copyToClipboard(text: string, buttonId: string) {
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById(buttonId);
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = 'Copié !';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            }
        });
    }

    if (authLoading) {
        return (
            <div className="dark flex min-h-screen flex-col text-foreground bg-background">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="h-10 w-10 animate-spin text-white/60" />
                        <p className="text-sm font-semibold text-muted-foreground">Chargement du dashboard...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="dark flex min-h-screen flex-col text-foreground bg-background">
            <Seo
                title="Configurer LiveChat - Dashboard Discord et overlay"
                description="Connectez-vous avec Discord, configurez vos liens d'overlay et intégrez-les directement dans OBS Studio."
                path="/config"
            />
            <Header />
            <VideoModal
                open={videoOpen}
                onClose={handleCloseVideo}
                videoId={YOUTUBE_VIDEO_ID}
                title="Tutoriel LiveChat"
            />

            <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 sm:px-10 sm:py-12">
                {!session ? (
                    /* NON CONNECTÉ - Écran de connexion Discord */
                    <div className="max-w-xl mx-auto py-8">
                        <div className="config-card flex flex-col items-center text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-white mb-6">
                                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107 14.36 14.36 0 0 0 1.226 1.99.076.076 0 0 0 .084-.03 19.86 19.86 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
                                </svg>
                            </div>
                            <h2 className="config-title">Configurer votre overlay</h2>
                            <p className="mt-4 text-muted-foreground text-sm leading-relaxed max-w-sm">
                                Connectez-vous avec votre compte Discord pour récupérer automatiquement vos serveurs de
                                stream et gérer votre lien d'overlay en toute sécurité.
                            </p>

                            <button
                                onClick={handleLogin}
                                className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-white hover:bg-white/90 px-8 py-3.5 text-sm font-semibold text-black transition-opacity shadow-lg"
                            >
                                Se connecter avec Discord
                            </button>

                            <div className="mt-8 pt-6 border-t border-white/5 w-full text-left">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                                    Pré-requis
                                </h3>
                                <ul className="space-y-3.5 text-xs text-muted-foreground">
                                    <li className="flex gap-2.5 items-start">
                                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                                        <span>Un compte Discord et un serveur sur lequel installer le bot.</span>
                                    </li>
                                    <li className="flex gap-2.5 items-start">
                                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                                        <span>
                                            Un logiciel de streaming supportant les sources navigateur (OBS,
                                            Streamlabs).
                                        </span>
                                    </li>
                                    <li className="flex gap-2.5 items-start">
                                        <EthernetPort className="h-4 w-4 text-white/60 shrink-0" />
                                        <span>Une connexion internet correcte.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* CONNECTÉ - Dashboard de configuration */
                    <div className="space-y-6">
                        {/* Barre utilisateur supérieure */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white/2 border border-border/40 rounded-2xl p-4 sm:px-6">
                            <div className="flex items-center gap-3.5">
                                {selectedGuild ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                if (isEditing) {
                                                    setIsEditing(false);
                                                    setActiveConfig(null);
                                                    setUsername('');
                                                    setDbUsername('');
                                                    setGeneratedLink('');
                                                    setError(null);
                                                } else {
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
                            <div className="flex items-center gap-2">
                                {selectedGuild && isEditing && activeConfig && (
                                    <>
                                        <button
                                            onClick={handleSaveConfig}
                                            disabled={!hasUnsavedChanges}
                                            className={`rounded-lg px-4 h-9 text-xs font-bold transition-colors ${
                                                hasUnsavedChanges
                                                    ? 'bg-white text-black hover:bg-white/95 cursor-pointer shadow-md'
                                                    : 'bg-white/5 border border-border text-muted-foreground cursor-not-allowed opacity-50'
                                            }`}
                                        >
                                            Sauvegarder
                                        </button>
                                        <button
                                            onClick={() => handleDeleteConfig(activeConfig.token)}
                                            className="flex h-9 items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-4 py-1.5 text-xs font-bold text-red-200 transition-colors duration-200 cursor-pointer"
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
                                        className="flex h-9 items-center gap-2 rounded-lg border border-border bg-white/3 hover:bg-white/5 px-4 py-1.5 text-xs font-semibold text-muted-foreground transition-colors duration-200 disabled:opacity-50 hover:text-foreground"
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 ${fetchingGuilds ? 'animate-spin' : ''}`} />
                                        Actualiser
                                    </button>
                                )}
                                <button
                                    onClick={() => setVideoOpen(true)}
                                    className="flex h-9 items-center gap-2 rounded-lg border border-border bg-white/3 hover:bg-white/5 px-4 py-1.5 text-xs font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground"
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
                            /* GRILLE DES SERVEURS DISCORD */
                            <div className="space-y-8">
                                {fetchingGuilds ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                                        <RefreshCw className="h-10 w-10 animate-spin text-white/60" />
                                        <span className="text-sm font-semibold text-muted-foreground">
                                            Chargement de vos serveurs...
                                        </span>
                                    </div>
                                ) : isSessionExpired ? (
                                    <div className="config-card py-16 text-center max-w-md mx-auto space-y-4">
                                        <ShieldAlert className="h-12 w-12 opacity-80 mx-auto text-amber-500" />
                                        <h3 className="font-bold text-lg text-foreground">Session Discord expirée</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Votre session Discord a expiré ou a été réinitialisée. Veuillez vous
                                            reconnecter pour actualiser la liste de vos serveurs de stream.
                                        </p>
                                        <button
                                            onClick={handleLogin}
                                            className="rounded-lg bg-white hover:bg-white/90 text-black px-6 py-2.5 text-xs font-bold transition-colors cursor-pointer"
                                        >
                                            Se connecter avec Discord
                                        </button>
                                    </div>
                                ) : guilds.length === 0 ? (
                                    <div className="config-card py-16 text-center max-w-md mx-auto space-y-4">
                                        <HelpCircle className="h-12 w-12 opacity-40 mx-auto text-muted-foreground" />
                                        <p className="text-base text-muted-foreground">
                                            Aucun serveur Discord administré n'a été trouvé.
                                        </p>
                                        <button
                                            onClick={() => loadGuilds(true)}
                                            className="rounded-full bg-white/10 hover:bg-white/15 px-6 py-2 text-sm font-semibold transition-colors"
                                        >
                                            Actualiser la liste
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {guilds.map((g) => {
                                            return (
                                                <div
                                                    key={g.id}
                                                    onClick={() => g.hasBot && navigate(`/config/${g.id}`)}
                                                    className={`config-card flex flex-col justify-between h-full p-6 transition-colors group border ${
                                                        g.hasBot
                                                            ? 'cursor-pointer hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.04]'
                                                            : 'bg-white/[0.01] border-white/5 opacity-70'
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
                                                            <h3 className="font-bold text-base sm:text-lg truncate transition-colors">
                                                                {g.name}
                                                            </h3>
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        className={`h-2 w-2 rounded-full ${g.hasBot ? 'bg-emerald-500' : 'bg-white/20'}`}
                                                                    />
                                                                    <span className="text-xs font-medium text-muted-foreground">
                                                                        {g.hasBot
                                                                            ? 'LiveChat installé'
                                                                            : 'LiveChat non installé'}
                                                                    </span>
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
                                                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] px-4 py-2.5 text-sm font-bold text-white transition-colors"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            Inviter le bot
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    ) : (
                                                        <div className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white hover:bg-white/90 px-4 py-2.5 text-sm font-bold text-black transition-colors">
                                                            {g.overlayCount && g.overlayCount > 0
                                                                ? 'Gérer mes overlays'
                                                                : 'Créer mon overlay'}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : !selectedGuild ? (
                            /* LOADING / GUILD VALIDATION IN PROGRESS */
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <RefreshCw className="h-10 w-10 animate-spin text-white/60" />
                                <span className="text-sm font-semibold text-muted-foreground">
                                    Validation du serveur...
                                </span>
                            </div>
                        ) : (
                            /* CONFIGURATION SERVEUR ACTIVE */
                            <div className="space-y-6">
                                {checkingLink ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                                        <RefreshCw className="h-8 w-8 animate-spin text-white/60" />
                                        <span className="text-sm font-semibold text-muted-foreground">
                                            Vérification de la configuration...
                                        </span>
                                    </div>
                                ) : isRestricted ? (
                                    /* ÉCRAN ACCÈS RESTREINT (ROLE OBLIGATOIRE MANQUANT) */
                                    <div className="max-w-xl mx-auto py-8">
                                        <div className="config-card flex flex-col items-center text-center space-y-6 border-red-500/20 bg-red-500/5">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                                                <ShieldAlert className="h-8 w-8" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold sm:text-2xl text-red-200">
                                                    Accès restreint
                                                </h3>
                                                <p className="text-sm text-red-200/80 leading-relaxed max-w-md">
                                                    {error ||
                                                        'Un rôle obligatoire est requis pour utiliser LiveChat et configurer des overlays sur ce serveur Discord.'}
                                                </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground max-w-sm">
                                                Veuillez contacter un administrateur du serveur pour obtenir le rôle
                                                nécessaire.
                                            </p>
                                        </div>
                                    </div>
                                ) : !hasExistingLink ? (
                                    /* ÉCRAN ONBOARDING */
                                    <div className="max-w-xl mx-auto py-8">
                                        <div className="config-card flex flex-col items-start text-left space-y-6">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white">
                                                <Sliders className="h-8 w-8" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold sm:text-2xl">
                                                    Activer votre premier overlay
                                                </h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    Configurez votre pseudo de diffusion ci-dessous pour générer le lien
                                                    de votre source navigateur OBS unique pour le serveur{' '}
                                                    {selectedGuild.name}.
                                                </p>
                                            </div>

                                            <div className="w-full text-left space-y-4 pt-2">
                                                <div>
                                                    <label
                                                        htmlFor="username"
                                                        className="config-label text-sm text-muted-foreground font-semibold"
                                                    >
                                                        Pseudo de diffusion (Twitch, Kick, YouTube)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="username"
                                                        placeholder="pseudo_streamer"
                                                        value={username}
                                                        onChange={(e) => validateAndSetUsername(e.target.value)}
                                                        className="config-input mt-1.5 py-3 px-4 text-base"
                                                    />
                                                    <p className="mt-2 text-xs text-muted-foreground leading-normal">
                                                        Ce pseudo permet d'identifier votre overlay. Vous pourrez le
                                                        modifier plus tard.
                                                    </p>
                                                </div>

                                                {error && (
                                                    <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3.5 text-sm text-red-200">
                                                        <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                                                        <div>{error}</div>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => handleCreateConfig()}
                                                    disabled={isGenerating || !username}
                                                    className="w-full flex items-center justify-center gap-2 rounded-full bg-white hover:bg-white/90 px-8 py-3.5 text-sm font-semibold text-black transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isGenerating
                                                        ? "Génération de l'overlay..."
                                                        : "Créer et générer votre lien d'overlay"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : !isEditing ? (
                                    /* TABLEAU DE BORD - LISTE DES OVERLAYS */
                                    <div className="space-y-8 max-w-6xl mx-auto">
                                        <div className="flex flex-col md:flex-row gap-8">
                                            {/* Liste des Overlays */}
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
                                                    {configs.map((config) => (
                                                        <div
                                                            key={config.token}
                                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
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
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Bloc de Création / Infos de Limite */}
                                            <div className="w-full md:w-80 shrink-0">
                                                {configs.length < maxOverlays ? (
                                                    <div className="config-card flex flex-col items-start text-left space-y-4">
                                                        <div className="space-y-1">
                                                            <h4 className="font-bold text-base text-foreground">
                                                                Créer un overlay
                                                            </h4>
                                                            <p className="text-xs text-muted-foreground leading-normal">
                                                                Ajoutez un nouvel overlay indépendant pour ce serveur
                                                                Discord.
                                                            </p>
                                                        </div>
                                                        <div className="w-full space-y-3 pt-2">
                                                            <div>
                                                                <label
                                                                    htmlFor="newOverlayName"
                                                                    className="config-label text-xs text-muted-foreground font-semibold"
                                                                >
                                                                    Nom d'affichage
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    id="newOverlayName"
                                                                    placeholder="pseudo_streamer"
                                                                    value={newOverlayName}
                                                                    onChange={(e) => {
                                                                        let clean = e.target.value
                                                                            .replace(/[^a-zA-Z0-9_]/g, '')
                                                                            .toLowerCase();
                                                                        if (clean.startsWith('_'))
                                                                            clean = clean.substring(1);
                                                                        setNewOverlayName(clean);
                                                                    }}
                                                                    className="config-input py-2 px-3 text-sm"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => handleCreateConfig(newOverlayName)}
                                                                disabled={isGenerating || !newOverlayName}
                                                                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-white/90 px-4 py-2.5 text-xs font-semibold text-black transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {isGenerating
                                                                    ? 'Création...'
                                                                    : 'Créer mon nouvel overlay'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="config-card border-amber-500/20 bg-amber-500/5 flex flex-col items-start text-left space-y-4">
                                                        <div className="space-y-1">
                                                            <h4 className="font-bold text-base text-amber-200">
                                                                Limite atteinte
                                                            </h4>
                                                            <p className="text-xs text-amber-200/70 leading-normal">
                                                                Vous avez atteint la limite maximale de {maxOverlays}{' '}
                                                                overlay{maxOverlays > 1 ? 's' : ''} par personne sur ce
                                                                serveur.
                                                            </p>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground leading-normal pt-1">
                                                            Pour créer un nouvel overlay, veuillez d'abord en supprimer
                                                            un parmi vos configurations actives sur ce serveur.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* SECTION ADMINISTRATION DU SERVEUR */}
                                        {selectedGuild &&
                                            (selectedGuild.owner ||
                                                (parseInt(selectedGuild.permissions) & 0x8) === 0x8 ||
                                                (parseInt(selectedGuild.permissions) & 0x20) === 0x20) && (
                                                <div className="border-t border-white/5 pt-8 space-y-6">
                                                    <div>
                                                        <h3 className="text-lg font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
                                                            <ShieldAlert className="h-5 w-5" />
                                                            Administration du serveur
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            Gérez les overlays des membres et configurez les
                                                            autorisations d'utilisation de LiveChat pour ce serveur.
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        {/* Colonne gauche : Liste des overlays des membres */}
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
                                                                    Aucune configuration active d'overlay sur ce
                                                                    serveur.
                                                                </div>
                                                            ) : (
                                                                <div className="grid gap-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                                                                    {allGuildConfigs.map((c) => (
                                                                        <div
                                                                            key={c.username}
                                                                            className="flex items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.01]"
                                                                        >
                                                                            <div className="min-w-0">
                                                                                <p className="font-bold text-sm text-foreground truncate">
                                                                                    {c.username}
                                                                                </p>
                                                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                                                    Créateur (ID Discord):{' '}
                                                                                    <span className="font-mono text-[10px]">
                                                                                        {c.user_id}
                                                                                    </span>
                                                                                </p>
                                                                            </div>
                                                                            <button
                                                                                onClick={() =>
                                                                                    handleAdminDeleteConfig(c.username)
                                                                                }
                                                                                className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/20 px-3 h-8.5 text-xs font-bold text-red-200 transition-colors cursor-pointer shrink-0"
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                                Révoquer
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Colonne droite : Configuration du Serveur (Rôle requis & Limites) */}
                                                        <div className="space-y-4">
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                                <Sliders className="h-4.5 w-4.5" />
                                                                Configuration du Serveur
                                                            </h4>

                                                            <div className="config-card space-y-5">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="space-y-0.5">
                                                                        <p className="text-sm font-semibold text-foreground">
                                                                            Restreindre par rôle
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground max-w-xs leading-normal">
                                                                            Exiger un rôle Discord spécifique pour créer
                                                                            ou utiliser des overlays.
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => {
                                                                            const nextState = !isRoleRestrictionEnabled;
                                                                            setIsRoleRestrictionEnabled(nextState);
                                                                            if (
                                                                                nextState &&
                                                                                !requiredRoleId &&
                                                                                guildRoles.length > 0
                                                                            ) {
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
                                                                                onChange={(e) =>
                                                                                    setRequiredRoleId(
                                                                                        e.target.value || null,
                                                                                    )
                                                                                }
                                                                                className="config-input w-full py-2 px-3 text-sm rounded-lg"
                                                                            >
                                                                                {guildRoles.length === 0 ? (
                                                                                    <option value="">
                                                                                        Aucun rôle disponible
                                                                                    </option>
                                                                                ) : (
                                                                                    guildRoles.map((role) => (
                                                                                        <option
                                                                                            key={role.id}
                                                                                            value={role.id}
                                                                                        >
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
                                                                        <p className="text-xs text-muted-foreground max-w-xs leading-normal">
                                                                            Nombre maximum d'overlays que chaque membre
                                                                            peut créer (min 1, max 20).
                                                                        </p>
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="5"
                                                                        value={maxOverlaysInput}
                                                                        onChange={(e) => {
                                                                            const clean = e.target.value.replace(
                                                                                /[^0-9]/g,
                                                                                '',
                                                                            );
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
                                ) : (
                                    /* ÉCRAN DE CONFIGURATION BRUTE */
                                    <div className="space-y-6 max-w-6xl mx-auto">
                                        {/* Card 1 : Lien d'Overlay */}
                                        <div className="config-card space-y-6">
                                            <div>
                                                <h3 className="text-lg font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                    <LinkIcon className="h-5 w-5 " />
                                                    Lien d'overlay
                                                </h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Lien unique source navigateur à intégrer sur OBS.
                                                </p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="rounded-xl border border-border bg-white/3 p-4 sm:p-6 space-y-3.5">
                                                    <label className="block text-sm font-semibold text-muted-foreground">
                                                        URL Source Navigateur
                                                    </label>

                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                        <div
                                                            className="relative flex-1 cursor-pointer group min-w-0"
                                                            onClick={() => isLinkBlurred && setIsLinkBlurred(false)}
                                                        >
                                                            <div className="overflow-x-hidden whitespace-pre font-mono scrollbar-thin rounded-lg bg-black/40 px-4 py-3 text-sm border border-white/5">
                                                                <code
                                                                    className={
                                                                        isLinkBlurred
                                                                            ? 'blur-md select-none pointer-events-none'
                                                                            : ''
                                                                    }
                                                                >
                                                                    {generatedLink}
                                                                </code>
                                                            </div>
                                                            {isLinkBlurred && (
                                                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white bg-black/80 rounded-lg border border-white/5 group-hover:bg-black/75 transition-colors">
                                                                    Cliquez pour révéler le lien
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0 justify-end">
                                                            <button
                                                                onClick={() => setIsLinkBlurred(!isLinkBlurred)}
                                                                className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-white/3 hover:bg-white/5 transition-colors"
                                                                title={isLinkBlurred ? 'Révéler' : 'Masquer'}
                                                            >
                                                                {isLinkBlurred ? (
                                                                    <Eye className="h-5 w-5" />
                                                                ) : (
                                                                    <EyeOff className="h-5 w-5" />
                                                                )}
                                                            </button>
                                                            <button
                                                                id="copy-link-btn"
                                                                onClick={() =>
                                                                    copyToClipboard(generatedLink, 'copy-link-btn')
                                                                }
                                                                className="flex items-center gap-2 rounded-lg border border-border bg-white/3 hover:bg-white/5 px-4 h-11 text-sm font-semibold transition-colors"
                                                            >
                                                                <Copy className="h-4 w-4" />
                                                                Copier
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Modification du pseudo inline */}
                                                <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                                                    <label
                                                        htmlFor="username"
                                                        className="text-xs font-semibold text-muted-foreground"
                                                    >
                                                        Modifier votre pseudo d'affichage
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            id="username"
                                                            placeholder="pseudo"
                                                            value={username}
                                                            onChange={(e) => validateAndSetUsername(e.target.value)}
                                                            className="config-input py-2 px-3 text-sm flex-1"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Compromis token */}
                                                <div
                                                    className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-300 ${
                                                        justRegenerated
                                                            ? 'border-emerald-500/20 bg-emerald-500/5'
                                                            : 'border-red-500/20 bg-red-500/5'
                                                    }`}
                                                >
                                                    <div className="space-y-1">
                                                        <p
                                                            className={`text-sm font-bold flex items-center gap-1.5 transition-colors duration-300 ${
                                                                justRegenerated ? 'text-emerald-200' : 'text-red-200'
                                                            }`}
                                                        >
                                                            {justRegenerated ? (
                                                                <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
                                                            ) : (
                                                                <ShieldAlert className="h-4.5 w-4.5 text-red-400" />
                                                            )}
                                                            {justRegenerated
                                                                ? 'Votre nouveau lien est prêt !'
                                                                : 'Vous avez fait fuiter ce lien ?'}
                                                        </p>
                                                        <p
                                                            className={`text-xs leading-normal  transition-colors duration-300 ${
                                                                justRegenerated
                                                                    ? 'text-emerald-200/70'
                                                                    : 'text-red-200/70'
                                                            }`}
                                                        >
                                                            {justRegenerated
                                                                ? 'Le nouveau lien a été généré et est prêt à être copié.'
                                                                : "Pas de panique, si vous avez montré ce lien en stream, régénérez-le. L'ancien lien sera désactivé pour toujours."}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={regenerateLink}
                                                        disabled={isGenerating || justRegenerated}
                                                        className={`shrink-0 rounded-lg border px-4 py-2 text-xs font-bold transition-all duration-300 ${
                                                            justRegenerated
                                                                ? 'border-emerald-500/30 bg-emerald-500/25 text-emerald-200 cursor-not-allowed'
                                                                : 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-200'
                                                        }`}
                                                    >
                                                        {justRegenerated ? 'Régénéré' : 'Régénérer'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 2 : Sons de Notification */}
                                        <div className="config-card space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                        <Bell className="h-5 w-5" />
                                                        Sons de Notification
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Alerte sonore lors de la réception d'un nouveau message.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        updateDraftConfig('soundEnabled', !draftConfig.soundEnabled)
                                                    }
                                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${draftConfig.soundEnabled ? 'bg-white' : 'bg-white/10'}`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${draftConfig.soundEnabled ? 'bg-black translate-x-5' : 'bg-white translate-x-0'}`}
                                                    />
                                                </button>
                                            </div>

                                            {draftConfig.soundEnabled && (
                                                <div className="space-y-6 border-t border-white/5 pt-6">
                                                    {/* Type de signal */}
                                                    <div className="space-y-3">
                                                        <label className="text-sm font-semibold text-muted-foreground block">
                                                            Type de signal audio
                                                        </label>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {[
                                                                {
                                                                    id: 'ping',
                                                                    name: 'Ping',
                                                                    desc: 'Signal bref et aigu',
                                                                },
                                                                {
                                                                    id: 'chime',
                                                                    name: 'Mélodique',
                                                                    desc: 'Accord arpégé',
                                                                },
                                                                {
                                                                    id: 'arcade',
                                                                    name: 'Arcade 8-bit',
                                                                    desc: 'Double bip rétro façon jeu vidéo',
                                                                },
                                                                {
                                                                    id: 'success',
                                                                    name: 'Succès',
                                                                    desc: 'Deux notes ascendantes, façon victoire',
                                                                },
                                                            ].map((s) => (
                                                                <button
                                                                    key={s.id}
                                                                    onClick={() => updateDraftConfig('soundType', s.id)}
                                                                    className={`p-4 rounded-xl text-left border transition-colors text-xs font-semibold ${
                                                                        draftConfig.soundType === s.id
                                                                            ? 'border-white bg-white/5'
                                                                            : 'border-white/5 bg-white/2 hover:bg-white/3'
                                                                    }`}
                                                                >
                                                                    <p className="text-foreground font-bold text-sm">
                                                                        {s.name}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground mt-1 font-normal leading-normal">
                                                                        {s.desc}
                                                                    </p>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Test Button & State */}
                                                    <div className="flex flex-col items-center gap-3 pt-2">
                                                        <button
                                                            onClick={() => handlePlaySound(draftConfig.soundType, 50)}
                                                            disabled={isPlayingSoundWave}
                                                            className="flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/5 px-6 py-2.5 text-xs font-bold transition-colors text-center"
                                                        >
                                                            {isPlayingSoundWave ? (
                                                                <Pause className="h-3.5 w-3.5 fill-current text-white" />
                                                            ) : (
                                                                <Play className="h-3.5 w-3.5 fill-current text-white" />
                                                            )}
                                                            Écouter le son
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card 3 : Guide OBS repliable */}
                                        <div className="config-card">
                                            <button
                                                onClick={() => setShowObsGuide(!showObsGuide)}
                                                className="w-full flex items-center justify-between text-left font-bold text-foreground text-sm sm:text-base py-1"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <HelpCircle className="h-5 w-5 text-white" />
                                                    Guide d'intégration OBS Studio
                                                </span>
                                                <span className="text-xs text-muted-foreground bg-white/5 px-2.5 py-1 rounded-full hover:bg-white/10 transition-colors">
                                                    {showObsGuide ? 'Masquer' : 'Afficher'}
                                                </span>
                                            </button>

                                            {showObsGuide && (
                                                <div className="mt-6 border-t border-white/5 pt-6 space-y-5 text-muted-foreground text-sm leading-relaxed">
                                                    <div className="grid gap-6">
                                                        {[
                                                            {
                                                                step: 1,
                                                                title: 'Ajouter une source Navigateur',
                                                                text: 'Dans OBS Studio, faites un clic droit dans votre panneau de Sources, cliquez sur "Ajouter", puis sélectionnez "Navigateur".',
                                                            },
                                                            {
                                                                step: 2,
                                                                title: "Entrer l'URL de l'overlay",
                                                                text: 'Collez l\'URL de l\'overlay ci-dessus dans le champ "URL" des propriétés de la source.',
                                                            },
                                                            {
                                                                step: 3,
                                                                title: 'Définir les dimensions',
                                                                text: 'Configurez la Largeur sur 1920 et la Hauteur sur 1080 (ou adaptez-le à la résolution de votre écran) pour un positionnement optimal.',
                                                            },
                                                            {
                                                                step: 4,
                                                                title: "Contrôler l'audio",
                                                                text: 'Cochez la case "Contrôler l\'audio via OBS" afin de pouvoir gérer ou couper le son directement depuis votre mixeur audio OBS.',
                                                            },
                                                            {
                                                                step: 5,
                                                                title: 'Monitoring audio',
                                                                text: 'Dans le Mélangeur Audio d\'OBS, cliquez sur les options de la source > Propriétés audio avancées > réglez sur "Monitoring et sortie" pour entendre les alertes dans votre casque.',
                                                            },
                                                        ].map((item) => (
                                                            <div key={item.step} className="flex gap-4 items-start">
                                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white text-xs font-bold font-mono">
                                                                    {item.step}
                                                                </span>
                                                                <div className="space-y-0.5">
                                                                    <p className="text-sm font-bold text-foreground leading-snug">
                                                                        {item.title}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground leading-normal">
                                                                        {item.text}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* CSS personnalisation */}
                                                        <div className="flex gap-4 items-start pt-2">
                                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white text-xs font-bold font-mono">
                                                                6
                                                            </span>
                                                            <div className="flex-1 min-w-0 space-y-2">
                                                                <div>
                                                                    <p className="text-sm font-bold text-foreground leading-snug">
                                                                        Masquer le fond noir (CSS)
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground leading-normal">
                                                                        Collez la règle CSS suivante dans le champ "CSS
                                                                        personnalisé" d'OBS pour masquer le fond noir
                                                                        lorsque le chat est inactif :
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                                                                    <code className="flex-1 overflow-x-auto whitespace-pre font-mono rounded-lg bg-black/40 px-3 py-2 border border-white/5 text-xs">
                                                                        body:not(.livechat-overlay) &#123; display: none
                                                                        !important; &#125;
                                                                    </code>
                                                                    <button
                                                                        id="copy-css-btn"
                                                                        onClick={() =>
                                                                            copyToClipboard(
                                                                                'body:not(.livechat-overlay) { display: none !important; }',
                                                                                'copy-css-btn',
                                                                            )
                                                                        }
                                                                        className="shrink-0 rounded-lg border border-border px-4 py-2 text-xs font-semibold transition-colors hover:bg-white/5"
                                                                    >
                                                                        Copier
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
