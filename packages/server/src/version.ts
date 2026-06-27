import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const version: string = JSON.parse(
    readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
).version;
