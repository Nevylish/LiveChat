import * as dotenv from 'dotenv';
import { resolve } from 'path';
import DiscordClient from './core/DiscordClient';
import { Logger } from './core/utils/Logger';

dotenv.config({ path: resolve(__dirname, '../.env') });

const requiredEnvVars = ['LIVECHAT_PORT', 'TOKEN', 'DOMAIN'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
    Logger.error('Index', `Missing environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}

new DiscordClient();
