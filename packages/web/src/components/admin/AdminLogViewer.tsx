import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DevLogEntry, DevLogLevel } from '@livechat/types';
import { Loader2, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clearDevLogs, connectDevLogsStream, fetchDevLogs } from '../../api/devApi';
import { getErrorMessage } from '../../lib/errors';

const MAX_DISPLAYED_LOGS = 500;

const ALL_LOG_LEVELS: DevLogLevel[] = ['debug', 'info', 'success', 'warn', 'error'];

const LEVEL_LABELS: Record<DevLogLevel, string> = {
    debug: 'Debug',
    info: 'Info',
    success: 'Success',
    warn: 'Warn',
    error: 'Error',
};

const LEVEL_STYLES: Record<DevLogLevel, string> = {
    debug: 'text-muted-foreground',
    info: 'text-foreground',
    success: 'text-green-600 dark:text-green-500',
    warn: 'text-yellow-600 dark:text-yellow-500',
    error: 'text-destructive',
};

const LEVEL_FILTER_ACTIVE: Record<DevLogLevel, string> = {
    debug: 'border-muted-foreground/50 bg-muted text-muted-foreground',
    info: 'border-border bg-secondary text-foreground',
    success: 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-500',
    warn: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-500',
    error: 'border-destructive/50 bg-destructive/10 text-destructive',
};

const LEVEL_FILTER_INACTIVE = 'border-border bg-transparent text-muted-foreground opacity-50';

function formatLogTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

function formatContext(context: Record<string, unknown>): string {
    try {
        return JSON.stringify(context);
    } catch {
        return String(context);
    }
}

interface AdminLogViewerProps {
    accessToken: string;
    active: boolean;
    onError?: (message: string) => void;
}

export default function AdminLogViewer({ accessToken, active, onError }: AdminLogViewerProps) {
    const [logs, setLogs] = useState<DevLogEntry[]>([]);
    const [connected, setConnected] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const [enabledLevels, setEnabledLevels] = useState<Set<DevLogLevel>>(() => new Set(ALL_LOG_LEVELS));

    const containerRef = useRef<HTMLDivElement>(null);
    const lastLogIdRef = useRef(0);

    const filteredLogs = useMemo(() => logs.filter((entry) => enabledLevels.has(entry.level)), [logs, enabledLevels]);

    const toggleLevel = (level: DevLogLevel) => {
        setEnabledLevels((prev) => {
            const next = new Set(prev);
            if (next.has(level)) {
                next.delete(level);
            } else {
                next.add(level);
            }
            return next;
        });
    };

    const showAllLevels = () => setEnabledLevels(new Set(ALL_LOG_LEVELS));

    const appendLog = useCallback((entry: DevLogEntry) => {
        if (entry.id <= lastLogIdRef.current) return;
        lastLogIdRef.current = entry.id;
        setLogs((prev) => {
            const next = [...prev, entry];
            if (next.length > MAX_DISPLAYED_LOGS) {
                return next.slice(next.length - MAX_DISPLAYED_LOGS);
            }
            return next;
        });
    }, []);

    useEffect(() => {
        if (!active) {
            setConnected(false);
            return;
        }

        let cancelled = false;
        let disconnectStream: (() => void) | undefined;

        const start = async () => {
            try {
                const initial = await fetchDevLogs(accessToken, lastLogIdRef.current);
                if (cancelled) return;

                for (const entry of initial.logs) {
                    appendLog(entry);
                }

                disconnectStream = connectDevLogsStream(accessToken, {
                    after: lastLogIdRef.current,
                    onLog: (entry) => {
                        if (!cancelled) {
                            setConnected(true);
                            appendLog(entry);
                        }
                    },
                    onError: (err) => {
                        if (!cancelled) {
                            setConnected(false);
                            onError?.(getErrorMessage(err, 'Flux de logs interrompu.'));
                        }
                    },
                    onDisconnect: () => {
                        if (!cancelled) setConnected(false);
                    },
                });

                if (!cancelled) setConnected(true);
            } catch (err) {
                if (!cancelled) {
                    setConnected(false);
                    onError?.(getErrorMessage(err, 'Impossible de charger les logs.'));
                }
            }
        };

        void start();

        return () => {
            cancelled = true;
            disconnectStream?.();
            setConnected(false);
        };
    }, [accessToken, active, appendLog, onError]);

    useEffect(() => {
        if (!autoScroll || !containerRef.current) return;
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }, [filteredLogs, autoScroll]);

    const handleScroll = () => {
        const el = containerRef.current;
        if (!el) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
        setAutoScroll(atBottom);
    };

    const handleClear = async () => {
        if (!window.confirm('Effacer les logs affichés côté serveur ?')) return;

        setClearing(true);
        try {
            await clearDevLogs(accessToken);
            lastLogIdRef.current = 0;
            setLogs([]);
            setAutoScroll(true);
        } catch (err) {
            onError?.(getErrorMessage(err, 'Impossible de vider les logs.'));
        } finally {
            setClearing(false);
        }
    };

    const allLevelsEnabled = enabledLevels.size === ALL_LOG_LEVELS.length;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    {connected ? 'Flux en direct' : 'Connexion au flux…'}
                    {logs.length > 0 ? (
                        <>
                            {' '}
                            · {filteredLogs.length}
                            {!allLevelsEnabled ? ` / ${logs.length}` : ''} entrée
                            {filteredLogs.length > 1 ? 's' : ''}
                        </>
                    ) : null}
                </p>
                <Button variant="outline" size="sm" onClick={() => void handleClear()} disabled={clearing}>
                    {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Vider
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {ALL_LOG_LEVELS.map((level) => {
                    const active = enabledLevels.has(level);
                    return (
                        <button
                            key={level}
                            type="button"
                            onClick={() => toggleLevel(level)}
                            className={cn(
                                'rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors',
                                active ? LEVEL_FILTER_ACTIVE[level] : LEVEL_FILTER_INACTIVE,
                            )}
                            aria-pressed={active}
                        >
                            {LEVEL_LABELS[level]}
                        </button>
                    );
                })}
                {!allLevelsEnabled ? (
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={showAllLevels}>
                        Tout afficher
                    </Button>
                ) : null}
            </div>

            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="h-[min(28rem,60vh)] overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed"
            >
                {logs.length === 0 ? (
                    <p className="text-muted-foreground">En attente de logs…</p>
                ) : filteredLogs.length === 0 ? (
                    <p className="text-muted-foreground">Aucun log pour les filtres sélectionnés.</p>
                ) : (
                    <ul className="space-y-1">
                        {filteredLogs.map((entry) => (
                            <li key={entry.id} className="break-words">
                                <span className="text-muted-foreground">{formatLogTime(entry.timestamp)}</span>{' '}
                                <span className={cn('uppercase', LEVEL_STYLES[entry.level])}>{entry.level}</span>{' '}
                                <span className="text-cyan-700 dark:text-cyan-400">{entry.source}</span>
                                <span className="text-muted-foreground"> → </span>
                                <span className={LEVEL_STYLES[entry.level]}>{entry.message}</span>
                                {entry.context ? (
                                    <span className="mt-0.5 block pl-4 text-muted-foreground">
                                        {formatContext(entry.context)}
                                    </span>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {!autoScroll ? <p className="text-xs text-muted-foreground">Défilement automatique en pause.</p> : null}
        </div>
    );
}
