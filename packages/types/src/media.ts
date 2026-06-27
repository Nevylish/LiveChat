export type MediaKind = 'image' | 'video' | 'audio' | 'null';

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const;
export const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mkv', 'mov'] as const;
export const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg'] as const;

export type ImageExtension = (typeof IMAGE_EXTENSIONS)[number];
export type VideoExtension = (typeof VIDEO_EXTENSIONS)[number];
export type AudioExtension = (typeof AUDIO_EXTENSIONS)[number];

export function getMediaKindFromExtension(extension: string): MediaKind {
    const normalized = extension.toLowerCase();
    if ((IMAGE_EXTENSIONS as readonly string[]).includes(normalized)) return 'image';
    if ((VIDEO_EXTENSIONS as readonly string[]).includes(normalized)) return 'video';
    if ((AUDIO_EXTENSIONS as readonly string[]).includes(normalized)) return 'audio';
    return 'null';
}

export function getMediaKindFromUrl(url: string): MediaKind {
    try {
        const parsedUrl = new URL(url);
        const extension = parsedUrl.pathname.split('.').pop() ?? '';
        return getMediaKindFromExtension(extension);
    } catch {
        return 'null';
    }
}

export function getMediaKindFromProxyType(type: string | null): MediaKind {
    if (type === 'image' || type === 'video' || type === 'audio') {
        return type;
    }
    return 'null';
}
