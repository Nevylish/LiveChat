import { Logger } from './Logger';

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
    isNegative: boolean;
}

export interface GetOrFetchOptions {
    /** Durée de vie en ms pour un résultat trouvé (par défaut: 1 heure). */
    ttlMs?: number;
    /**
     * Durée de vie en ms pour un résultat "négatif" (null/undefined), afin d'éviter
     * de marteler une API externe qui vient de répondre qu'il n'y avait rien à trouver.
     * Mettre à 0 pour désactiver le negative caching (défaut: 2 minutes).
     */
    negativeTtlMs?: number;
}

/**
 * Cache en mémoire générique avec déduplication des requêtes en vol,
 * éviction LRU bornée en taille, et negative caching court.
 *
 * Le système garde en cache le lien du proxy (et non celui de la plateforme d'origine),
 * d'où un TTL par défaut de 1 heure plutôt qu'une durée plus longue.
 */
export class CacheManager {
    private static cache = new Map<string, CacheEntry<any>>();
    private static pendingPromises = new Map<string, Promise<any>>();

    private static maxSize = 5000;

    private static stats = {
        hits: 0,
        misses: 0,
        negativeHits: 0,
        dedupedRequests: 0,
        evictions: 0,
        expirations: 0,
    };

    private static cleanupTimer: ReturnType<typeof setInterval> | null = null;

    static {
        this.cleanupTimer = setInterval(
            () => {
                const now = Date.now();
                let expired = 0;
                for (const [key, value] of this.cache.entries()) {
                    if (value.expiresAt <= now) {
                        this.cache.delete(key);
                        expired++;
                    }
                }
                if (expired > 0) {
                    this.stats.expirations += expired;
                    Logger.debug('CacheManager', 'Periodic cleanup removed expired entries', {
                        removed: expired,
                        remaining: this.cache.size,
                    });
                }
            },
            5 * 60 * 1000,
        );
        // Ne bloque pas l'arrêt propre du process (cf. Logger.init).
        this.cleanupTimer.unref?.();
    }

    /**
     * Définit la taille maximale du cache. Si la nouvelle taille est plus petite
     * que le nombre d'entrées actuel, les plus anciennes (LRU) sont évincées.
     */
    public static setMaxSize(maxSize: number): void {
        this.maxSize = Math.max(1, maxSize);
        this.evictIfNeeded();
    }

    /**
     * Récupère une valeur dans le cache ou exécute la fonction pour la récupérer.
     * Les appels concurrents pour la même clé partagent la même promesse (déduplication).
     *
     * @param key Clé unique (ex: l'URL d'origine)
     * @param fetcher Fonction asynchrone pour récupérer la donnée si elle n'est pas en cache
     * @param ttlMsOrOptions Durée de vie en millisecondes (défaut: 1 heure), ou objet d'options
     */
    public static async getOrFetch<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttlMsOrOptions: number | GetOrFetchOptions = 60 * 60 * 1000,
    ): Promise<T> {
        const options: GetOrFetchOptions =
            typeof ttlMsOrOptions === 'number' ? { ttlMs: ttlMsOrOptions } : ttlMsOrOptions;
        const ttlMs = options.ttlMs ?? 60 * 60 * 1000;
        const negativeTtlMs = options.negativeTtlMs ?? 2 * 60 * 1000;

        const now = Date.now();
        const cached = this.cache.get(key);

        if (cached && cached.expiresAt > now) {
            this.cache.delete(key);
            this.cache.set(key, cached);

            if (cached.isNegative) {
                this.stats.negativeHits++;
            } else {
                this.stats.hits++;
            }
            Logger.debug('CacheManager', cached.isNegative ? 'Negative cache hit' : 'Cache hit', { key });
            return cached.data;
        }

        const pending = this.pendingPromises.get(key);
        if (pending) {
            this.stats.dedupedRequests++;
            Logger.debug('CacheManager', 'Deduping request, waiting for existing promise', { key });
            return pending as Promise<T>;
        }

        this.stats.misses++;
        Logger.debug('CacheManager', 'Cache miss, fetching data', { key });

        const promise = fetcher()
            .then((data) => {
                const isNegative = data === null || data === undefined;
                const ttl = isNegative ? negativeTtlMs : ttlMs;

                if (!isNegative || ttl > 0) {
                    this.set(key, data, ttl, isNegative);
                }

                this.pendingPromises.delete(key);
                return data;
            })
            .catch((err) => {
                this.pendingPromises.delete(key);
                throw err;
            });

        this.pendingPromises.set(key, promise);
        return promise;
    }

    public static get<T>(key: string): T | undefined {
        const now = Date.now();
        const cached = this.cache.get(key);

        if (cached && cached.expiresAt > now) {
            this.cache.delete(key);
            this.cache.set(key, cached);

            if (cached.isNegative) {
                this.stats.negativeHits++;
            } else {
                this.stats.hits++;
            }
            Logger.debug('CacheManager', cached.isNegative ? 'Negative cache hit' : 'Cache hit', { key });
            return cached.data;
        }
        return undefined;
    }

    public static set(key: string, data: any, ttlMs: number, isNegative = false): void {
        this.cache.delete(key);
        this.cache.set(key, { data, expiresAt: Date.now() + ttlMs, isNegative });
        this.evictIfNeeded();
    }

    private static evictIfNeeded(): void {
        while (this.cache.size > this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey === undefined) break;
            this.cache.delete(oldestKey);
            this.stats.evictions++;
        }
    }

    public static has(key: string): boolean {
        const cached = this.cache.get(key);
        return !!cached && cached.expiresAt > Date.now();
    }

    public static delete(key: string): boolean {
        return this.cache.delete(key);
    }
}
