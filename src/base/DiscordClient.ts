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

import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { Handlers } from './Handlers';
import { Logger } from '../utils/logger';
import Command from './Command';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { LiveChatServer } from './LiveChatServer';

export default class DiscordClient extends Client {
    public readonly commands: Collection<string, Command> = new Collection();
    public readonly isDevEnvironment: boolean = process.env.ENVIRONMENT === 'DEV';
    public livechat: LiveChatServer;

    constructor() {
        super({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildInvites],
            allowedMentions: {
                parse: ['users'],
                repliedUser: true,
            },
            partials: [Partials.Channel, Partials.User],
        });

        dotenv.config({ path: resolve(__dirname, '../../.env') });

        const token = process.env.TOKEN;
        if (!token) {
            Logger.error('Client', 'TOKEN is not defined in environment variables');
            process.exit(1);
        }

        this.initialize(token);
    }

    private async initialize(token: string): Promise<void> {
        Logger.log('Client', `Connecting to Discord...`);
        try {
            await this.login(token);
            Handlers.loadEventsListeners(this);
            await Handlers.loadCommands(this);

            this.livechat = new LiveChatServer();

            Logger.success('Client', ` Successfully connected to Discord !`);
        } catch (err) {
            Logger.error('Client', `Oops, connection to Discord failed:\n`, err);
            process.exit(1);
        }
    }
}
