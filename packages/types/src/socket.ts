/** Minimal Discord user shape sent to the overlay via Socket.IO `broadcast`. */
export interface OverlayBroadcastUser {
    id: string;
    username: string;
    globalName?: string | null;
    displayName?: string | null;
    avatar?: string | null;
}

/** Payload for the `broadcast` Socket.IO event (server → overlay). */
export interface BroadcastPayload {
    content: string;
    from: OverlayBroadcastUser;
    fullscreen: boolean;
    anonymous: boolean;
    text: string | null;
    interactionId: string;
}

/** Payload for the v1 `register` Socket.IO event (legacy overlay). */
export interface RegisterPayloadV1 {
    username: string;
    guildId: string;
    token?: string;
}

/** Payload for the v2 `register` Socket.IO event. */
export interface RegisterPayloadV2 {
    token: string;
}

export type OverlayVersion = 'v1' | 'v2';
