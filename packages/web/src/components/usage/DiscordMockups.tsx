import { Eye } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
    DISCORD_DEFAULT_AVATAR,
    DISCORD_MOCKUP_FALLBACK_USERNAME,
    getDiscordAvatarUrl,
    getDiscordDisplayName,
} from '../../lib/discord';
import VideoModal from '../VideoModal';
import DiscordDemo from './DiscordDemo';
import { useDiscordTheme } from './discordTheme';

const BOT_AVATAR = '/assets/ico/android-chrome-512x512.png';
const EMBED_GREEN = '#75ff7a';
const RICKROLL_VIDEO_ID = 'dQw4w9WgXcQ';

function useCommandInvoker(): { user: string; avatar: string } {
    const { user, authLoading } = useAuth();

    if (authLoading || !user) {
        return { user: DISCORD_MOCKUP_FALLBACK_USERNAME, avatar: DISCORD_DEFAULT_AVATAR };
    }

    return {
        user: getDiscordDisplayName(user),
        avatar: getDiscordAvatarUrl(user),
    };
}

/** Discord verified-app badge: checkmark + APP in one pill (official layout). */
function VerifiedAppTag() {
    return (
        <span
            className="inline-flex h-[15px] shrink-0 items-center gap-px rounded-[3px] bg-[#5865f2] pl-[3px] pr-[4px] text-[10px] font-bold uppercase leading-none tracking-wide text-white"
            aria-label="Application vérifiée"
        >
            <svg className="h-[10px] w-[10px] shrink-0" viewBox="0 0 16 16" aria-hidden="true">
                <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.25 8.25 6.25 11.25 12.75 4.75"
                />
            </svg>
            <span className="pb-px leading-none">App</span>
        </span>
    );
}

/** The "@member used command" context line shown above a slash-command reply. */
function SlashCommandHeader({ user, avatar, command }: { user: string; avatar: string; command: string }) {
    const theme = useDiscordTheme();

    return (
        <div className="mb-1 flex items-center gap-1.5 text-[13px]" style={{ color: theme.textMuted }}>
            <svg
                className="h-3.5 w-4 shrink-0"
                style={{ color: theme.slashIcon }}
                viewBox="0 0 16 14"
                fill="none"
                aria-hidden="true"
            >
                <path
                    d="M2 13V5a2 2 0 0 1 2-2h9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                />
            </svg>
            <img src={avatar} alt="" className="h-4 w-4 rounded-full object-cover" />
            <span className="font-medium" style={{ color: theme.slashUsername }}>
                {user}
            </span>
            <span>a utilisé</span>
            <span
                className="rounded-[3px] px-1 py-0.5 font-medium"
                style={{
                    color: theme.link,
                    backgroundColor: `color-mix(in srgb, ${theme.link} 12%, transparent)`,
                }}
            >
                {command}
            </span>
        </div>
    );
}

interface BotMessageProps {
    command?: { user: string; avatar: string; command: string };
    timestamp?: string;
    ephemeral?: boolean;
    children: ReactNode;
}

