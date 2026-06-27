import type { Client, Entitlement } from 'discord.js';
import { Logger } from '../utils/Logger';

export class GuildPremiumCache {
    private plusGuildIds = new Set<string>();
    private initialized = false;
    private refreshPromise: Promise<void> | null = null;
    private readonly skuPlusId: string;

    constructor(private readonly client: Client) {
        this.skuPlusId = process.env.SKU_PLUS_ID!;
    }

    public has(guildId: string): boolean {
        const hit = this.plusGuildIds.has(guildId);
        Logger.debug('GuildPremiumCache', hit ? 'Cache hit' : 'Cache miss', {
            guildId,
            plusGuildCount: this.plusGuildIds.size,
        });
        return hit;
    }

    public async ensureReady(): Promise<void> {
        if (this.initialized) {
            Logger.debug('GuildPremiumCache', 'Already initialized, skipping ensureReady');
            return;
        }

        if (this.refreshPromise) {
            Logger.debug('GuildPremiumCache', 'Waiting for warm-up to complete');
            await this.refreshPromise.catch(() => {});
            return;
        }

        Logger.debug('GuildPremiumCache', 'Not initialized and no warm-up in progress');
    }

    public warmUp(): Promise<void> {
        if (this.refreshPromise) {
            Logger.debug('GuildPremiumCache', 'Deduping warm-up, waiting for existing promise');
            return this.refreshPromise;
        }

        Logger.debug('GuildPremiumCache', 'Starting warm-up');
        this.refreshPromise = this.loadAll()
            .then(() => {
                this.initialized = true;
                Logger.debug('GuildPremiumCache', 'Warm-up complete', {
                    plusGuildCount: this.plusGuildIds.size,
                });
            })
            .catch((err) => {
                this.refreshPromise = null;
                throw err;
            });
        return this.refreshPromise;
    }

    public refresh(): Promise<void> {
        Logger.debug('GuildPremiumCache', 'Refreshing Plus entitlements');
        return this.loadAll().catch((err) => {
            Logger.error('GuildPremiumCache', 'Failed to refresh Plus entitlements', { err });
        });
    }

    public handleEntitlementChange(entitlement: Entitlement): void {
        if (!this.initialized) {
            Logger.debug('GuildPremiumCache', 'Ignoring entitlement change, cache not initialized yet', {
                entitlementId: entitlement.id,
            });
            return;
        }

        if (entitlement.skuId !== this.skuPlusId || !entitlement.isGuildSubscription()) {
            Logger.debug('GuildPremiumCache', 'Ignoring entitlement change, not a Plus guild subscription', {
                entitlementId: entitlement.id,
                skuId: entitlement.skuId,
                guildId: entitlement.guildId,
            });
            return;
        }

        if (entitlement.isActive()) {
            this.plusGuildIds.add(entitlement.guildId);
            Logger.debug('GuildPremiumCache', 'Plus entitlement added', {
                guildId: entitlement.guildId,
                entitlementId: entitlement.id,
                plusGuildCount: this.plusGuildIds.size,
            });
            return;
        }

        this.plusGuildIds.delete(entitlement.guildId);
        Logger.debug('GuildPremiumCache', 'Plus entitlement removed', {
            guildId: entitlement.guildId,
            entitlementId: entitlement.id,
            plusGuildCount: this.plusGuildIds.size,
        });
    }

    public handleEntitlementDelete(entitlement: Entitlement): void {
        if (!this.initialized) {
            Logger.debug('GuildPremiumCache', 'Ignoring entitlement delete, cache not initialized yet', {
                entitlementId: entitlement.id,
            });
            return;
        }

        if (entitlement.skuId !== this.skuPlusId || !entitlement.isGuildSubscription()) {
            Logger.debug('GuildPremiumCache', 'Ignoring entitlement delete, not a Plus guild subscription', {
                entitlementId: entitlement.id,
                skuId: entitlement.skuId,
                guildId: entitlement.guildId,
            });
            return;
        }

        this.plusGuildIds.delete(entitlement.guildId);
        Logger.debug('GuildPremiumCache', 'Plus entitlement deleted', {
            guildId: entitlement.guildId,
            entitlementId: entitlement.id,
            plusGuildCount: this.plusGuildIds.size,
        });
    }

    private async loadAll(): Promise<void> {
        if (!this.client.application) {
            this.plusGuildIds = new Set();
            Logger.debug('GuildPremiumCache', 'Application unavailable, cleared Plus guild cache');
            return;
        }

        const next = new Set<string>();
        let before: string | undefined;
        let page = 0;

        Logger.debug('GuildPremiumCache', 'Fetching Plus entitlements from Discord', {
            skuPlusId: this.skuPlusId,
        });

        while (true) {
            page++;
            const batch = await this.client.application.entitlements.fetch({
                skus: [this.skuPlusId],
                excludeDeleted: true,
                excludeEnded: true,
                limit: 100,
                before,
                cache: false,
            });

            let addedInBatch = 0;
            for (const entitlement of batch.values()) {
                if (this.isActivePlusGuildEntitlement(entitlement) && entitlement.guildId) {
                    next.add(entitlement.guildId);
                    addedInBatch++;
                }
            }

            Logger.debug('GuildPremiumCache', 'Fetched entitlements page', {
                page,
                batchSize: batch.size,
                activePlusGuildsInBatch: addedInBatch,
                before,
            });

            if (batch.size < 100) break;

            const lastId = batch.last()?.id;
            if (!lastId || lastId === before) break;
            before = lastId;
        }

        this.plusGuildIds = next;
        Logger.debug('GuildPremiumCache', 'Plus entitlements loaded', {
            plusGuildCount: next.size,
            pages: page,
        });
    }

    private isActivePlusGuildEntitlement(entitlement: Entitlement): boolean {
        return (
            entitlement.skuId === this.skuPlusId &&
            entitlement.isGuildSubscription() &&
            entitlement.isActive()
        );
    }
}
