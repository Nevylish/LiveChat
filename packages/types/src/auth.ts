/** Authenticated Discord user for the config dashboard. */
export interface AuthUser {
    id: string;
    username?: string;
    globalName?: string;
    avatarUrl?: string;
}

/** Client-side session returned after Discord OAuth. */
export interface AuthSession {
    access_token: string;
    provider_token?: string;
    user: AuthUser;
}
