/*
    Ce fichier est l'un des poumons du projet. C'est ici qu'est géré la communication entre mon serveur et votre OBS Studio.
*/

import express = require('express');
import path = require('path');
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import DiscordClient from './DiscordClient';
import { TikTok } from './modules/Tiktok';
import { Constants } from './utils/Constants';
import { Logger } from './utils/Logger';

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
        this.port = Number(Constants.getPort());
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

    /**
     * Envoie un message d'erreur au client et arrête la connexion.
     * @param socket Socket
     * @param message Message d'erreur affiché sur OBS.
     */
    private emitError(socket: Socket, message: string): void {
        socket.emit('updateConnectionStatus', false, message, 300000);
        socket.disconnect();
    }

    private setupSocket(): void {
        this.io.on('connection', (socket) => {
            socket.on('register', (data: { username: string; guildId: string }) => {
                // Longueur du nom d'utilisateur autorisée par Twitch
                // https://discuss.dev.twitch.com/t/max-length-for-user-names-and-display-names/21315
                if (data.username.length > 25 || data.username.length < 4) {
                    this.emitError(
                        socket,
                        data.username.length > 25
                            ? "Le nom d'utilisateur est trop long. Max: 25 caractères."
                            : "Le nom d'utilisateur est trop court. Min: 4 caractères.",
                    );
                    return;
                }

                // Caractères autorisés par Twitch (todo: améliorer le regex)
                const usernamePattern = /^[a-zA-Z0-9_\-]+$/;
                if (!usernamePattern.test(data.username)) {
                    this.emitError(
                        socket,
                        "Le nom d'utilisateur contient des caractères non autorisés. Lettres, chiffres et underscores sont autorisés.",
                    );
                    return;
                }

                // Longueur de l'id du serveur Discord
                // https://www.reddit.com/r/discordapp/comments/1fv8pen/how_long_are_discord_guild_ids/
                if (data.guildId.length < 17 || data.guildId.length > 21) {
                    this.emitError(
                        socket,
                        data.guildId.length < 17
                            ? "L'identifiant du serveur Discord est trop court. Min: 17 caractères."
                            : "L'identifiant du serveur Discord est trop long. Max: 21 caractères.",
                    );
                    return;
                }

                // On autorise seulement les chiffres pour l'id du serveur Discord
                const guildIdPattern = /^[0-9]+$/;
                if (!guildIdPattern.test(data.guildId)) {
                    this.emitError(socket, "L'identifiant du serveur Discord contient des caractères non autorisés.");
                    return;
                }

                const handleBotMissingFromGuild = () => {
                    this.emitError(
                        socket,
                        "Le bot Discord n'est pas présent dans le serveur inscrit. Ajoutez le bot puis relancez OBS Studio.",
                    );
                };

                // Si le bot Discord n'est pas présent dans le serveur inscrit on déconnecte.
                // Si c'est bon, on l'ajoute à la liste des streamers connectés.
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
        const apiLimiter = rateLimit({
            windowMs: 1 * 60 * 1000,
            max: 100,
            message: { error: 'Trop de requêtes.' },
            standardHeaders: true,
            legacyHeaders: false,
        });

        this.app.get('/api/tiktok', apiLimiter, TikTok.handleProxy);

        // this.app.get('/api/youtube', apiLimiter, YouTube.handleProxy);

        this.app.use(
            // La fonction setupMiddlewares() a été faite par Cursor Claude. Le but était de régler des soucis liés à la mise en cache.
            // Finalement, j'utilise du versionning de fichier dans le HTML (?v=00-00-0000.0) et c'est tout autant efficace.
            // Je laisse ce truc là parce que honnêtement je ne connais pas le comportement d'OBS, et ça fonctionne très bien avec ça.
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
