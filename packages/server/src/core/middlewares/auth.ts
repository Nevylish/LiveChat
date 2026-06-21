import { Request, Response, NextFunction } from 'express';
import DiscordClient from '../DiscordClient';
import { SupabaseService, OverlayConfigRow } from '../utils/SupabaseService';

declare global {
    namespace Express {
        interface Request {
            overlayConfig?: OverlayConfigRow;
        }
    }
}

/**
 * Checks if a Discord user is an administrator or has ManageGuild permission.
 */
export async function checkAdminAccess(discordClient: DiscordClient, guildId: string, userId: string): Promise<boolean> {
    try {
        const guild = discordClient.guilds.cache.get(guildId) || await discordClient.guilds.fetch(guildId).catch(() => null);
        if (!guild) return false;

        if (guild.ownerId === userId) return true;

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) return false;

        return member.permissions.has('Administrator') || member.permissions.has('ManageGuild');
    } catch (e) {
        console.error('Error checking admin status', e);
        return false;
    }
}

/**
 * Checks if a user is allowed to use LiveChat on a specific guild.
 */
export async function checkGuildAccess(
    discordClient: DiscordClient,
    guildId: string,
    userId: string | null | undefined
): Promise<boolean> {
    try {
        if (!userId) return true; // Backward compatibility for legacy configurations without user_id

        const guild = discordClient.guilds.cache.get(guildId) || await discordClient.guilds.fetch(guildId).catch(() => null);
        if (!guild) return false;

        if (guild.ownerId === userId) return true;

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) return false;

        if (member.permissions.has('Administrator') || member.permissions.has('ManageGuild')) return true;

        const settings = await SupabaseService.getGuildSettings(guildId);
        if (!settings || !settings.required_role_id) {
            return true;
        }

        return member.roles.cache.has(settings.required_role_id);
    } catch (e) {
        console.error('Error checking user allowed status', e);
        return false;
    }
}

/**
 * Factory to generate auth middlewares with the DiscordClient dependency injected.
 */
export function createAuthMiddlewares(discordClient: DiscordClient) {
    return {
        /**
         * Middleware to check if the user is an admin of the guild.
         */
        requireAdmin: (req: Request, res: Response, next: NextFunction): void => {
            const guildId = (req.query.guildId || req.body.guildId) as string;
            const userId = (req.query.userId || req.body.userId) as string;

            if (!guildId || !userId) {
                res.status(400).json({ error: 'Missing guildId or userId' });
                return;
            }

            checkAdminAccess(discordClient, guildId, userId)
                .then((isAdmin) => {
                    if (isAdmin) {
                        next();
                    } else {
                        res.status(403).json({ error: 'Vous devez être administrateur du serveur pour effectuer cette action.' });
                    }
                })
                .catch(() => {
                    res.status(500).json({ error: 'Internal server error checking permissions' });
                });
        },

        /**
         * Middleware to check if the user is allowed to use LiveChat on the guild.
         */
        requireGuildAccess: (req: Request, res: Response, next: NextFunction): void => {
            const guildId = (req.query.guildId || req.body.guildId || req.overlayConfig?.guild_id) as string;
            const userId = (req.query.userId || req.body.userId) as string;

            if (!guildId || !userId) {
                res.status(400).json({ error: 'Missing guildId or userId' });
                return;
            }

            checkGuildAccess(discordClient, guildId, userId)
                .then((allowed) => {
                    if (allowed) {
                        next();
                    } else {
                        res.status(403).json({ error: "Vous n'êtes pas autorisé à utiliser LiveChat sur ce serveur. Un rôle obligatoire est requis." });
                    }
                })
                .catch(() => {
                    res.status(500).json({ error: 'Internal server error checking permissions' });
                });
        },

        /**
         * Middleware to verify if the user is the creator of the target overlay config.
         * Attaches overlayConfig to req for reuse in subsequent middlewares or routes.
         */
        requireOverlayOwnership: (req: Request, res: Response, next: NextFunction): void => {
            const token = (req.body.token || req.query.token) as string;
            const userId = (req.body.userId || req.query.userId) as string;

            if (!token || !userId) {
                res.status(400).json({ error: 'Missing token or userId' });
                return;
            }

            SupabaseService.getOverlayConfigByToken(token)
                .then((config) => {
                    if (!config) {
                        res.status(404).json({ error: 'Overlay introuvable.' });
                        return;
                    }

                    if (config.user_id !== userId) {
                        const action = req.path.includes('delete') ? 'supprimer' : 'modifier';
                        res.status(403).json({ error: `Vous ne possédez pas les droits requis pour ${action} cet overlay.` });
                        return;
                    }

                    req.overlayConfig = config;
                    next();
                })
                .catch(() => {
                    res.status(500).json({ error: 'Internal server error validating overlay ownership' });
                });
        }
    };
}
