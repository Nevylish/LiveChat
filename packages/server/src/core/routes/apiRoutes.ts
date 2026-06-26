import express = require('express');
import crypto = require('crypto');
import rateLimit from 'express-rate-limit';
import DiscordClient from '../DiscordClient';
import { createAuthMiddlewares } from '../middlewares/auth';
import { isOverlayNameTaken } from '../services/overlayNames';
import { StreamerRegistry } from '../services/StreamerRegistry';
import { SupabaseService } from '../utils/SupabaseService';
import { Validations } from '../utils/Validations';
import { Logger } from '../utils/Logger';

interface ApiRouteDeps {
    app: express.Application;
    discordClient: DiscordClient;
    streamerRegistry: StreamerRegistry;
}

export function registerApiRoutes({ app, discordClient, streamerRegistry }: ApiRouteDeps): void {
    const limiter = rateLimit({
        windowMs: 1 * 60 * 1000,
        max: 100,
        message: { error: 'Too many requests.' },
        standardHeaders: true,
        legacyHeaders: false,
    });

    const { requireAuth, requireAdmin, requireGuildAccess, requireOverlayOwnership } =
        createAuthMiddlewares(discordClient);

    app.get('/api/stats', limiter, (_, res) => {
        res.json({
            streamers: streamerRegistry.count(),
            servers: discordClient.guilds.cache.size,
        });
    });

    app.get('/api/config/get', limiter, requireAuth, requireGuildAccess, async (req, res) => {
        const { guildId } = req.query;
        const userId = req.userId!;
        try {
            const configs = await SupabaseService.getOverlayConfigsByGuildAndUser(guildId as string, userId);
            const settings = await SupabaseService.getGuildSettings(guildId as string);
            const maxOverlays = settings?.max_overlays_per_user ?? 5;
            res.json({ configs, exists: configs.length > 0, maxOverlays });
        } catch {
            res.status(500).json({ error: 'Failed to fetch config' });
        }
    });

    app.post('/api/config/create', limiter, requireAuth, requireGuildAccess, async (req, res) => {
        const { username, guildId } = req.body;
        const userId = req.userId!;

        const usernameValidation = Validations.validateUsername(username);
        if (!usernameValidation.valid) {
            res.status(400).json({ error: usernameValidation.error });
            return;
        }

        try {
            const settings = await SupabaseService.getGuildSettings(guildId);
            const maxOverlays = settings?.max_overlays_per_user ?? 5;
            const userConfigs = await SupabaseService.getOverlayConfigsByGuildAndUser(guildId, userId);
            if (userConfigs.length >= maxOverlays) {
                res.status(400).json({
                    error: `Vous avez atteint la limite maximale de ${maxOverlays} overlay${maxOverlays > 1 ? 's' : ''} par personne pour ce serveur.`,
                });
                return;
            }

            const allConfigs = await SupabaseService.getOverlayConfigsByGuild(guildId);
            if (isOverlayNameTaken(allConfigs, username)) {
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
        } catch {
            res.status(500).json({ error: 'Failed to create config' });
        }
    });

    app.post(
        '/api/config/save',
        limiter,
        requireAuth,
        requireOverlayOwnership,
        requireGuildAccess,
        async (req, res) => {
            const { username, guildId, token } = req.body;
            const userId = req.userId!;
            const config = req.overlayConfig!;

            const usernameValidation = Validations.validateUsername(username);
            if (!usernameValidation.valid) {
                res.status(400).json({ error: usernameValidation.error });
                return;
            }

            try {
                if (username.toLowerCase() !== config.username.toLowerCase()) {
                    const allConfigs = await SupabaseService.getOverlayConfigsByGuild(guildId);
                    if (isOverlayNameTaken(allConfigs, username, token)) {
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
            } catch {
                res.status(500).json({ error: 'Failed to save config' });
            }
        },
    );

    app.post(
        '/api/config/regenerate',
        limiter,
        requireAuth,
        requireOverlayOwnership,
        requireGuildAccess,
        async (req, res) => {
            const { token } = req.body;
            try {
                const newToken = crypto.randomBytes(32).toString('hex');
                const success = await SupabaseService.updateOverlayToken(token, newToken);
                if (success) {
                    res.json({ token: newToken });
                } else {
                    res.status(500).json({ error: 'Failed to regenerate token' });
                }
            } catch {
                res.status(500).json({ error: 'Failed to regenerate token' });
            }
        },
    );

    app.post(
        '/api/config/delete',
        limiter,
        requireAuth,
        requireOverlayOwnership,
        requireGuildAccess,
        async (req, res) => {
            const { token } = req.body;
            try {
                const success = await SupabaseService.deleteOverlayConfig(token);
                if (success) {
                    res.json({ success: true });
                } else {
                    res.status(500).json({ error: 'Failed to delete config' });
                }
            } catch {
                res.status(500).json({ error: 'Failed to delete config' });
            }
        },
    );

    app.get('/api/guild/check', limiter, requireAuth, async (req, res) => {
        const { guildId } = req.query;
        const userId = req.userId!;
        if (typeof guildId !== 'string') {
            res.status(400).json({ error: 'Missing guildId' });
            return;
        }
        try {
            const ids = guildId.includes(',') ? guildId.split(',') : [guildId];

            const botPresence: Record<string, boolean> = {};
            for (const id of ids) {
                botPresence[id] = discordClient.guilds.cache.has(id);
            }

            const overlayCounts = await SupabaseService.getOverlayCountsByGuildsAndUser(ids, userId);

            if (guildId.includes(',')) {
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

    app.get('/api/config/all', limiter, requireAuth, requireAdmin, async (req, res) => {
        const { guildId } = req.query;
        try {
            const configs = await SupabaseService.getOverlayConfigsByGuild(guildId as string);
            const publicConfigs = configs.map((c) => ({
                guild_id: c.guild_id,
                username: c.username,
                user_id: c.user_id,
                updated_at: c.updated_at,
            }));

            res.json({ configs: publicConfigs });
        } catch {
            res.status(500).json({ error: 'Failed to fetch all configurations' });
        }
    });

    app.post('/api/config/admin/delete', limiter, requireAuth, requireAdmin, async (req, res) => {
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
        } catch {
            res.status(500).json({ error: 'Failed to delete config' });
        }
    });

    app.get('/api/guild/roles', limiter, requireAuth, requireAdmin, async (req, res) => {
        const { guildId } = req.query;
        try {
            const guild =
                discordClient.guilds.cache.get(guildId as string) ||
                (await discordClient.guilds.fetch(guildId as string).catch(() => null));
            if (!guild) {
                res.status(404).json({ error: 'Serveur introuvable.' });
                return;
            }

            const roles = await guild.roles.fetch().catch(() => null);
            if (!roles) {
                res.status(500).json({ error: 'Impossible de charger les rôles Discord.' });
                return;
            }

            const rolesList = roles
                .map((r) => ({
                    id: r.id,
                    name: r.name,
                    color: r.hexColor,
                    managed: r.managed,
                }))
                .filter((r) => r.name !== '@everyone' && !r.managed);

            res.json({ roles: rolesList });
        } catch {
            res.status(500).json({ error: 'Failed to fetch roles' });
        }
    });

    app.get('/api/guild/settings', limiter, requireAuth, requireAdmin, async (req, res) => {
        const { guildId } = req.query;
        try {
            const settings = await SupabaseService.getGuildSettings(guildId as string);
            res.json({
                settings: settings || { guild_id: guildId, required_role_id: null, max_overlays_per_user: 5 },
            });
        } catch {
            res.status(500).json({ error: 'Failed to fetch settings' });
        }
    });

    app.post('/api/guild/settings/save', limiter, requireAuth, requireAdmin, async (req, res) => {
        const { guildId, requiredRoleId, maxOverlaysPerUser } = req.body;

        if (maxOverlaysPerUser !== undefined) {
            const maxOverlays = Number(maxOverlaysPerUser);
            if (isNaN(maxOverlays) || maxOverlays < 1 || maxOverlays > 20) {
                res.status(400).json({
                    error: "La limite d'overlays par personne doit être comprise entre 1 et 20.",
                });
                return;
            }
        }

        try {
            const success = await SupabaseService.saveGuildSettings(
                guildId,
                requiredRoleId || null,
                maxOverlaysPerUser !== undefined ? Number(maxOverlaysPerUser) : 5,
            );
            if (success) {
                res.json({ success: true });
            } else {
                res.status(500).json({ error: 'Failed to save settings' });
            }
        } catch {
            res.status(500).json({ error: 'Failed to save settings' });
        }
    });
}
