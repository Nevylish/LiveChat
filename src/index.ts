/*
    Ce fichier est le fichier de lancement, il défini où se trouvent les variables d'environnement, là où sont stockées les informations importantes et secrètes.
    Il vérifie aussi que toutes les variables sont présentes et lance le bot Discord qui initialisera tout le reste.
    S'il manque le Token (le mot de passe du bot Discord), inutile d'aller plus loin.
*/

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import DiscordClient from './core/DiscordClient';
import { Logger } from './core/utils/Logger';

dotenv.config({ path: resolve(__dirname, '../.env') });

const requiredEnvVars = ['LIVECHAT_PORT', 'TOKEN', 'TENOR_API_KEY', 'GIPHY_API_KEY', 'SECRET_API', 'DOMAIN'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
    Logger.error('Index', `Missing environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}

new DiscordClient();
