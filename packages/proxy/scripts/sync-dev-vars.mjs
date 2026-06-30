import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const proxyDir = path.resolve(__dirname, '..');
const rootEnvPath = path.resolve(proxyDir, '../../.env');
const devVarsPath = path.join(proxyDir, '.dev.vars');

function parseEnvFile(content) {
    const vars = {};
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        vars[key] = value;
    }
    return vars;
}

if (!fs.existsSync(rootEnvPath)) {
    console.error(`[proxy] Root .env not found at ${rootEnvPath}`);
    process.exit(1);
}

const env = parseEnvFile(fs.readFileSync(rootEnvPath, 'utf8'));
const secret = env.PROXY_SECRET;

if (!secret) {
    console.error('[proxy] PROXY_SECRET is missing or empty in root .env');
    process.exit(1);
}

fs.writeFileSync(devVarsPath, `PROXY_SECRET=${secret}\n`, 'utf8');
console.log('[proxy] Synced PROXY_SECRET from root .env to .dev.vars');
