import express = require('express');
import path = require('path');
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

    constructor(discordClient: DiscordClient) {
        super();
        this.port = Number(Constants.getPort());
        this.discordClient = discordClient;

        this.app = express();
        this.app.set('trust proxy', 1);

        this.httpServer = createServer(this.app);
        this.io = new Server(this.httpServer, {
            cors: {
                origin: Constants.getBaseUrl(),
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        this.connectedStreamers = new Map<string, ConnectedStreamersType>();

        this.setupMiddlewares();
        this.setupSocket();
        this.start();
    }

    private emitError(socket: Socket, message: string): void {
        socket.emit('updateConnectionStatus', false, message, 300000);
        socket.disconnect();
    }

    private setupSocket(): void {
        this.io.on('connection', (socket) => {
            socket.on('register', (data: { username: string; guildId: string }) => {
                // Validation du nom d'utilisateur
                const usernameValidation = Validations.validateUsername(data.username);
                if (!usernameValidation.valid) {
                    this.emitError(socket, usernameValidation.error!);
                    return;
                }

                // Validation de l'identifiant du serveur Discord
                const guildIdValidation = Validations.validateGuildId(data.guildId);
                if (!guildIdValidation.valid) {
                    this.emitError(socket, guildIdValidation.error!);
                    return;
                }

                const handleBotMissingFromGuild = () => {
                    this.emitError(
                        socket,
                        "Le bot Discord n'est pas présent dans le serveur inscrit. Ajoutez le bot puis relancez OBS Studio.",
                    );
                };

                this.discordClient.guilds
                    .fetch(data.guildId)
                    .then(async (guild) => {
                        if (guild) {
                            if (this.isStreamerConnected(data.username, data.guildId)) {
                                this.emitError(
                                    socket,
                                    guild.name
                                        ? `Le nom d'utilisateur ${data.username} est déjà utilisé sur le serveur Discord: ${guild.name}`
                                        : `Le nom d'utilisateur ${data.username} est déjà utilisé sur le serveur Discord.`,
                                );
                                return;
                            }

                            const streamersConnectedLength = this.getConnectedStreamersCountByGuild(data.guildId);

                            if (streamersConnectedLength >= 20) {
                                this.emitError(
                                    socket,
                                    'Le nombre maximum de streameurs est atteint sur ce serveur Discord.',
                                );
                                return;
                            }

                            const isPremiumGuild = await this.discordClient.hasGuildPremiumSubscription(data.guildId);
                            if (isPremiumGuild && streamersConnectedLength >= 10) {
                                this.emitError(
                                    socket,
                                    "Le nombre maximum de streameurs est atteint pour l'abonnement Gratuit.",
                                );
                                return;
                            }

                            this.addStreamer(socket.id, data.username, data.guildId);
                            this.discordClient.updateActivity(this.getConnectedStreamersCount());

                            if (guild.name) {
                                socket.emit('updateConnectionStatus', true, ` pour le serveur Discord: ${guild.name}`);
                            } else {
                                socket.emit('updateConnectionStatus', true);
                            }
                            Logger.log('LiveChatServer', `${data.username} is now connected to LiveChat`);
                        } else {
                            handleBotMissingFromGuild();
                            return;
                        }
                    })
                    .catch(() => {
                        handleBotMissingFromGuild();
                        return;
                    });
            });

            socket.on('disconnect', () => {
                for (const [_, data] of this.connectedStreamers.entries()) {
                    if (data.socketId === socket.id) {
                        this.removeStreamer(data.username, data.guildId);
                        this.discordClient.updateActivity(this.getConnectedStreamersCount());
                        Logger.log('LiveChatServer', `${data.username} is no longer connected to LiveChat`);
                    }
                }
            });

            socket.on('started', (interactionId: string) => {
                this.emit('started', interactionId);
            });

            socket.on('ended', (interactionId: string) => {
                this.emit('ended', interactionId);
            });
        });
    }

    private setupMiddlewares(): void {
        const limiter = rateLimit({
            windowMs: 1 * 60 * 1000,
            max: 1000,
            message: { error: 'Trop de requêtes.' },
            standardHeaders: true,
            legacyHeaders: false,
        });

        this.app.get('/api/proxy', limiter, ProxyService.handle);

        const staticOptions = {
            etag: true,
            lastModified: true,
            cacheControl: true,
            setHeaders: (res: express.Response, filePath: string) => {
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
        };

        // Chemins vers les différents packages depuis packages/server/dist/core/
        const projectRoot = path.join(__dirname, '..', '..', '..', '..');

        // Redirection pour la compatibilité avec les anciens liens d'overlay (/overlay.html -> /overlay/overlay.html)
        this.app.get('/overlay.html', (req, res) => {
            const query = req.url.split('?')[1];
            res.redirect(301, `/overlay/overlay.html${query ? '?' + query : ''}`);
        });

        this.app.use('/overlay', express.static(path.join(projectRoot, 'packages', 'overlay'), staticOptions));

        this.app.use('/assets', express.static(path.join(projectRoot, 'shared', 'assets'), staticOptions));

        this.app.use('/', express.static(path.join(projectRoot, 'packages', 'web', 'dist'), staticOptions));

        this.app.use((req, res) => {
            const hasFileExtension = /\.\w+$/.test(req.path);

            if (!hasFileExtension) {
                res.sendFile(path.join(projectRoot, 'packages', 'web', 'dist', 'index.html'));
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