/** A single bot message with avatar, verified APP tag and optional ephemeral footer. */
function BotMessage({
    command,
    timestamp = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    ephemeral = false,
    children,
}: BotMessageProps) {
    const theme = useDiscordTheme();

    return (
        <div className="px-4 py-1.5">
            {command && <SlashCommandHeader {...command} />}
            <div className="flex gap-3">
                <img src={BOT_AVATAR} alt="" className="mt-0.5 h-10 w-10 shrink-0 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                        <span className="text-[15px] font-medium" style={{ color: theme.botName }}>
                            LiveChat
                        </span>
                        <VerifiedAppTag />
                        <span className="ml-1 text-xs" style={{ color: theme.textMuted }}>
                            {timestamp}
                        </span>
                    </div>
                    <div className="mt-0.5">{children}</div>
                    {ephemeral && (
                        <p className="mt-2.5 flex items-center gap-1.5 text-xs" style={{ color: theme.textMuted }}>
                            <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>
                                Toi seul(e) peux voir celui-ci —{' '}
                                <span className="cursor-default" style={{ color: theme.link }}>
                                    Rejeter le message
                                </span>
                            </span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

interface LiveChatEmbedProps {
    streamerUsername?: string;
    fileType?: string;
    version?: string;
    lastUpdated?: string;
}

/** Success embed sent after /livechat lancer-url (matches the real bot output). */
function LiveChatEmbed({
    streamerUsername = 'noobmaster69',
    fileType = 'Vidéo TikTok',
    version = '2.0.0',
    lastUpdated = '22/06/2026',
}: LiveChatEmbedProps) {
    const theme = useDiscordTheme();
    const [videoOpen, setVideoOpen] = useState(false);
    const handleCloseVideo = useCallback(() => setVideoOpen(false), []);

    return (
        <>
            <div
                className="w-full min-w-0 max-w-[432px] rounded-[4px] border sm:w-fit"
                style={{
                    backgroundColor: theme.embedBg,
                    borderColor: theme.elementBorder,
                    borderLeft: `4px solid ${EMBED_GREEN}`,
                }}
            >
                <div className="space-y-2 px-3 py-2.5">
                    <p
                        className="text-[15px] font-semibold leading-snug break-words"
                        style={{ color: theme.embedTitle }}
                    >
                        LiveChat envoyé sur le stream de {streamerUsername}
                    </p>
                    <p className="text-sm leading-relaxed break-words" style={{ color: theme.embedBody }}>
                        Type de fichier:{' '}
                        <strong className="font-semibold" style={{ color: theme.embedTitle }}>
                            {fileType}
                        </strong>
                    </p>
                    <p className="text-sm font-medium leading-relaxed">
                        <button
                            type="button"
                            onClick={() => setVideoOpen(true)}
                            className="inline border-0 bg-transparent p-0 text-left text-sm font-medium"
                        >
                            <span style={{ color: theme.embedArrow }}>➜ </span>
                            <span className="hover:underline" style={{ color: theme.link }}>
                                Rejoindre le stream de {streamerUsername}
                            </span>
                        </button>
                    </p>
                    <p className="text-xs" style={{ color: theme.link }}>
                        <Link to="/config" className="font-medium hover:underline">
                            Ajouter LiveChat
                        </Link>
                        <span className="mx-1.5" style={{ color: theme.textMuted }}>
                            •
                        </span>
                        <Link to="/updates" className="font-medium hover:underline">
                            Voir les patch notes
                        </Link>
                    </p>
                    <p className="text-[11px]" style={{ color: theme.textMuted }}>
                        LiveChat v{version} - Dernière mise à jour: {lastUpdated}
                    </p>
                </div>
            </div>
            <VideoModal
                open={videoOpen}
                onClose={handleCloseVideo}
                videoId={RICKROLL_VIDEO_ID}
                title={`Stream de ${streamerUsername}`}
            />
        </>
    );
}

const SKIP_SUCCESS_BG = '#154B34';
const SKIP_SUCCESS_TEXT = 'rgba(255, 255, 255, 0.88)';
const ENDED_TEXT_ALPHA = 0.42;
const ENDED_BG_ALPHA = 0.38;

function hexAlpha(hex: string, alpha: number): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Matches server `Functions.formatDurationMs` (e.g. 72000 → "01m12s"). */
function formatDurationMs(ms: number): string {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    let res = '';
    if (hours > 0) {
        if (minutes === 0 && seconds === 0) {
            return `${hours < 10 ? '0' : ''}${hours}h00m00s`;
        }
        res += `${hours < 10 ? '0' : ''}${hours}h`;
    }

    if (minutes > 0) {
        if (seconds === 0) {
            return `${res}${minutes < 10 ? '0' : ''}${minutes}m00s`;
        }
        res += `${minutes < 10 ? '0' : ''}${minutes}m`;
    }

    return `${res}${seconds < 10 ? '0' : ''}${seconds}s`;
}

type SkipButtonState = 'active' | 'skipped' | 'ended';

/** Discord secondary button (used for the skip action). */
function SkipButton({ initialDurationMs = 72_000 }: { initialDurationMs?: number }) {
    const theme = useDiscordTheme();
    const [state, setState] = useState<SkipButtonState>('active');
    const [remainingMs, setRemainingMs] = useState(initialDurationMs);

    useEffect(() => {
        if (state !== 'active') return;

        const interval = setInterval(() => {
            setRemainingMs((prev) => {
                const next = prev - 1000;
                if (next <= 0) {
                    setState('ended');
                    return 0;
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [state]);

    const displayMs = Math.ceil(remainingMs / 1000) * 1000;
    const label =
        state === 'skipped'
            ? 'Vous avez passé ce LiveChat.'
            : state === 'ended'
              ? 'Le LiveChat est terminé.'
              : `Passer le LiveChat (${formatDurationMs(displayMs)})`;

    const isDarkButton = theme.buttonBg.toLowerCase() === '#2a2b3a';
    const endedText = isDarkButton
        ? `rgba(255, 255, 255, ${ENDED_TEXT_ALPHA})`
        : hexAlpha(theme.buttonText, ENDED_TEXT_ALPHA);

    const buttonStyle =
        state === 'skipped'
            ? {
                  backgroundColor: SKIP_SUCCESS_BG,
                  borderColor: SKIP_SUCCESS_BG,
                  color: SKIP_SUCCESS_TEXT,
              }
            : state === 'ended'
              ? {
                    backgroundColor: hexAlpha(theme.buttonBg, ENDED_BG_ALPHA),
                    borderColor: hexAlpha(theme.elementBorder, ENDED_BG_ALPHA),
                    color: endedText,
                }
              : {
                    backgroundColor: theme.buttonBg,
                    borderColor: theme.elementBorder,
                    color: theme.buttonText,
                };

    return (
        <div className="mt-2 flex flex-wrap gap-2">
            <button
                type="button"
                disabled={state !== 'active'}
                onClick={() => setState('skipped')}
                className="cursor-default rounded-[8px] border px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-default"
                style={buttonStyle}
                onMouseEnter={(e) => {
                    if (state !== 'active') return;
                    e.currentTarget.style.backgroundColor = theme.buttonBgHover;
                }}
                onMouseLeave={(e) => {
                    if (state !== 'active') return;
                    e.currentTarget.style.backgroundColor = theme.buttonBg;
                }}
            >
                {label}
            </button>
        </div>
    );
}

/**
 * Full flow: a member runs /livechat lancer-url and the bot replies with the
 * success embed plus the interactive "Passer le LiveChat" button.
 */
export function CommandFlowMockup() {
    const invoker = useCommandInvoker();

    return (
        <DiscordDemo>
            <BotMessage
                command={{ user: invoker.user, avatar: invoker.avatar, command: '/livechat lancer-url' }}
                ephemeral
            >
                <LiveChatEmbed />
                <SkipButton initialDurationMs={72_000} />
            </BotMessage>
        </DiscordDemo>
    );
}

/** Plain bot text response (other commands). */
function BotResponse({ children }: { children: ReactNode }) {
    const theme = useDiscordTheme();

    return (
        <p className="text-[15px] leading-relaxed" style={{ color: theme.textSecondary }}>
            {children}
        </p>
    );
}

/** A single slash command and a short text response (other commands). */
export function CommandMockup({ command, response }: { command: string; response: string }) {
    const invoker = useCommandInvoker();

    return (
        <DiscordDemo>
            <BotMessage command={{ user: invoker.user, avatar: invoker.avatar, command }}>
                <BotResponse>{response}</BotResponse>
            </BotMessage>
        </DiscordDemo>
    );
}
