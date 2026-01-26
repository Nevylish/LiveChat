import * as dotenv from 'dotenv';
import { resolve } from 'path';
import DiscordClient from './core/DiscordClient';
import { Logger } from './core/utils/Logger';

dotenv.config({ path: resolve(__dirname, '../.env') });

// Vérification des variables d'environnement
const requiredEnvVars = ['LIVECHAT_PORT', 'TOKEN', 'TENOR_API_KEY', 'SECRET_API'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
    Logger.error('Index', `Missing environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}

// Lancer le bot Discord. Une fois démarré, il lancera le serveur web.
new DiscordClient();
