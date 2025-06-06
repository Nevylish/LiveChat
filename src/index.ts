/*
 * Copyright (C) 2025 LiveChat by Nevylish
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
import DiscordClient from './core/DiscordClient';
import { Logger } from './core/modules/Logger';

/* Vérification des variables d'environements parce que je les oublie toujours */
dotenv.config({ path: resolve(__dirname, '../.env') });

const requiredEnvVars = ['LIVECHAT_PORT', 'TOKEN'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
    Logger.error('Index', `Missing environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}

/* Une fois démarré, DiscordClient lance le serveur web */
new DiscordClient();
