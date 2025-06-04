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

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { Logger } from './logger';

// Load .env for dev mode
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: resolve(__dirname, '../../.env') });
}

// Validate required environment variables
const requiredEnvVars = ['TOKEN'] as const;
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    Logger.error('Config', `Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

// Validate and sanitize environment variables
const validateEnvVar = (name: string, value: string | undefined, defaultValue?: string): string => {
    if (!value && !defaultValue) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value || defaultValue!;
};

// Export validated environment variables
export const config = {
    token: validateEnvVar('TOKEN', process.env.TOKEN),
    environment: validateEnvVar('ENVIRONMENT', process.env.ENVIRONMENT, 'DEV'),
    webhookUrl: validateEnvVar('WEBHOOK_URL', process.env.WEBHOOK_URL, ''),
    livechatPort: validateEnvVar('LIVECHAT_PORT', process.env.LIVECHAT_PORT, '3000'),
} as const;
