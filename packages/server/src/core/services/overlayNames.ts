import type { OverlayConfigRow } from '@livechat/types';

export function isOverlayNameTaken(
    configs: OverlayConfigRow[],
    username: string,
    excludeToken?: string,
): boolean {
    const normalized = username.toLowerCase();
    return configs.some(
        (config) =>
            config.username.toLowerCase() === normalized && (!excludeToken || config.token !== excludeToken),
    );
}
