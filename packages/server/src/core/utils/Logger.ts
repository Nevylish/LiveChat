import fetch from 'node-fetch';
import { Functions } from './Functions';

export namespace Logger {
    export enum LogLevel {
        DEBUG,
        INFO,
        SUCCESS,
        WARN,
        ERROR,
    }

    interface WebhookMessage {
        level: LogLevel;
        source: string;
        message: string;
        context?: Record<string, any>;
        timestamp: Date;
    }

    let webhookUrl: string | null = null;
    const webhookBuffer: WebhookMessage[] = [];
    let isFlushing = false;

    const FLUSH_INTERVAL = 5_000;
    const MAX_BUFFER_SIZE = 100;
    const WEBHOOK_MIN_LEVEL = LogLevel.SUCCESS;

    export const init = (options?: { webhookUrl?: string }): void => {
        if (options?.webhookUrl) {
            webhookUrl = options.webhookUrl;
            const timer = setInterval(() => void flushWebhook(), FLUSH_INTERVAL);
            timer.unref();

            const graceful = async () => {
                await flushWebhook();
                process.exit(0);
            };
            process.on('SIGINT', graceful);
            process.on('SIGTERM', graceful);

            debug('Logger', 'Webhook Discord enabled');
        }
    };

    const COLORS = {
        RESET: '\x1b[0m',
        REVERSE: '\x1b[7m',
        UNDERSCORE: '\x1b[4m',
        BRIGHT: '\x1b[1m',
        GREY: '\x1b[90m',
        RED: '\x1b[31m',
        YELLOW: '\x1b[33m',
        GREEN: '\x1b[32m',
        CYAN: '\x1b[36m',
        MAGENTA: '\x1b[35m',
    };

    const getTimestamp = (timestamp: Date = new Date()): string => {
        return timestamp.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatMessage = (level: LogLevel, message: string): string => {
        const levelColor = getLevelColor(level);
        return `${levelColor}[${getTimestamp()}]${COLORS.RESET}${level === LogLevel.ERROR ? COLORS.RED : ''} • ${level === LogLevel.ERROR ? '' : COLORS.CYAN}${message}${COLORS.RESET} →`;
    };

    const getLevelColor = (level: LogLevel): string => {
        switch (level) {
            case LogLevel.DEBUG:
                return COLORS.GREY;
            case LogLevel.INFO:
                return COLORS.RESET;
            case LogLevel.SUCCESS:
                return COLORS.GREEN;
            case LogLevel.WARN:
                return COLORS.YELLOW;
            case LogLevel.ERROR:
                return `${COLORS.REVERSE}${COLORS.RED}`;
        }
    };

    const getLevelEmoji = (level: LogLevel): string => {
        switch (level) {
            case LogLevel.DEBUG:
                return '⚪';
            case LogLevel.INFO:
                return '🔵';
            case LogLevel.SUCCESS:
                return '🟢';
            case LogLevel.WARN:
                return '🟡';
            case LogLevel.ERROR:
                return '🔴';
        }
    };

    const formatWebhookMessage = (msg: WebhookMessage): string => {
        const emoji = getLevelEmoji(msg.level);
        const message = Functions.escapeMarkdown(msg.message);
        let line = `[${getTimestamp(msg.timestamp)}] \ ${emoji} \ **${msg.source} →** ${message}`;

        if (msg.context && Object.keys(msg.context).length > 0) {
            const ctx = Object.entries(msg.context)
                .map(([key, value]) => Functions.escapeMarkdown(`${key}: ${value}`))
                .join('\n\> ');
            line += `\n\> ${ctx}`;
        }

        return line;
    };

    const parseArgs = (args: any[]): { message: string; context?: Record<string, any> } => {
        const parts: string[] = [];
        let context: Record<string, any> | undefined;

        for (const arg of args) {
            if (arg instanceof Error) {
                parts.push(arg.message);
            } else if (typeof arg === 'object' && arg !== null) {
                context = { ...context, ...arg };
            } else if (arg !== undefined && arg !== null) {
                parts.push(String(arg));
            }
        }

        return { message: parts.join(' '), context };
    };

    const queueWebhook = (level: LogLevel, source: string, args: any[]): void => {
        if (!webhookUrl || level < WEBHOOK_MIN_LEVEL) return;

        const { message, context } = parseArgs(args);

        webhookBuffer.push({
            level,
            source,
            message: message || '(aucun message)',
            context,
            timestamp: new Date(),
        });

        while (webhookBuffer.length > MAX_BUFFER_SIZE) {
            webhookBuffer.shift();
        }
    };

    const flushWebhook = async (): Promise<void> => {
        if (!webhookUrl || webhookBuffer.length === 0 || isFlushing) return;
        isFlushing = true;

        try {
            const messages = webhookBuffer.splice(0, 10);
            const content = messages.map(formatWebhookMessage).join('\n');

            const response = await fetch(webhookUrl!, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: content.substring(0, 2000) }),
            });

