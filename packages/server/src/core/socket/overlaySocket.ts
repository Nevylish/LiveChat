import { EventEmitter } from 'events';
import { Server, Socket } from 'socket.io';
import DiscordClient from '../DiscordClient';
import { checkGuildAccess } from '../middlewares/auth';
import { OverlayTokenService } from '../services/OverlayTokenService';
import { StreamerRegistry } from '../services/StreamerRegistry';
import { Logger } from '../utils/Logger';
import { SupabaseService } from '../utils/SupabaseService';
import { Validations } from '../utils/Validations';

interface OverlaySocketDeps {
    io: Server;
    discordClient: DiscordClient;
    streamerRegistry: StreamerRegistry;
    events: EventEmitter;
}

export function registerOverlaySocket({ io, discordClient, streamerRegistry, events }: OverlaySocketDeps): void {
    io.on('connection', (socket) => {
        socket.on('register', async (data: { username?: string; guildId?: string; token?: string }) => {
            const identity = await OverlayTokenService.resolveRegisterIdentity(data);
            if (identity.error) {
                emitSocketError(socket, identity.error, data);
                return;
            }

            const username = identity.username;
            const guildId = identity.guildId;

            if (!username || !guildId) {
                emitSocketError(
                    socket,
                    'Le lien est invalide. Rendez-vous sur livechat.nevylish.fr pour configurer votre overlay.',
                    {
                        username,
                        guildId,
                    },
                );
                return;
            }

            const usernameValidation = Validations.validateUsername(username);
            if (!usernameValidation.valid) {
                emitSocketError(socket, usernameValidation.error!, { username, guildId });
                return;
            }

            const guildIdValidation = Validations.validateGuildId(guildId);
            if (!guildIdValidation.valid) {
                emitSocketError(socket, guildIdValidation.error!, { username, guildId });
                return;
            }

            try {
                const config = data.token
                    ? await SupabaseService.getOverlayConfigByToken(data.token)
                    : await SupabaseService.getOverlayConfig(guildId, username);
                if (config) {
                    const allowed = await checkGuildAccess(discordClient, guildId, config.user_id);
                    if (!allowed) {
                        emitSocketError(
                            socket,
                            "Le compte Discord associé à cet overlay n'a pas le rôle requis sur Discord pour utiliser LiveChat.",
                            { username, guildId },
                        );
                        return;
                    }
                }
            } catch (err) {
                Logger.error('LiveChatServer', 'Error checking role authorization during registration', err);
            }

            discordClient.guilds
                .fetch(guildId)
                .then(async (guild) => {
                    if (!guild) {
                        emitSocketError(
                            socket,
                            "Le bot Discord n'est pas présent dans le serveur inscrit. Ajoutez le bot puis relancez.",
                            { username, guildId },
                        );
                        return;
                    }

                    if (streamerRegistry.has(username, guildId)) {
                        const existingData = streamerRegistry.get(username, guildId);
                        if (existingData) {
                            const existingSocket = io.sockets.sockets.get(existingData.socketId);
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
                            streamerRegistry.remove(username, guildId);
                        }
                    }

                    const streamersConnectedLength = streamerRegistry.countByGuild(guildId);

                    if (streamersConnectedLength >= 20) {
                        emitSocketError(socket, 'Le nombre maximum de streameurs est atteint sur ce serveur Discord.', {
                            username,
                            guildId,
                            slots: streamersConnectedLength,
                        });
                        return;
                    }

                    const isPremiumGuild = await discordClient.hasGuildPremiumSubscription(guildId);
                    if (!isPremiumGuild && streamersConnectedLength >= 10) {
                        emitSocketError(
                            socket,
                            "Le nombre maximum de streameurs est atteint pour l'abonnement Gratuit.",
                            { username, guildId, slots: streamersConnectedLength },
                        );
                        return;
                    }

                    if (!socket.connected) {
                        Logger.warn('LiveChatServer', `Socket disconnected during registration for ${username}`, {
                            username,
                            guildId,
                            guildName: guild.name ?? 'Unknown',
                            socketId: socket.id,
                        });
                        return;
                    }

                    streamerRegistry.add(socket.id, username, guildId);
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
                })
                .catch((err) => {
                    Logger.error('LiveChatServer', 'Error fetching guild', err);
                    emitSocketError(
                        socket,
                        "Le bot Discord n'est pas présent dans le serveur inscrit. Ajoutez le bot puis relancez OBS Studio.",
                        { username, guildId },
                    );
                });
        });

        socket.on('disconnect', () => {
            Logger.log('LiveChatServer', 'Socket disconnected', { socketId: socket.id });
            const streamer = streamerRegistry.findBySocketId(socket.id);
            if (streamer) {
                streamerRegistry.remove(streamer.username, streamer.guildId);
                events.emit('streamerDisconnected', socket.id);
                Logger.log('LiveChatServer', `${streamer.username} is no longer connected to LiveChat`, {
                    username: streamer.username,
                    guildId: streamer.guildId,
                    socketId: socket.id,
                });
            }
        });

        socket.on('started', (interactionId: string, duration?: number) => {
            events.emit('started', interactionId, duration);
        });

        socket.on('ended', (interactionId: string) => {
            events.emit('ended', interactionId);
        });
    });
}

function emitSocketError(socket: Socket, message: string, context?: Record<string, unknown>): void {
    Logger.warn('LiveChatServer', message, context ?? {});
    socket.emit('updateConnectionStatus', false, message, 300000);
    socket.disconnect();
}
