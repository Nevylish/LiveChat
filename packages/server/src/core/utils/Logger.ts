export namespace Logger {
    export enum LogLevel {
        DEBUG,
        INFO,
        SUCCESS,
        WARN,
        ERROR,
    }

    export const COLORS = {
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

    const formatMessage = (level: LogLevel, message: string): string => {
        const timestamp = new Date().toLocaleTimeString();
        const levelColor = getLevelColor(level);
        return `${levelColor}[${timestamp}]${COLORS.RESET}${level === LogLevel.ERROR ? COLORS.RED : ''} • ${level === LogLevel.ERROR ? '' : COLORS.CYAN}${message}${COLORS.RESET} →`;
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

    let minLogLevel: LogLevel = LogLevel.INFO;

    export const setMinLogLevel = (level: LogLevel): void => {
        minLogLevel = level;
        debug('Logger', 'Level set to ' + level);
    };

    const shouldLog = (level: LogLevel): boolean => {
        return level >= minLogLevel;
    };

    export const log = (message: string, ...optionalParams: any[]): void => {
        if (shouldLog(LogLevel.INFO)) {
            console.log(formatMessage(LogLevel.INFO, message), ...optionalParams);
        }
    };

    export const error = (message: string, ...optionalParams: any[]): void => {
        if (shouldLog(LogLevel.ERROR)) {
            console.log(formatMessage(LogLevel.ERROR, message), ...optionalParams);
        }
    };

    export const warn = (message: string, ...optionalParams: any[]): void => {
        if (shouldLog(LogLevel.WARN)) {
            console.log(formatMessage(LogLevel.WARN, message), ...optionalParams);
        }
    };

    export const success = (message: string, ...optionalParams: any[]): void => {
        if (shouldLog(LogLevel.SUCCESS)) {
            console.log(formatMessage(LogLevel.SUCCESS, message), ...optionalParams);
        }
    };

    export const debug = (message: string, ...optionalParams: any[]): void => {
        if (shouldLog(LogLevel.DEBUG)) {
            console.log(formatMessage(LogLevel.DEBUG, message), ...optionalParams);
        }
    };
}