            if (response.status === 429) {
                webhookBuffer.unshift(...messages);
            }
        } catch {
        } finally {
            isFlushing = false;
        }
    };

    let minLogLevel: LogLevel = LogLevel.DEBUG;

    const MAX_DEV_LOG_BUFFER = 500;
    let devLogId = 0;
    const devLogBuffer: DevLogRecord[] = [];
    const devLogListeners = new Set<(entry: DevLogRecord) => void>();

    type DevLogLevelName = 'debug' | 'info' | 'success' | 'warn' | 'error';

    interface DevLogRecord {
        id: number;
        level: DevLogLevelName;
        source: string;
        message: string;
        context?: Record<string, unknown>;
        timestamp: string;
    }

    const logLevelName = (level: LogLevel): DevLogLevelName => {
        switch (level) {
            case LogLevel.DEBUG:
                return 'debug';
            case LogLevel.INFO:
                return 'info';
            case LogLevel.SUCCESS:
                return 'success';
            case LogLevel.WARN:
                return 'warn';
            case LogLevel.ERROR:
                return 'error';
        }
    };

    const recordDevLog = (level: LogLevel, source: string, args: any[]): void => {
        if (level < minLogLevel) return;

        const { message, context } = parseArgs(args);
        const entry: DevLogRecord = {
            id: ++devLogId,
            level: logLevelName(level),
            source,
            message: message || '(aucun message)',
            context: context && Object.keys(context).length > 0 ? context : undefined,
            timestamp: new Date().toISOString(),
        };

        devLogBuffer.push(entry);
        while (devLogBuffer.length > MAX_DEV_LOG_BUFFER) {
            devLogBuffer.shift();
        }

        for (const listener of devLogListeners) {
            listener(entry);
        }
    };

    export const getDevLogs = (after = 0): DevLogRecord[] => {
        return devLogBuffer.filter((entry) => entry.id > after);
    };

    export const subscribeDevLog = (listener: (entry: DevLogRecord) => void): (() => void) => {
        devLogListeners.add(listener);
        return () => {
            devLogListeners.delete(listener);
        };
    };

    export const clearDevLogs = (): void => {
        devLogBuffer.length = 0;
    };

    const shouldLog = (level: LogLevel): boolean => {
        return level >= minLogLevel;
    };

    export const log = (source: string, message: string, ...optionalParams: any[]): void => {
        if (shouldLog(LogLevel.INFO)) {
            console.log(formatMessage(LogLevel.INFO, source), message, ...optionalParams);
        }
        recordDevLog(LogLevel.INFO, source, [message, ...optionalParams]);
        queueWebhook(LogLevel.INFO, source, [message, ...optionalParams]);
    };

    export const error = (source: string, message: string, ...optionalParams: any[]): void => {
        if (shouldLog(LogLevel.ERROR)) {
            console.error(formatMessage(LogLevel.ERROR, source), message, ...optionalParams);
        }
        recordDevLog(LogLevel.ERROR, source, [message, ...optionalParams]);
        queueWebhook(LogLevel.ERROR, source, [message, ...optionalParams]);
    };

    export const warn = (source: string, message: string, ...optionalParams: any[]): void => {
        if (shouldLog(LogLevel.WARN)) {
            console.warn(formatMessage(LogLevel.WARN, source), message, ...optionalParams);
        }
        recordDevLog(LogLevel.WARN, source, [message, ...optionalParams]);
        queueWebhook(LogLevel.WARN, source, [message, ...optionalParams]);
    };

    export const success = (source: string, message: string, ...optionalParams: any[]): void => {
        if (shouldLog(LogLevel.SUCCESS)) {
            console.log(formatMessage(LogLevel.SUCCESS, source), message, ...optionalParams);
        }
        recordDevLog(LogLevel.SUCCESS, source, [message, ...optionalParams]);
        queueWebhook(LogLevel.SUCCESS, source, [message, ...optionalParams]);
    };

    export const debug = (source: string, message: string, ...optionalParams: any[]): void => {
        if (shouldLog(LogLevel.DEBUG)) {
            console.log(formatMessage(LogLevel.DEBUG, source), message, ...optionalParams);
        }
        recordDevLog(LogLevel.DEBUG, source, [message, ...optionalParams]);
        queueWebhook(LogLevel.DEBUG, source, [message, ...optionalParams]);
    };
}
