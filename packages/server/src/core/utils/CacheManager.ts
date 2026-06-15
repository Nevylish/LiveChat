/*
    Le système garde en cache seulement pendant 50 minutes le lien du proxy. 
    On pourrait optimiser en gardant le lien de la plateforme et non du proxy pendant plus longtemps.
    Pour le moment c'est pas prioritaire.
*/

import { Logger } from './Logger';

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

export class CacheManager {
    private static cache = new Map<string, CacheEntry<any>>();
    private static pendingPromises = new Map<string, Promise<any>>();

    static {
        setInterval(
            () => {
                const now = Date.now();
                for (const [key, value] of this.cache.entries()) {
                    if (value.expiresAt <= now) {
                        this.cache.delete(key);
                    }
                }
            },
            5 * 60 * 1000,
        );
    }

    /**
     * Récupère une valeur dans le cache ou exécute la fonction pour la récupérer.
     * @param key Clé unique (ex: l'URL d'origine)
     * @param fetcher Fonction asynchrone pour récupérer la donnée si elle n'est pas en cache
     * @param ttlMs Durée de vie en millisecondes (par défaut: 50 minutes)
     */
    public static async getOrFetch<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttlMs: number = 50 * 60 * 1000,
    ): Promise<T> {
        const now = Date.now();
        const cached = this.cache.get(key);

        if (cached && cached.expiresAt > now) {
            Logger.warn('CacheManager', 'Cache hit', { key });
            return cached.data;
        }

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
