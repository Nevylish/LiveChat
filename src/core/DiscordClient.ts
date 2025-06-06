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
import { Handlers } from './modules/Handlers';
import { Logger } from './modules/Logger';
import Command from './commands/Command';
import { LiveChatServer } from './LiveChatServer';

export default class DiscordClient extends Client {
    public readonly commands: Collection<string, Command> = new Collection();
    public livechat: LiveChatServer;

    constructor() {
        super({
            intents: [GatewayIntentBits.Guilds],
            allowedMentions: {
                parse: ['users'],
                repliedUser: true,
            },
            partials: [Partials.Channel, Partials.User],
        });

        const token = process.env.TOKEN;
        if (!token) {
            Logger.error('Client', 'TOKEN is not defined in environment variables');
            process.exit(1);
        }

        this.start(token);
    }

    public updateActivity(connectedStreamersSize?: number): void {
        this.user?.setActivity(
            connectedStreamersSize
                ? `/livechat | ${connectedStreamersSize.toString() ?? '0'} streameur${connectedStreamersSize > 1 ? 's' : ''} utilise${connectedStreamersSize > 1 ? 'nt' : ''} LiveChat en ce moment.`
                : '/livechat | livechat.nevylish.fr',
            { type: 3 },
        );
    }

    private async start(token: string): Promise<void> {
        Logger.log('Client', `Connecting to Discord...`);
        try {
            await this.login(token);
            Handlers.setupEventsListeners(this);
            await Handlers.setupCommands(this);

            this.livechat = new LiveChatServer(this);

            Logger.success('Client', `Successfully connected to Discord !`);
        } catch (err) {
            Logger.error('Client', `Oops, connection to Discord failed:\n`, err);
            process.exit(1);
        }
    }
}
