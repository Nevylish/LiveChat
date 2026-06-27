import express = require('express');
import { EventEmitter } from 'events';
import { createServer, Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import DiscordClient from './DiscordClient';
import { registerApiRoutes } from './routes/apiRoutes';
import { registerAuthRoutes } from './routes/authRoutes';
import { registerOverlaySocket } from './socket/overlaySocket';
import { StreamerRegistry } from './services/StreamerRegistry';
import { Constants } from './utils/Constants';
import { Logger } from './utils/Logger';
import { TargetsManager } from './utils/Targets';

export class LiveChatServer extends EventEmitter {
    public readonly io: Server;
    private readonly streamerRegistry = new StreamerRegistry();
    private readonly port: number;
    private readonly discordClient: DiscordClient;
    private readonly app: express.Application;
    private readonly httpServer: HttpServer;

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

        this.setupHttpMiddleware();
        registerAuthRoutes({ app: this.app });
        registerApiRoutes({
            app: this.app,
            discordClient: this.discordClient,
            streamerRegistry: this.streamerRegistry,
        });
        registerOverlaySocket({
            io: this.io,
            discordClient: this.discordClient,
            streamerRegistry: this.streamerRegistry,
            events: this,
        });
        this.start();
    }

    private setupHttpMiddleware(): void {
        this.app.use(express.json());
        this.app.use((req, res, next) => {
            const origin = req.headers.origin;
            const allowedOrigins = Constants.getAllowedOrigins().map((o) => o.replace(/\/$/, ''));
            if (origin && allowedOrigins.includes(origin.replace(/\/$/, ''))) {
                res.setHeader('Access-Control-Allow-Origin', origin);
                res.setHeader('Access-Control-Allow-Credentials', 'true');
            }
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,authorization');

            if (req.method === 'OPTIONS') {
                res.sendStatus(204);
            } else {
                next();
            }
        });
    }

    private start(): void {
        this.httpServer.listen(this.port, () => {
            Logger.log('LiveChatServer', `Server is running on port ${this.port}`);
        });
    }

    addStreamer(socketId: string, username: string, guildId: string): void {
        this.streamerRegistry.add(socketId, username, guildId);
    }

    removeStreamer(username: string, guildId: string): void {
        this.streamerRegistry.remove(username, guildId);
    }

    getStreamerData(username: string, guildId: string): TargetsManager.ConnectedStreamer | undefined {
        return this.streamerRegistry.get(username, guildId);
    }

    isStreamerConnected(username: string, guildId: string): boolean {
        return this.streamerRegistry.has(username, guildId);
    }

    getConnectedStreamersByGuild(guildId: string): TargetsManager.ConnectedStreamer[] {
        return this.streamerRegistry.getByGuild(guildId);
    }

    getConnectedStreamersCount(): number {
        return this.streamerRegistry.count();
    }

    getConnectedStreamersCountByGuild(guildId: string): number {
        return this.streamerRegistry.countByGuild(guildId);
    }
}
