import express = require('express');
import path = require('path');
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import DiscordClient from './DiscordClient';
import { Constants } from './utils/Constants';
import { Logger } from './utils/Logger';

type ConnectedStreamersType = {
    socketId: string;
    username: string;
    guildId: string;
};

export class LiveChatServer {
    private connectedStreamers: Map<string, ConnectedStreamersType>;
    public io: Server;

    private readonly port: number;
    private discordClient: DiscordClient;
    private app: express.Application;
    private httpServer;

    constructor(discordClient: DiscordClient) {
        this.port = Number(Constants.getPort());
        this.discordClient = discordClient;

        this.app = express();
        this.app.set('trust proxy', 1);

        this.httpServer = createServer(this.app);
        this.io = new Server(this.httpServer, {
            cors: {
                origin: Constants.getPath(),
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
                if (this.getConnectedStreamersByGuildSize(data.guildId) >= 24) {
                    this.emitError(socket, 'Le nombre maximum de streamers est atteint sur ce serveur Discord.');
                    return;
                }

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

                // Caractères autorisés par Twitch
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

                this.discordClient.guilds
                    .fetch(data.guildId)
                    .then((guild) => {
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

                            this.addStreamer(socket.id, data.username, data.guildId);
                            this.discordClient.updateActivity(this.getConnectedStreamersSize());

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
                    .catch((e) => {
                        console.log(e);
                        handleBotMissingFromGuild();
                        return;
                    });
            });

            socket.on('disconnect', () => {
                for (const [_, data] of this.connectedStreamers.entries()) {
                    if (data.socketId === socket.id) {
                        this.removeStreamer(data.username, data.guildId);
                        this.discordClient.updateActivity(this.getConnectedStreamersSize());
                        Logger.log('LiveChatServer', `${data.username} is no longer connected to LiveChat`);
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

    getConnectedStreamersSize(): number {
        return this.connectedStreamers.size;
    }

    getConnectedStreamersByGuildSize(guildId: string): number {
        return this.getConnectedStreamersByGuild(guildId).length;
    }
}
