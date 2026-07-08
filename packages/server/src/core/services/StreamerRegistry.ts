import { TargetsManager } from '../utils/Targets';
import type { OverlayVersion } from '@livechat/types';

export class StreamerRegistry {
    private readonly streamers = new Map<string, TargetsManager.ConnectedStreamer>();

    add(socketId: string, username: string, guildId: string, overlayVersion: OverlayVersion): void {
        this.streamers.set(this.key(username, guildId), { socketId, username, guildId, overlayVersion });
    }

    remove(username: string, guildId: string): void {
        this.streamers.delete(this.key(username, guildId));
    }

    get(username: string, guildId: string): TargetsManager.ConnectedStreamer | undefined {
        return this.streamers.get(this.key(username, guildId));
    }

    has(username: string, guildId: string): boolean {
        return this.streamers.has(this.key(username, guildId));
    }

    findBySocketId(socketId: string): TargetsManager.ConnectedStreamer | undefined {
        for (const streamer of this.streamers.values()) {
            if (streamer.socketId === socketId) {
                return streamer;
            }
        }
        return undefined;
    }

    getByGuild(guildId: string): TargetsManager.ConnectedStreamer[] {
        return Array.from(this.streamers.values()).filter((streamer) => streamer.guildId === guildId);
    }

    count(): number {
        return this.streamers.size;
    }

    countByGuild(guildId: string): number {
        return this.getByGuild(guildId).length;
    }

    listAll(): TargetsManager.ConnectedStreamer[] {
        return Array.from(this.streamers.values());
    }

    private key(username: string, guildId: string): string {
        return `${username}:${guildId}`;
    }
}
