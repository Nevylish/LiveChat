import * as dotenv from 'dotenv';
import { resolve } from 'path';
import DiscordClient from './core/DiscordClient';
import { Logger } from './core/utils/Logger';
import { ProxyService } from './core/utils/ProxyService';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

const requiredEnvVars = [
    'DOMAIN',
    'FRONTEND_URI',
    'OVERLAY_URI',
    'OVERLAY_SECRET',
    'LIVECHAT_PORT',
    'TOKEN',
    'DISCORD_WEBHOOK_LOGS',
    'GIPHY_API_KEY',
    'SKU_PLUS_ID',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'PROXY_SECRET',
    'PROXY_URL',
    'AUTH_JWT_SECRET',
    'VITE_DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
    Logger.error('Index', `Missing environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}

ProxyService.generateRandomSecretAndStore();

Logger.init({ webhookUrl: process.env.DISCORD_WEBHOOK_LOGS });

new DiscordClient();
