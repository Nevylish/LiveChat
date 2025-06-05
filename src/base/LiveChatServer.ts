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

import express = require('express');
import path = require('path');
import { Logger } from '../utils/logger';
import { config } from '../utils/config';
import { createServer } from 'http';
import { Server } from 'socket.io';

export class LiveChatServer {
    public connectedStreamers: Map<string, { socketId: string; guildId: string }>;

    private app: express.Application;
    private httpServer;
    public io;
    private readonly port: number;

    constructor() {
        this.port = Number(config.livechatPort);
        this.app = express();
        this.httpServer = createServer(this.app);
        this.io = new Server(this.httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        this.connectedStreamers = new Map<string, { socketId: string; guildId: string }>();

        this.setupMiddlewares();
        this.setupRoutes();
        this.setupSocket();
        this.start();
    }

    private setupSocket(): void {
        this.io.on('connection', (socket) => {
            socket.on('register', (data: { username: string; guildId: string }) => {
                if (typeof data.username !== 'string' || data.username.length > 50) {
                    socket.disconnect();
                    return;
                }

                if (typeof data.guildId !== 'string' || data.guildId.length > 20) {
                    socket.disconnect();
                    return;
                }

                this.connectedStreamers.set(data.username, { socketId: socket.id, guildId: data.guildId });
                Logger.log('LiveChatServer', `${data.username} is now connected to LiveChat`);
            });

            socket.on('disconnect', () => {
                for (const [streamer, data] of this.connectedStreamers.entries()) {
                    if (data.socketId === socket.id) {
                        this.connectedStreamers.delete(streamer);
                        Logger.log('LiveChatServer', `${streamer} is no longer connected to LiveChat`);
                        //this.io.emit('streamersList', Array.from(this.connectedStreamers.keys()));
                    }
                }
            });
        });
    }

    private setupMiddlewares(): void {
        this.app.use(express.static(path.join(__dirname, '..', '..', 'dist', 'public')));
    }

    private setupRoutes(): void {
        this.app.get('/', (req, res) => {
            res.send(
                'LiveChat est prêt, ajoutez la source Navigateur sur OBS avec ce lien et changez la valeur PSEUDO par votre pseudo Twitch ainsi que la valeur ID_SERVEUR pour votre serveur Discord: http://livechat.nevylish.fr/overlay.html?username=PSEUDO&guildId=ID_SERVEUR',
            );
        });
    }

    private start(): void {
        this.httpServer.listen(this.port, () => {
            Logger.success(
                'LiveChatServer',
                `Server is running on port ${this.port} | ${Logger.COLORS.UNDERSCORE}${Logger.COLORS.MAGENTA}${config.livechatPort}${Logger.COLORS.RESET}`,
            );
        });
    }
}
