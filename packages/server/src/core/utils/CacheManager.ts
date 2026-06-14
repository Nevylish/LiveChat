import { Logger } from './Logger';

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

export class CacheManager {
    private static cache = new Map<string, CacheEntry<any>>();
    private static pendingPromises = new Map<string, Promise<any>>();

    /**
     * Récupère une valeur dans le cache ou exécute la fonction pour la récupérer.
     * @param key Clé unique (ex: l'URL d'origine)
     * @param fetcher Fonction asynchrone pour récupérer la donnée si elle n'est pas en cache
     * @param ttlMs Durée de vie en millisecondes (par défaut: 1 heure)
     */
    public static async getOrFetch<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttlMs: number = 1 * 60 * 60 * 1000,
    ): Promise<T> {
        const now = Date.now();
        const cached = this.cache.get(key);

        if (cached && cached.expiresAt > now) {
            Logger.warn('CacheManager', 'Cache hit', { key });
            return cached.data;
        }

        // Si la donnée est déjà en train d'être récupérée par une autre requête, on attend la même promesse
        if (this.pendingPromises.has(key)) {
            Logger.warn('CacheManager', 'Deduping request, waiting for existing promise', { key });
            return this.pendingPromises.get(key) as Promise<T>;
        }

        Logger.warn('CacheManager', 'Cache miss, fetching data', { key });

        const promise = fetcher()
            .then((data) => {
                if (data !== null && data !== undefined) {
                    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
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
}
