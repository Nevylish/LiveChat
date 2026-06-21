import express = require('express');
import crypto = require('crypto');
import { EventEmitter } from 'events';
import rateLimit from 'express-rate-limit';
import { createServer, Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import DiscordClient from './DiscordClient';

import { Constants } from './utils/Constants';
import { Logger } from './utils/Logger';
import { SupabaseService } from './utils/SupabaseService';
import { Validations } from './utils/Validations';
import { createAuthMiddlewares, checkGuildAccess } from './middlewares/auth';

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
    private auth: ReturnType<typeof createAuthMiddlewares>;

    constructor(discordClient: DiscordClient) {
        super();
        this.port = Number(Constants.getPort());
        this.discordClient = discordClient;

        this.app = express();
        this.app.set('trust proxy', 1);

        this.auth = createAuthMiddlewares(this.discordClient);

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

    private generateOverlayToken(username: string, guildId: string): string {
        return crypto.createHmac('sha256', process.env.OVERLAY_SECRET!).update(`${username}:${guildId}`).digest('hex');
    }

    private isValidOverlayToken(username: string, guildId: string, token: string): boolean {
        const expected = this.generateOverlayToken(username, guildId);
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
    }

    private setupSocket(): void {
        this.io.on('connection', (socket) => {
            socket.on('register', async (data: { username?: string; guildId?: string; token?: string }) => {
                let username = data.username;
                let guildId = data.guildId;
                const token = data.token;

                if (token) {
                    try {
                        const config = await SupabaseService.getOverlayConfigByToken(token);
                        if (config) {
                            username = config.username;
                            guildId = config.guild_id;
                        } else {
                            if (username && guildId) {
                                if (!this.isValidOverlayToken(username, guildId, token)) {
                                    this.emitError(
                                        socket,
                                        "Le lien de l'overlay est invalide. Régénérez-le depuis le site.",
                                        {
                                            username,
                                            guildId,
                                        },
                                    );
                                    return;
                                }
                            } else {
                                this.emitError(socket, 'Jeton invalide ou configuration inexistante.', { token });
                                return;
                            }
                        }
                    } catch (err) {
                        Logger.error('LiveChatServer', 'Error validating token via Supabase', err);
                        if (username && guildId) {
                            if (!this.isValidOverlayToken(username, guildId, token)) {
                                this.emitError(
                                    socket,
                                    "Le lien de l'overlay est invalide. Régénérez-le depuis le site.",
                                    {
                                        username,
                                        guildId,
                                    },
                                );
                                return;
                            }
                        } else {
                            this.emitError(socket, "Erreur lors de la validation du jeton d'overlay.", { token });
                            return;
                        }
                    }
                } else {
                    if (username) {
                        Logger.warn('LiveChatServer', `Legacy connection without token for ${username}`, {
                            username,
                            guildId,
                        });
                    } else {
                        this.emitError(socket, 'Jeton de connexion ou identifiants manquants.');
                        return;
                    }
                }

                if (!username || !guildId) {
                    this.emitError(socket, "Impossible d'identifier la session : identifiants manquants.", {
                        username,
                        guildId,
                    });
                    return;
                }

                // Validation du nom d'utilisateur
                const usernameValidation = Validations.validateUsername(username);
                if (!usernameValidation.valid) {
                    this.emitError(socket, usernameValidation.error!, {
                        username,
                        guildId,
                    });
                    return;
                }

                // Validation de l'identifiant du serveur Discord
                const guildIdValidation = Validations.validateGuildId(guildId);
                if (!guildIdValidation.valid) {
                    this.emitError(socket, guildIdValidation.error!, {
                        username,
                        guildId,
                    });
                    return;
                }

                // Vérifier si le propriétaire de l'overlay est toujours autorisé à l'utiliser (rôle obligatoire)
                try {
                    const config = token
                        ? await SupabaseService.getOverlayConfigByToken(token)
                        : await SupabaseService.getOverlayConfig(guildId, username);
                    if (config) {
                        const allowed = await checkGuildAccess(this.discordClient, guildId, config.user_id);
                        if (!allowed) {
                            this.emitError(
                                socket,
                                "Le propriétaire de cet overlay n'a pas le rôle requis sur Discord pour utiliser LiveChat.",
                                { username, guildId }
                            );
                            return;
                        }
                    }
                } catch (err) {
                    Logger.error('LiveChatServer', 'Error checking role authorization during registration', err);
                }

                const handleBotMissingFromGuild = () => {
                    this.emitError(
                        socket,
                        "Le bot Discord n'est pas présent dans le serveur inscrit. Ajoutez le bot puis relancez OBS Studio.",
                        { username, guildId },
                    );
                };

                this.discordClient.guilds
                    .fetch(guildId)
                    .then(async (guild) => {
                        if (guild) {
                            if (this.isStreamerConnected(username, guildId)) {
                                const existingData = this.getStreamerData(username, guildId);
                                if (existingData) {
                                    const existingSocket = this.io.sockets.sockets.get(existingData.socketId);
                                    if (existingSocket) {
                                        Logger.warn('LiveChatServer', `Replacing existing connection for ${username}`, {
                                            username,
                                            guildId,
                                            guildName: guild.name ?? 'Unknown',
                                            oldSocketId: existingData.socketId,
                                            newSocketId: socket.id,
                                        });
                                        existingSocket.disconnect(true);
                                    }
                                    this.removeStreamer(username, guildId);
                                }
                            }

                            const streamersConnectedLength = this.getConnectedStreamersCountByGuild(guildId);

                            if (streamersConnectedLength >= 20) {
                                this.emitError(
                                    socket,
                                    'Le nombre maximum de streameurs est atteint sur ce serveur Discord.',
                                    { username, guildId, slots: streamersConnectedLength },
                                );
                                return;
                            }

                            const isPremiumGuild = await this.discordClient.hasGuildPremiumSubscription(guildId);
                            if (!isPremiumGuild && streamersConnectedLength >= 10) {
                                this.emitError(
                                    socket,
                                    "Le nombre maximum de streameurs est atteint pour l'abonnement Gratuit.",
                                    { username, guildId, slots: streamersConnectedLength },
                                );
                                return;
                            }

                            if (!socket.connected) {
                                Logger.warn(
                                    'LiveChatServer',
                                    `Socket disconnected during registration for ${username}`,
                                    {
                                        username,
                                        guildId,
                                        guildName: guild.name ?? 'Unknown',
                                        socketId: socket.id,
                                    },
                                );
                                return;
                            }

                            this.addStreamer(socket.id, username, guildId);
                            socket.join(guildId);

                            if (guild.name) {
                                socket.emit('updateConnectionStatus', true, ` pour le serveur Discord: ${guild.name}`);
                            } else {
                                socket.emit('updateConnectionStatus', true);
                            }
                            Logger.success('LiveChatServer', `${username} connected to LiveChat`, {
                                username,
                                guildId,
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

        const limiter = rateLimit({
            windowMs: 1 * 60 * 1000,
            max: 100,
            message: { error: 'Too many requests.' },
            standardHeaders: true,
            legacyHeaders: false,
        });

        const { requireAdmin, requireGuildAccess, requireOverlayOwnership } = this.auth;

        this.app.get('/api/stats', limiter, (_, res) => {
            res.json({
                streamers: this.getConnectedStreamersCount(),
                servers: this.discordClient.guilds.cache.size,
            });
        });

        this.app.get('/api/token/generate', limiter, async (req, res) => {
            const { username, guildId } = req.query;

            if (typeof username !== 'string' || typeof guildId !== 'string') {
                res.status(400).json({ error: 'Missing or invalid username/guildId.' });
                return;
            }

            const usernameValidation = Validations.validateUsername(username);
            if (!usernameValidation.valid) {
                res.status(400).json({ error: usernameValidation.error });
                return;
            }

            const guildIdValidation = Validations.validateGuildId(guildId);
            if (!guildIdValidation.valid) {
                res.status(400).json({ error: guildIdValidation.error });
                return;
            }

            try {
                const guild = await this.discordClient.guilds.fetch(guildId);
                if (!guild) {
                    res.status(404).json({
                        error: "Le bot Discord n'est pas présent dans le serveur inscrit. Ajoutez le bot puis réessayez.",
                        id: 'bot_not_in_guild',
                    });
                    return;
                }
            } catch {
                res.status(404).json({
                    error: "Le bot Discord n'est pas présent dans le serveur inscrit. Ajoutez le bot puis réessayez.",
                    id: 'bot_not_in_guild',
                });
                return;
            }

            try {
                const config = await SupabaseService.getOverlayConfig(guildId, username);
                if (config && config.token) {
                    res.json({ token: config.token });
                } else {
                    const token = this.generateOverlayToken(username, guildId);
                    await SupabaseService.saveOverlayConfig(guildId, username, token);
                    res.json({ token });
                }
            } catch (err) {
                const token = this.generateOverlayToken(username, guildId);
                res.json({ token });
            }
        });

        this.app.get('/api/config/get', limiter, requireGuildAccess, async (req, res) => {
            const { guildId, userId } = req.query;
            try {
                const configs = await SupabaseService.getOverlayConfigsByGuildAndUser(guildId as string, userId as string);
                const settings = await SupabaseService.getGuildSettings(guildId as string);
                const maxOverlays = settings?.max_overlays_per_user ?? 5;
                res.json({ configs, exists: configs.length > 0, maxOverlays });
            } catch (err) {
                res.status(500).json({ error: 'Failed to fetch config' });
            }
        });

        this.app.post('/api/config/create', limiter, requireGuildAccess, async (req, res) => {
            const { username, guildId, userId } = req.body;

            const usernameValidation = Validations.validateUsername(username);
            if (!usernameValidation.valid) {
                res.status(400).json({ error: usernameValidation.error });
                return;
            }

            try {
                // Check user overlays limit
                const settings = await SupabaseService.getGuildSettings(guildId);
                const maxOverlays = settings?.max_overlays_per_user ?? 5;
                const userConfigs = await SupabaseService.getOverlayConfigsByGuildAndUser(guildId, userId);
                if (userConfigs.length >= maxOverlays) {
                    res.status(400).json({ error: `Vous avez atteint la limite maximale de ${maxOverlays} overlay${maxOverlays > 1 ? 's' : ''} par personne pour ce serveur.` });
                    return;
                }

                // Check overlay name uniqueness on this server across all users
                const allConfigs = await SupabaseService.getOverlayConfigsByGuild(guildId);
                const nameExists = allConfigs.some(c => c.username.toLowerCase() === username.toLowerCase());
                if (nameExists) {
                    res.status(400).json({ error: 'Un overlay avec ce nom existe déjà sur ce serveur.' });
                    return;
                }

                const token = crypto.randomBytes(32).toString('hex');
                const success = await SupabaseService.saveOverlayConfig(guildId, username, token, userId);
                if (success) {
                    res.json({ token, exists: true });
                } else {
                    res.status(500).json({ error: 'Failed to create config' });
                }
            } catch (err) {
                res.status(500).json({ error: 'Failed to create config' });
            }
        });

        this.app.post('/api/config/save', limiter, requireOverlayOwnership, requireGuildAccess, async (req, res) => {
            const { username, guildId, token, userId } = req.body;
            const config = req.overlayConfig!;

            const usernameValidation = Validations.validateUsername(username);
            if (!usernameValidation.valid) {
                res.status(400).json({ error: usernameValidation.error });
                return;
            }

            try {
                // Check name uniqueness on this server (excluding current overlay)
                if (username.toLowerCase() !== config.username.toLowerCase()) {
                    const allConfigs = await SupabaseService.getOverlayConfigsByGuild(guildId);
                    const nameExists = allConfigs.some(c => c.token !== token && c.username.toLowerCase() === username.toLowerCase());
                    if (nameExists) {
                        res.status(400).json({ error: 'Un overlay avec ce nom existe déjà sur ce serveur.' });
                        return;
                    }
                }

                const success = await SupabaseService.saveOverlayConfig(guildId, username, token, userId);
                if (success) {
                    res.json({ success: true });
                } else {
                    res.status(500).json({ error: 'Failed to save config' });
                }
            } catch (err) {
                res.status(500).json({ error: 'Failed to save config' });
            }
        });

        this.app.post('/api/config/regenerate', limiter, requireOverlayOwnership, requireGuildAccess, async (req, res) => {
            const { token } = req.body;
            try {
                const newToken = crypto.randomBytes(32).toString('hex');
                const success = await SupabaseService.updateOverlayToken(token, newToken);
                if (success) {
                    res.json({ token: newToken });
                } else {
                    res.status(500).json({ error: 'Failed to regenerate token' });
                }
            } catch (err) {
                res.status(500).json({ error: 'Failed to regenerate token' });
            }
        });

        this.app.post('/api/config/delete', limiter, requireOverlayOwnership, requireGuildAccess, async (req, res) => {
            const { token } = req.body;
            try {
                const success = await SupabaseService.deleteOverlayConfig(token);
                if (success) {
                    res.json({ success: true });
                } else {
                    res.status(500).json({ error: 'Failed to delete config' });
                }
            } catch (err) {
                res.status(500).json({ error: 'Failed to delete config' });
            }
        });

        this.app.get('/api/guild/check', limiter, async (req, res) => {
            const { guildId, userId } = req.query;
            if (typeof guildId !== 'string') {
                res.status(400).json({ error: 'Missing guildId' });
                return;
            }
            try {
                const ids = guildId.includes(',') ? guildId.split(',') : [guildId];
                
                // Get bot presence
                const botPresence: Record<string, boolean> = {};
                for (const id of ids) {
                    botPresence[id] = this.discordClient.guilds.cache.has(id);
                }

                // Get overlay counts if userId is provided
                let overlayCounts: Record<string, number> = {};
                if (typeof userId === 'string' && userId) {
                    overlayCounts = await SupabaseService.getOverlayCountsByGuildsAndUser(ids, userId);
                }

                if (guildId.includes(',')) {
                    // Return batch response
                    const results: Record<string, { hasBot: boolean; overlayCount: number }> = {};
                    for (const id of ids) {
                        results[id] = {
                            hasBot: botPresence[id],
                            overlayCount: overlayCounts[id] || 0,
                        };
                    }
                    res.json({ results });
                } else {
                    const id = ids[0];
                    res.json({
                        hasBot: botPresence[id],
                        overlayCount: overlayCounts[id] || 0,
                    });
                }
            } catch (err) {
                Logger.error('LiveChatServer', 'Failed to check guild status', err);
                res.status(500).json({ error: 'Failed to check guild status' });
            }
        });

        this.app.get('/api/config/all', limiter, requireAdmin, async (req, res) => {
            const { guildId } = req.query;
            try {
                const configs = await SupabaseService.getOverlayConfigsByGuild(guildId as string);
                const publicConfigs = configs.map(c => ({
                    guild_id: c.guild_id,
                    username: c.username,
                    user_id: c.user_id,
                    updated_at: c.updated_at
                }));

                res.json({ configs: publicConfigs });
            } catch (err) {
                res.status(500).json({ error: 'Failed to fetch all configurations' });
            }
        });

        this.app.post('/api/config/admin/delete', limiter, requireAdmin, async (req, res) => {
            const { guildId, username } = req.body;
            try {
                const config = await SupabaseService.getOverlayConfig(guildId, username);
                if (!config) {
                    res.status(404).json({ error: 'Overlay introuvable.' });
                    return;
                }

                const success = await SupabaseService.deleteOverlayConfig(config.token);
                if (success) {
                    res.json({ success: true });
                } else {
                    res.status(500).json({ error: 'Failed to delete config' });
                }
            } catch (err) {
                res.status(500).json({ error: 'Failed to delete config' });
            }
        });

        this.app.get('/api/guild/roles', limiter, requireAdmin, async (req, res) => {
            const { guildId } = req.query;
            try {
                const guild = this.discordClient.guilds.cache.get(guildId as string) || await this.discordClient.guilds.fetch(guildId as string).catch(() => null);
                if (!guild) {
                    res.status(404).json({ error: 'Serveur introuvable.' });
                    return;
                }

                const roles = await guild.roles.fetch().catch(() => null);
                if (!roles) {
                    res.status(500).json({ error: 'Impossible de charger les rôles Discord.' });
                    return;
                }

                const rolesList = roles.map(r => ({
                    id: r.id,
                    name: r.name,
                    color: r.hexColor,
                    managed: r.managed
                })).filter(r => r.name !== '@everyone' && !r.managed);

                res.json({ roles: rolesList });
            } catch (err) {
                res.status(500).json({ error: 'Failed to fetch roles' });
            }
        });

        this.app.get('/api/guild/settings', limiter, requireAdmin, async (req, res) => {
            const { guildId } = req.query;
            try {
                const settings = await SupabaseService.getGuildSettings(guildId as string);
                res.json({ settings: settings || { guild_id: guildId, required_role_id: null, max_overlays_per_user: 5 } });
            } catch (err) {
                res.status(500).json({ error: 'Failed to fetch settings' });
            }
        });

        this.app.post('/api/guild/settings/save', limiter, requireAdmin, async (req, res) => {
            const { guildId, requiredRoleId, maxOverlaysPerUser } = req.body;

            if (maxOverlaysPerUser !== undefined) {
                const maxOverlays = Number(maxOverlaysPerUser);
                if (isNaN(maxOverlays) || maxOverlays < 1 || maxOverlays > 20) {
                    res.status(400).json({ error: "La limite d'overlays par personne doit être comprise entre 1 et 20." });
                    return;
                }
            }

            try {
                const success = await SupabaseService.saveGuildSettings(
                    guildId,
                    requiredRoleId || null,
                    maxOverlaysPerUser !== undefined ? Number(maxOverlaysPerUser) : 5
                );
                if (success) {
                    res.json({ success: true });
                } else {
                    res.status(500).json({ error: 'Failed to save settings' });
                }
            } catch (err) {
                res.status(500).json({ error: 'Failed to save settings' });
            }
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
