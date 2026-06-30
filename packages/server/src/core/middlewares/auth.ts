import { Request, Response, NextFunction } from 'express';
import DiscordClient from '../DiscordClient';
import { AuthService } from '../services/AuthService';
import { SupabaseService, OverlayConfigRow } from '../utils/SupabaseService';

declare global {
    namespace Express {
        interface Request {
            overlayConfig?: OverlayConfigRow;
            userId?: string;
        }
    }
}

function getDevAdminDiscordIds(): string[] {
    return (process.env.DEV_ADMIN_DISCORD_IDS ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
}

export function isDevAdmin(userId: string | undefined): boolean {
    if (!userId) return false;
    return getDevAdminDiscordIds().includes(userId);
}

export async function checkAdminAccess(
    discordClient: DiscordClient,
    guildId: string,
    userId: string,
): Promise<boolean> {
    try {
        const guild =
            discordClient.guilds.cache.get(guildId) || (await discordClient.guilds.fetch(guildId).catch(() => null));
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

export async function checkGuildAccess(
    discordClient: DiscordClient,
    guildId: string,
    userId: string | null | undefined,
): Promise<boolean> {
    try {
        if (!userId) return true;

        const guild =
            discordClient.guilds.cache.get(guildId) || (await discordClient.guilds.fetch(guildId).catch(() => null));
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

export function createAuthMiddlewares(discordClient: DiscordClient) {
    return {
        requireAuth: (req: Request, res: Response, next: NextFunction): void => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({ error: 'Missing or malformed Authorization header' });
                return;
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                res.status(401).json({ error: 'Missing token in Authorization header' });
                return;
            }

            AuthService.verifyAccessToken(token)
                .then((user) => {
                    if (!user) {
                        res.status(401).json({ error: 'Session invalide ou expirée.' });
                        return;
                    }

                    req.userId = user.id;
                    next();
                })
                .catch((err) => {
                    console.error('Error in requireAuth middleware', err);
                    res.status(500).json({ error: 'Internal server error during authentication' });
                });
        },

        requireAdmin: (req: Request, res: Response, next: NextFunction): void => {
            const guildId = (req.query.guildId || req.body.guildId) as string;
            const userId = req.userId;

            if (!guildId) {
                res.status(400).json({ error: 'Missing guildId' });
                return;
            }
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized: User not authenticated' });
                return;
            }

            checkAdminAccess(discordClient, guildId, userId)
                .then((isAdmin) => {
                    if (isAdmin) {
                        next();
                    } else {
                        res.status(403).json({
                            error: 'Vous devez être administrateur du serveur pour effectuer cette action.',
                        });
                    }
                })
                .catch(() => {
                    res.status(500).json({ error: 'Internal server error checking permissions' });
                });
        },

        requireGuildAccess: (req: Request, res: Response, next: NextFunction): void => {
            const guildId = (req.query.guildId || req.body.guildId || req.overlayConfig?.guild_id) as string;
            const userId = req.userId;

            if (!guildId) {
                res.status(400).json({ error: 'Missing guildId' });
                return;
            }
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized: User not authenticated' });
                return;
            }

            checkGuildAccess(discordClient, guildId, userId)
                .then((allowed) => {
                    if (allowed) {
                        next();
                    } else {
                        res.status(403).json({
                            error: "Vous n'êtes pas autorisé à utiliser LiveChat sur ce serveur. Un rôle obligatoire est requis.",
                        });
                    }
                })
                .catch(() => {
                    res.status(500).json({ error: 'Internal server error checking permissions' });
                });
        },

        requireDevAdmin: (req: Request, res: Response, next: NextFunction): void => {
            const userId = req.userId;

            if (!userId) {
                res.status(401).json({ error: 'Unauthorized: User not authenticated' });
                return;
            }

            if (isDevAdmin(userId)) {
                next();
                return;
            }

            res.status(403).json({ error: 'Accès réservé aux développeurs.' });
        },

        requireOverlayOwnership: (req: Request, res: Response, next: NextFunction): void => {
            const token = (req.body.token || req.query.token) as string;
            const userId = req.userId;

            if (!token) {
                res.status(400).json({ error: 'Missing token' });
                return;
            }
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized: User not authenticated' });
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
                        res.status(403).json({
                            error: `Vous ne possédez pas les droits requis pour ${action} cet overlay.`,
                        });
                        return;
                    }

                    req.overlayConfig = config;
                    next();
                })
                .catch(() => {
                    res.status(500).json({ error: 'Internal server error validating overlay ownership' });
                });
        },
    };
}
