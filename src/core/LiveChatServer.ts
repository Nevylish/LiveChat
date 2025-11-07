/*
 * Copyright (C) 2025 LiveChat by Nevylish
 */

import express = require('express');
import path = require('path');
import { Logger } from './utils/Logger';
import { createServer } from 'http';
import { Server } from 'socket.io';
import DiscordClient from './DiscordClient';

type ConnectedStreamersType = {
    socketId: string;
    guildId: string;
};

export class LiveChatServer {
    public connectedStreamers: Map<string, ConnectedStreamersType>;
    public io: Server;

    private readonly port: number;
    private discordClient: DiscordClient;
    private app: express.Application;
    private httpServer;

    constructor(discordClient: DiscordClient) {
        this.port = Number(process.env.LIVECHAT_PORT);
        this.discordClient = discordClient;

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
        this.setupSocket();
        this.start();
    }

    private setupSocket(): void {
        this.io.on('connection', (socket) => {
            socket.on('register', (data: { username: string; guildId: string }) => {
                if (data.username.length > 25 || data.username.length < 3) {
                    socket.emit(
                        'updateConnectionStatus',
                        false,
                        "Le nom d'utilisateur est trop court ou trop long.",
                        300000,
                    );
                    socket.disconnect();
                    return;
                }

                const usernamePattern = /^[a-zA-Z0-9_\-]+$/;
                if (!usernamePattern.test(data.username)) {
                    socket.emit(
                        'updateConnectionStatus',
                        false,
                        "Le nom d'utilisateur contient des caractères non autorisés.",
                        300000,
                    );
                    socket.disconnect();
                    return;
                }

                if (data.guildId.length > 20 || data.guildId.length < 12) {
                    socket.emit(
                        'updateConnectionStatus',
                        false,
                        "L'identifiant du serveur ne correspond à aucun serveur existant.",
                        300000,
                    );
                    socket.disconnect();
                    return;
                }

                const guildIdPattern = /^[0-9]+$/;
                if (!guildIdPattern.test(data.guildId)) {
                    socket.emit(
                        'updateConnectionStatus',
                        false,
                        "L'identifiant du serveur contient des caractères non autorisés.",
                        300000,
                    );
                    socket.disconnect();
                    return;
                }

                this.discordClient.guilds
                    .fetch(data.guildId)
                    .then((guild) => {
                        if (guild) {
                            this.connectedStreamers.set(data.username, { socketId: socket.id, guildId: data.guildId });
                            this.discordClient.updateActivity(this.connectedStreamers.size);

                            if (guild.name)
                                socket.emit('updateConnectionStatus', true, ` pour le serveur Discord: ${guild.name}`);
                            else socket.emit('updateConnectionStatus', true);
                            Logger.log('LiveChatServer', `${data.username} is now connected to LiveChat`);
                        } else {
                            socket.emit(
                                'updateConnectionStatus',
                                false,
                                "Le bot Discord n'est pas présent dans le serveur inscrit. Ajoutez le bot puis relancez OBS Studio.",
                                30000,
                            );
                            socket.disconnect();
                            return;
                        }
                    })
                    .catch(() => {
                        socket.emit(
                            'updateConnectionStatus',
                            false,
                            "Le bot Discord n'est pas présent dans le serveur inscrit. Ajoutez le bot puis relancez OBS Studio.",
                            30000,
                        );
                        socket.disconnect();
                        return;
                    });
            });

            socket.on('disconnect', () => {
                for (const [streamer, data] of this.connectedStreamers.entries()) {
                    if (data.socketId === socket.id) {
                        this.connectedStreamers.delete(streamer);
                        this.discordClient.updateActivity(this.connectedStreamers.size);
                        Logger.log('LiveChatServer', `${streamer} is no longer connected to LiveChat`);
                    }
                }
            });
        });
    }

    private setupMiddlewares(): void {
        this.app.use(
            express.static(path.join(__dirname, '..', '..', 'dist', 'public'), {
                etag: true,
                lastModified: true,
                cacheControl: true,
                setHeaders: (res, filePath) => {
                    const lower = filePath.toLowerCase();

                    res.setHeader('X-Robots-Tag', 'index, follow');

                    if (lower.endsWith('.html')) {
                        res.setHeader('Cache-Control', 'no-cache');
                        res.setHeader('X-Robots-Tag', 'index, follow');
                    } else if (/\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|mp4|webm)$/.test(lower)) {
                        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                    } else {
                        res.setHeader('Cache-Control', 'public, no-cache');
                    }
                },
            }),
        );

        this.app.get('*', (req, res) => {
            const hasFileExtension = /\.\w+$/.test(req.path);
            
            if (!hasFileExtension) {
                res.sendFile(path.join(__dirname, '..', '..', 'dist', 'public', 'index.html'));
            } else {
                res.status(404).send('Fichier non trouvé');
            }
        });
    }

    private start(): void {
        this.httpServer.listen(this.port, () => {
            Logger.success('LiveChatServer', `Server is running on port ${this.port}`);
        });
    }
}
