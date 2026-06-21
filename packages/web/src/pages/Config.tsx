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
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ServerConfig {
    soundEnabled: boolean;
    soundType: string;
    soundVolume: number;
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
            // Accord majour arpégé (do-mi-sol) avec une cloche douce
            const freqs = [523.25, 659.25, 783.99]; // Do5, Mi5, Sol5
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
            // Bip-bip arcade, deux notes montantes nettes mais pas agressives
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
            // Son "succès" type jeu vidéo : deux notes ascendantes nettes et satisfaisantes
            const notes = [659.25, 987.77]; // Mi5 -> Si5 (quinte)
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
            // Son de notification type Discord : deux notes graves et chaudes, "dong" rond
            const notes = [466.16, 587.33]; // Si4 -> Ré5 (tierce mineure, plus grave et chaud)
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

    const [username, setUsername] = useState('');
    const [dbUsername, setDbUsername] = useState('');
    const [token, setToken] = useState('');
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

    // Sync URL guildId with selectedGuild state
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

    // Load server-specific settings from localStorage when guild changes
    useEffect(() => {
        if (selectedGuild) {
            const saved = localStorage.getItem(`livechat_settings_${selectedGuild.id}`);
            let loaded = DEFAULT_CONFIG;
            if (saved) {
                try {
                    loaded = JSON.parse(saved);
                } catch (_) {
                    loaded = DEFAULT_CONFIG;
                }
            }
            setServerConfig(loaded);
            setDraftConfig(loaded);
        }
    }, [selectedGuild]);

    // Check if configuration exists in the database
    useEffect(() => {
        const checkExistingConfig = async () => {
            if (!selectedGuild) {
                setHasExistingLink(null);
                return;
            }
            setCheckingLink(true);
            setError(null);
            try {
                const isLocal = window.location.hostname === 'localhost';
                const apiBase = isLocal ? 'http://localhost:3000' : 'https://livechat-api.nevylish.fr';
                const overlayBase = isLocal
                    ? 'http://localhost:4000/v2/overlay'
                    : 'https://livechat.nevylish.fr/v2/overlay.html';

                const response = await fetch(
                    `${apiBase}/api/config/get?guildId=${encodeURIComponent(selectedGuild.id)}`,
                );
                if (response.ok) {
                    const data = await response.json();
                    if (data.exists && data.token) {
                        setGeneratedLink(`${overlayBase}?token=${data.token}`);
                        setToken(data.token);
                        if (data.username) {
                            setUsername(data.username);
                            setDbUsername(data.username);
                        }
                        setHasExistingLink(true);
                    } else {
                        setGeneratedLink('');
                        setToken('');
                        setDbUsername('');
                        setHasExistingLink(false);
                    }
                } else {
                    setHasExistingLink(false);
                }
            } catch (err: any) {
                console.error(err);
                setError('Impossible de vérifier la configuration de ce serveur.');
                setHasExistingLink(false);
            } finally {
                setCheckingLink(false);
            }
        };

        checkExistingConfig();
    }, [selectedGuild]);

    const updateDraftConfig = <K extends keyof ServerConfig>(key: K, value: ServerConfig[K]) => {
        setDraftConfig((prev) => ({ ...prev, [key]: value }));
    };

    const handleSaveConfig = async () => {
        if (!selectedGuild) return;

        setError(null);
        setIsGenerating(true);

        try {
            // Save sound config to localStorage
            localStorage.setItem(`livechat_settings_${selectedGuild.id}`, JSON.stringify(draftConfig));
            setServerConfig(draftConfig);

            // Save username config to backend database if it changed
            if (username !== dbUsername) {
                if (!username || username.length < 4 || username.length > 25) {
                    throw new Error("Le nom d'utilisateur doit faire entre 4 et 25 caractères.");
                }

                const isLocal = window.location.hostname === 'localhost';
                const apiBase = isLocal ? 'http://localhost:3000' : 'https://livechat-api.nevylish.fr';

                const response = await fetch(`${apiBase}/api/config/save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,
                        guildId: selectedGuild.id,
                        token: token,
                    }),
                });

                if (!response.ok) {
                    throw new Error("Impossible d'enregistrer le nouveau pseudo.");
                }

                const data = await response.json();
                if (data.success) {
                    setDbUsername(username);
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

    const handlePlaySound = (type: string, volume: number) => {
        setIsPlayingSoundWave(true);
        playSynthSound(type, volume);
        setTimeout(() => setIsPlayingSoundWave(false), 800);
    };

    // Check Auth session
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

    // Load user's administrative guilds
    const loadGuilds = useCallback(
        async (force = false) => {
            if (!session) return;
            const providerToken = session.provider_token;
            if (!providerToken) {
                console.warn('No Discord provider token found in session.');
                return;
            }

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

                // Filter: Owner, Administrator (0x8) or Manage Guild (0x20)
                const adminGuilds = userGuilds.filter((g) => {
                    const perms = parseInt(g.permissions);
                    return g.owner || (perms & 0x8) === 0x8 || (perms & 0x20) === 0x20;
                });

                // Check bot status for each server on the backend
                const isLocal = window.location.hostname === 'localhost';
                const apiBase = isLocal ? 'http://localhost:3000' : 'https://livechat-api.nevylish.fr';

                const checkedGuilds = await Promise.all(
                    adminGuilds.map(async (g) => {
                        try {
                            const botRes = await fetch(`${apiBase}/api/guild/check?guildId=${g.id}`);
                            if (botRes.ok) {
                                const { hasBot } = await botRes.json();
                                return { ...g, hasBot };
                            }
                        } catch (_) {}
                        return { ...g, hasBot: false };
                    }),
                );

                // Sort: bot present first, then alphabetically
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
        [session],
    );

    useEffect(() => {
        if (session) {
            loadGuilds(false);
        }
    }, [session, loadGuilds]);

    useEffect(() => {
        if (session && user) {
            // Default pre-fill streamer username using Discord username if not set already
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

    const isLocal = window.location.hostname === 'localhost';
    const apiBase = isLocal ? 'http://localhost:3000' : 'https://livechat-api.nevylish.fr';
    const overlayBase = isLocal ? 'http://localhost:4000/v2/overlay' : 'https://livechat.nevylish.fr/v2/overlay.html';

    const handleCreateConfig = async () => {
        if (!selectedGuild) return;
        if (!username || username.length < 4 || username.length > 25) {
            setError("Le nom d'utilisateur doit faire entre 4 et 25 caractères.");
            return;
        }
        setError(null);
        setIsGenerating(true);

        try {
            const response = await fetch(`${apiBase}/api/config/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    guildId: selectedGuild.id,
                }),
            });

            if (!response.ok) {
                throw new Error("Impossible de créer la configuration de l'overlay.");
            }

            const data = await response.json();
            if (data.exists && data.token) {
                setToken(data.token);
                setDbUsername(username);
                setGeneratedLink(`${overlayBase}?token=${data.token}`);
                setHasExistingLink(true);
            }
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue lors de la création.');
        } finally {
            setIsGenerating(false);
        }
    };

    const regenerateLink = async () => {
        if (!selectedGuild || !username) return;
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
            const response = await fetch(`${apiBase}/api/config/regenerate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    guildId: selectedGuild.id,
                }),
            });

            if (!response.ok) {
                throw new Error('Impossible de régénérer la clé.');
            }

            const { token: newToken } = await response.json();
            setToken(newToken);
            setDbUsername(username);
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
                                            onClick={() => navigate('/config')}
                                            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white/3 hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                                            title="Retour à la liste des serveurs"
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
                                                Configuration de votre overlay
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
                                            <p className="text-xs text-muted-foreground">Selectionnez le serveur</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedGuild && hasExistingLink && (
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
                                )}
                                <button
                                    onClick={() => loadGuilds(true)}
                                    disabled={fetchingGuilds}
                                    title="Actualiser la liste des serveurs"
                                    className="flex h-9 items-center gap-2 rounded-lg border border-border bg-white/3 hover:bg-white/5 px-4 py-1.5 text-xs font-semibold text-muted-foreground transition-colors duration-200 disabled:opacity-50 hover:text-foreground"
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 ${fetchingGuilds ? 'animate-spin' : ''}`} />
                                    Actualiser
                                </button>
                                <button
                                    onClick={() => setVideoOpen(true)}
                                    className="flex h-9 items-center gap-2 rounded-lg border border-border bg-white/3 hover:bg-white/5 px-4 py-1.5 text-xs font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground"
                                >
                                    <Play className="h-3.5 w-3.5" />
                                    Tutoriel vidéo
                                </button>
                            </div>
                        </div>

                        {error && (
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
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className={`h-2 w-2 rounded-full ${g.hasBot ? 'bg-emerald-500' : 'bg-white/20'}`}
                                                                />
                                                                <span className="text-xs font-medium text-muted-foreground">
                                                                    {g.hasBot
                                                                        ? "Prêt pour l'intégration"
                                                                        : 'Bot Discord absent'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {!g.hasBot ? (
                                                        <a
                                                            href={`https://discord.com/oauth2/authorize?client_id=1379921658109890610&permissions=1049600&scope=bot&guild_id=${g.id}&disable_guild_select=true`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white hover:bg-white/90 px-4 py-2.5 text-sm font-bold text-black transition-opacity"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            Inviter le Bot
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    ) : (
                                                        <div className="mt-6 text-right">
                                                            <span className="text-xs font-semibold text-white group-hover:underline inline-flex items-center gap-1">
                                                                Configurer →
                                                            </span>
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
                                                    onClick={handleCreateConfig}
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
