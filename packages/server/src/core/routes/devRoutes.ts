import express = require('express');
import rateLimit from 'express-rate-limit';
import DiscordClient from '../DiscordClient';
import { createAuthMiddlewares, isDevAdmin } from '../middlewares/auth';
import { Router } from '../modules/_Router';
import { StreamerRegistry } from '../services/StreamerRegistry';
import { CacheManager } from '../utils/CacheManager';
import { Logger } from '../utils/Logger';
import { buildPaginationMeta, paginateArray, parsePaginationQuery } from '../utils/pagination';
import { SupabaseService } from '../utils/SupabaseService';

interface DevRouteDeps {
    app: express.Application;
    discordClient: DiscordClient;
    streamerRegistry: StreamerRegistry;
}

const serverStartedAt = Date.now();

export function registerDevRoutes({ app, discordClient, streamerRegistry }: DevRouteDeps): void {
    const limiter = rateLimit({
        windowMs: 1 * 60 * 1000,
        max: 100,
        message: { error: 'Too many requests.' },
        standardHeaders: true,
        legacyHeaders: false,
    });

    const { requireAuth, requireDevAdmin } = createAuthMiddlewares(discordClient);

    app.get('/api/dev/me', limiter, requireAuth, (req, res) => {
        res.json({ isDevAdmin: isDevAdmin(req.userId) });
    });

    app.get('/api/dev/overview', limiter, requireAuth, requireDevAdmin, async (_req, res) => {
        try {
            await discordClient.guildPremiumCache.ensureReady();

            const [overlayCount, guildSettingsCount] = await Promise.all([
                SupabaseService.countOverlayConfigs(),
                SupabaseService.countGuildSettings(),
            ]);

            const cacheStats = CacheManager.getStats();

            res.json({
                uptimeSeconds: Math.floor((Date.now() - serverStartedAt) / 1000),
                nodeEnv: process.env.NODE_ENV ?? 'development',
                discord: {
                    guildCount: discordClient.guilds.cache.size,
                    wsPing: discordClient.ws.ping,
                    ready: discordClient.isReady(),
                },
                streamers: {
                    connected: streamerRegistry.count(),
                },
                database: {
                    overlayCount,
                    guildSettingsCount,
                },
                cache: {
                    size: cacheStats.size,
                    hits: cacheStats.hits,
                    misses: cacheStats.misses,
                },
                premium: {
                    plusGuildCount: discordClient.guildPremiumCache.getCount(),
                },
            });
        } catch {
            res.status(500).json({ error: 'Failed to fetch dev overview' });
        }
    });

    app.get('/api/dev/streamers', limiter, requireAuth, requireDevAdmin, (req, res) => {
        const { page, pageSize } = parsePaginationQuery(req.query);
        const allStreamers = streamerRegistry.listAll().map((streamer) => ({
            username: streamer.username,
            guildId: streamer.guildId,
            socketId: streamer.socketId,
            overlayVersion: streamer.overlayVersion,
        }));
        const { items, total } = paginateArray(allStreamers, page, pageSize);

        res.json({
            streamers: items,
            pagination: buildPaginationMeta(total, page, pageSize),
        });
    });

    app.get('/api/dev/guilds', limiter, requireAuth, requireDevAdmin, async (req, res) => {
        try {
            const { page, pageSize } = parsePaginationQuery(req.query);
            await discordClient.guildPremiumCache.ensureReady();
            const overlayCounts = await SupabaseService.getOverlayCountsByGuild();

            const allGuilds = discordClient.guilds.cache
                .map((guild) => ({
                    id: guild.id,
                    name: guild.name,
                    memberCount: guild.memberCount,
                    overlayCount: overlayCounts[guild.id] ?? 0,
                    connectedCount: streamerRegistry.countByGuild(guild.id),
                    hasPlus: discordClient.guildPremiumCache.has(guild.id),
                }))
                .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

            const { items, total } = paginateArray(allGuilds, page, pageSize);

            res.json({
                guilds: items,
                pagination: buildPaginationMeta(total, page, pageSize),
            });
        } catch {
            res.status(500).json({ error: 'Failed to fetch guilds' });
        }
    });

    app.get('/api/dev/overlays', limiter, requireAuth, requireDevAdmin, async (req, res) => {
        const guildId = typeof req.query.guildId === 'string' ? req.query.guildId : undefined;
        const username = typeof req.query.username === 'string' ? req.query.username : undefined;
        const token = typeof req.query.token === 'string' ? req.query.token : undefined;
        const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
        const { page, pageSize } = parsePaginationQuery(req.query);

        if (!guildId && !username && !token && !userId) {
            res.status(400).json({ error: 'Au moins un filtre est requis (guildId, username, token ou userId).' });
            return;
        }

        try {
            const { overlays, total } = await SupabaseService.searchOverlayConfigs(
                {
                    guildId,
                    username,
                    token,
                    userId,
                },
                { page, pageSize },
            );

            res.json({
                overlays,
                pagination: buildPaginationMeta(total, page, pageSize),
            });
        } catch {
            res.status(500).json({ error: 'Failed to search overlays' });
        }
    });

    app.delete('/api/dev/overlays', limiter, requireAuth, requireDevAdmin, async (req, res) => {
        const token = req.body?.token as string | undefined;

        if (!token) {
            res.status(400).json({ error: 'Missing token' });
            return;
        }

        try {
            const success = await SupabaseService.deleteOverlayConfig(token);
            if (success) {
                res.json({ success: true });
            } else {
                res.status(500).json({ error: 'Failed to delete overlay' });
            }
        } catch {
            res.status(500).json({ error: 'Failed to delete overlay' });
        }
    });

    app.post('/api/dev/media/resolve', limiter, requireAuth, requireDevAdmin, async (req, res) => {
        const url = req.body?.url as string | undefined;

        if (!url || typeof url !== 'string') {
            res.status(400).json({ error: 'Missing url' });
            return;
        }

        try {
            const result = await Router.route(url.trim());
            res.json(result);
        } catch {
            res.status(500).json({ error: 'Failed to resolve media URL' });
        }
    });

    app.get('/api/dev/cache', limiter, requireAuth, requireDevAdmin, (_req, res) => {
        const stats = CacheManager.getStats();
        res.json({
            size: stats.size,
            hits: stats.hits,
            misses: stats.misses,
            evictions: stats.evictions,
        });
    });

    app.post('/api/dev/cache/clear', limiter, requireAuth, requireDevAdmin, (_req, res) => {
        CacheManager.clear();
        res.json({ success: true });
    });

    app.get('/api/dev/logs', limiter, requireAuth, requireDevAdmin, (req, res) => {
        const after = Math.max(0, Number.parseInt(String(req.query.after ?? '0'), 10) || 0);
        res.json({ logs: Logger.getDevLogs(after) });
    });

    app.get('/api/dev/logs/stream', requireAuth, requireDevAdmin, (req, res) => {
        const after = Math.max(0, Number.parseInt(String(req.query.after ?? '0'), 10) || 0);

        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        for (const entry of Logger.getDevLogs(after)) {
            res.write(`data: ${JSON.stringify(entry)}\n\n`);
        }

        const unsubscribe = Logger.subscribeDevLog((entry) => {
            res.write(`data: ${JSON.stringify(entry)}\n\n`);
        });

        const heartbeat = setInterval(() => {
            res.write(': heartbeat\n\n');
        }, 15_000);
        heartbeat.unref?.();

        req.on('close', () => {
            clearInterval(heartbeat);
            unsubscribe();
        });
    });

    app.post('/api/dev/logs/clear', limiter, requireAuth, requireDevAdmin, (_req, res) => {
        Logger.clearDevLogs();
        res.json({ success: true });
    });
}
