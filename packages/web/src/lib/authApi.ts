import { API_BASE_URL } from './constants';

export function getDiscordLoginUrl(returnPath = '/auth/callback'): string {
    const returnTo = `${window.location.origin}${returnPath}`;
    return `${API_BASE_URL}/api/auth/discord?returnTo=${encodeURIComponent(returnTo)}`;
}

export function openDiscordLoginPopup(): void {
    const width = 600;
    const height = 800;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(
        getDiscordLoginUrl(),
        'discord-login',
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=no`,
    );
}
