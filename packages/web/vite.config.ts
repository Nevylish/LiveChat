import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import type { Plugin } from 'vite';

const MIME_TYPES: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
};

/**
 * Plugin pour servir les assets partagés (shared/assets) pendant le développement.
 * En production, c'est le serveur Express qui s'en charge.
 */
function serveSharedAssets(): Plugin {
    const sharedDir = path.resolve(__dirname, '../../shared/assets');

    return {
        name: 'serve-shared-assets',
        configureServer(server) {
            server.middlewares.use('/assets', async (req, res, next) => {
                const filePath = join(sharedDir, req.url || '');
                if (existsSync(filePath) && !filePath.includes('..')) {
                    try {
                        const ext = extname(filePath).toLowerCase();
                        const content = await readFile(filePath);
                        res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
                        res.setHeader('Cache-Control', 'no-cache');
                        res.end(content);
                    } catch {
                        next();
                    }
                } else {
                    next();
                }
            });
        },
    };
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss(), serveSharedAssets()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
