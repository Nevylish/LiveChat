/*
 * Finally, use uppercase letters for your channel names.
 * Copyright (C) 2025 UpperCase Bot by Nevylish
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
