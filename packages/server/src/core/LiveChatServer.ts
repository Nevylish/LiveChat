import express = require('express');
import os = require('os');
import { EventEmitter } from 'events';
import rateLimit from 'express-rate-limit';
import { createServer, Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import DiscordClient from './DiscordClient';
import { ProxyService } from './modules/_ProxyService';
import { Constants } from './utils/Constants';
import { Logger } from './utils/Logger';
import { Validations } from './utils/Validations';

type ConnectedStreamersType = {
    socketId: string;
    username: string;
    guildId: string;
};

export class LiveChatServer extends EventEmitter {
    private connectedStreamers: Map<string, ConnectedStreamersType>;
    public io: Server;

    private readonly port: number;
    private discordClient: DiscordClient;
    private app: express.Application;
    private httpServer: HttpServer;
    private indexHtmlTemplate: string | null = null;

    constructor(discordClient: DiscordClient) {
        super();
        this.port = Number(Constants.getPort());
        this.discordClient = discordClient;

        this.app = express();
        this.app.set('trust proxy', 1);

        this.httpServer = createServer(this.app);
        this.io = new Server(this.httpServer, {
            cors: {
                origin: Constants.getAllowedOrigins(),
                methods: ['GET', 'POST'],
                credentials: true,
            },
            pingInterval: 10000,
            pingTimeout: 5000,
        });

        this.connectedStreamers = new Map<string, ConnectedStreamersType>();

        this.setupMiddlewares();
        this.setupSocket();
        this.start();
    }

    private emitError(socket: Socket, message: string, context?: Record<string, any>): void {
        Logger.warn('LiveChatServer', message, context ?? {});
        socket.emit('updateConnectionStatus', false, message, 300000);
        socket.disconnect();
    }

    private setupSocket(): void {
        this.io.on('connection', (socket) => {
            socket.on('register', (data: { username: string; guildId: string }) => {
                // Validation du nom d'utilisateur
                const usernameValidation = Validations.validateUsername(data.username);
                if (!usernameValidation.valid) {
                    this.emitError(socket, usernameValidation.error!, {
                        username: data.username,
                        guildId: data.guildId,
                    });
                    return;
                }

                // Validation de l'identifiant du serveur Discord
                const guildIdValidation = Validations.validateGuildId(data.guildId);
                if (!guildIdValidation.valid) {
                    this.emitError(socket, guildIdValidation.error!, {
                        username: data.username,
                        guildId: data.guildId,
                    });
                    return;
                }

                const handleBotMissingFromGuild = () => {
                    this.emitError(
                        socket,
                        "Le bot Discord n'est pas présent dans le serveur inscrit. Ajoutez le bot puis relancez OBS Studio.",
                        { username: data.username, guildId: data.guildId },
                    );
                };

                this.discordClient.guilds
                    .fetch(data.guildId)
                    .then(async (guild) => {
                        if (guild) {
                            if (this.isStreamerConnected(data.username, data.guildId)) {
                                const existingData = this.getStreamerData(data.username, data.guildId);
                                if (existingData) {
                                    const existingSocket = this.io.sockets.sockets.get(existingData.socketId);
                                    if (existingSocket) {
                                        Logger.warn(
                                            'LiveChatServer',
                                            `Replacing existing connection for ${data.username}`,
                                            {
                                                username: data.username,
                                                guildId: data.guildId,
                                                guildName: guild.name ?? 'Unknown',
                                                oldSocketId: existingData.socketId,
                                                newSocketId: socket.id,
                                            },
                                        );
                                        existingSocket.disconnect(true);
                                    }
                                    this.removeStreamer(data.username, data.guildId);
                                }
                            }

                            const streamersConnectedLength = this.getConnectedStreamersCountByGuild(data.guildId);

                            if (streamersConnectedLength >= 20) {
                                this.emitError(
                                    socket,
                                    'Le nombre maximum de streameurs est atteint sur ce serveur Discord.',
                                    { username: data.username, guildId: data.guildId, slots: streamersConnectedLength },
                                );
                                return;
                            }

                            const isPremiumGuild = await this.discordClient.hasGuildPremiumSubscription(data.guildId);
                            if (!isPremiumGuild && streamersConnectedLength >= 10) {
                                this.emitError(
                                    socket,
                                    "Le nombre maximum de streameurs est atteint pour l'abonnement Gratuit.",
                                    { username: data.username, guildId: data.guildId, slots: streamersConnectedLength },
                                );
                                return;
                            }

                            if (!socket.connected) {
                                Logger.warn(
                                    'LiveChatServer',
                                    `Socket disconnected during registration for ${data.username}`,
                                    {
                                        username: data.username,
                                        guildId: data.guildId,
                                        guildName: guild.name ?? 'Unknown',
                                        socketId: socket.id,
                                    },
                                );
                                return;
                            }

                            this.addStreamer(socket.id, data.username, data.guildId);
                            socket.join(data.guildId);

                            if (guild.name) {
                                socket.emit('updateConnectionStatus', true, ` pour le serveur Discord: ${guild.name}`);
                            } else {
                                socket.emit('updateConnectionStatus', true);
                            }
                            Logger.success('LiveChatServer', `${data.username} connected to LiveChat`, {
                                username: data.username,
                                guildId: data.guildId,
                                guildName: guild.name ?? 'Unknown',
                                socketId: socket.id,
                            });
                        } else {
                            handleBotMissingFromGuild();
                            return;
                        }
                    })
                    .catch((err) => {
                        Logger.error('LiveChatServer', 'Error fetching guild', err);
                        handleBotMissingFromGuild();
                        return;
                    });
            });

            socket.on('disconnect', () => {
                Logger.log('LiveChatServer', `Socket disconnected`, { socketId: socket.id });
                for (const [_, data] of this.connectedStreamers.entries()) {
                    if (data.socketId === socket.id) {
                        this.removeStreamer(data.username, data.guildId);
                        this.emit('streamerDisconnected', socket.id);
                        Logger.log('LiveChatServer', `${data.username} is no longer connected to LiveChat`, {
                            username: data.username,
                            guildId: data.guildId,
                            socketId: socket.id,
                        });
                    }
                }
            });

            socket.on('started', (interactionId: string, duration?: number) => {
                this.emit('started', interactionId, duration);
            });

            socket.on('ended', (interactionId: string) => {
                this.emit('ended', interactionId);
            });
        });
    }

    private setupMiddlewares(): void {
        const limiter = rateLimit({
            windowMs: 1 * 60 * 1000,
            max: 100,
            message: { error: 'Too many requests.' },
            standardHeaders: true,
            legacyHeaders: false,
        });

        this.app.get('/api/proxy', limiter, ProxyService.handle);

        this.app.get('/api/stats', limiter, (_, res) => {
            res.json({
                streamers: this.getConnectedStreamersCount(),
                servers: this.discordClient.guilds.cache.size,
                // uptime: Math.round(process.uptime()),
                // discord: {
                //     ping: this.discordClient.ws.ping,
                // },
                // memory: {
                //     heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                //     rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
                //     systemFree: Math.round(os.freemem() / 1024 / 1024),
                //     systemTotal: Math.round(os.totalmem() / 1024 / 1024),
                // },
                // sockets: {
                //     totalConnections: this.io.sockets.sockets.size,
                // },
                // cache: CacheManager.getStats(),
            });
        });
    }

    private start(): void {
        this.httpServer.listen(this.port, () => {
            Logger.log('LiveChatServer', `Server is running on port ${this.port}`);
        });
    }

    addStreamer(socketId: string, username: string, guildId: string): void {
        this.connectedStreamers.set(username + ':' + guildId, {
            socketId: socketId,
            username: username,
            guildId: guildId,
        });
    }

    removeStreamer(username: string, guildId: string): void {
        this.connectedStreamers.delete(username + ':' + guildId);
    }

    getStreamerData(username: string, guildId: string): ConnectedStreamersType | undefined {
        return this.connectedStreamers.get(username + ':' + guildId);
    }

    isStreamerConnected(username: string, guildId: string): boolean {
        return this.connectedStreamers.has(username + ':' + guildId);
    }

    getConnectedStreamersByGuild(guildId: string): ConnectedStreamersType[] {
        return Array.from(this.connectedStreamers.values()).filter((streamer) => streamer.guildId === guildId);
    }

    getConnectedStreamersCount(): number {
        return this.connectedStreamers.size;
    }

    getConnectedStreamersCountByGuild(guildId: string): number {
        return this.getConnectedStreamersByGuild(guildId).length;
    }
}
