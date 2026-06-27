import { SignJWT, jwtVerify } from 'jose';
import { randomUUID } from 'crypto';
import fetch from 'node-fetch';
import { Constants } from '../utils/Constants';
import { Logger } from '../utils/Logger';

export interface DiscordAuthUser {
    id: string;
    username?: string;
    globalName?: string;
    avatarUrl?: string;
}

interface OAuthStateEntry {
    returnTo: string;
    expiresAt: number;
}

interface DiscordTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
}

interface DiscordUserResponse {
    id: string;
    username: string;
    global_name?: string | null;
    avatar?: string | null;
}

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const JWT_TTL = '7d';

export class AuthService {
    private static oauthStates = new Map<string, OAuthStateEntry>();

    private static getJwtSecret(): Uint8Array {
        const secret = process.env.AUTH_JWT_SECRET;
        if (!secret) {
            throw new Error('AUTH_JWT_SECRET is not defined');
        }
        return new TextEncoder().encode(secret);
    }

    private static getDiscordClientId(): string {
        return process.env.DISCORD_CLIENT_ID!;
    }

    private static getDiscordClientSecret(): string {
        return process.env.DISCORD_CLIENT_SECRET!;
    }

    private static getRedirectUri(): string {
        return `${Constants.getBaseUrl()}/api/auth/discord/callback`;
    }

    private static cleanupExpiredStates(): void {
        const now = Date.now();
        for (const [state, entry] of this.oauthStates.entries()) {
            if (entry.expiresAt <= now) {
                this.oauthStates.delete(state);
            }
        }
    }

    private static isAllowedReturnTo(returnTo: string): boolean {
        try {
            const url = new URL(returnTo);
            const allowed = new URL(Constants.getFrontendUrl());
            return url.origin === allowed.origin && url.pathname.startsWith('/auth/callback');
        } catch {
            return false;
        }
    }

    public static createOAuthState(returnTo: string): string {
        if (!this.isAllowedReturnTo(returnTo)) {
            throw new Error('Invalid returnTo URL');
        }

        this.cleanupExpiredStates();
        const state = randomUUID();
        this.oauthStates.set(state, {
            returnTo,
            expiresAt: Date.now() + OAUTH_STATE_TTL_MS,
        });
        return state;
    }

    public static consumeOAuthState(state: string): string | null {
        this.cleanupExpiredStates();
        const entry = this.oauthStates.get(state);
        if (!entry || entry.expiresAt <= Date.now()) {
            this.oauthStates.delete(state);
            return null;
        }
        this.oauthStates.delete(state);
        return entry.returnTo;
    }

    public static getDiscordAuthorizeUrl(returnTo: string): string {
        const state = this.createOAuthState(returnTo);
        const params = new URLSearchParams({
            client_id: this.getDiscordClientId(),
            redirect_uri: this.getRedirectUri(),
            response_type: 'code',
            scope: 'identify guilds',
            state,
        });
        return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    }

    public static async exchangeCode(code: string): Promise<{ user: DiscordAuthUser; providerToken: string }> {
        const body = new URLSearchParams({
            client_id: this.getDiscordClientId(),
            client_secret: this.getDiscordClientSecret(),
            grant_type: 'authorization_code',
            code,
            redirect_uri: this.getRedirectUri(),
        });

        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        });

        if (!tokenResponse.ok) {
            const detail = await tokenResponse.text().catch(() => '');
            Logger.error('AuthService', 'Discord token exchange failed', { status: tokenResponse.status, detail });
            throw new Error('Discord token exchange failed');
        }

        const tokens = (await tokenResponse.json()) as DiscordTokenResponse;

        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userResponse.ok) {
            Logger.error('AuthService', 'Discord user fetch failed', { status: userResponse.status });
            throw new Error('Discord user fetch failed');
        }

        const discordUser = (await userResponse.json()) as DiscordUserResponse;
        const avatarUrl = discordUser.avatar
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : undefined;

        return {
            providerToken: tokens.access_token,
            user: {
                id: discordUser.id,
                username: discordUser.username,
                globalName: discordUser.global_name ?? undefined,
                avatarUrl,
            },
        };
    }

    public static async signAccessToken(user: DiscordAuthUser): Promise<string> {
        return new SignJWT({
            username: user.username,
            globalName: user.globalName,
            avatarUrl: user.avatarUrl,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setSubject(user.id)
            .setIssuedAt()
            .setExpirationTime(JWT_TTL)
            .sign(this.getJwtSecret());
    }

    public static async verifyAccessToken(token: string): Promise<DiscordAuthUser | null> {
        try {
            const { payload } = await jwtVerify(token, this.getJwtSecret());
            const sub = payload.sub;
            if (!sub) return null;

            return {
                id: sub,
                username: typeof payload.username === 'string' ? payload.username : undefined,
                globalName: typeof payload.globalName === 'string' ? payload.globalName : undefined,
                avatarUrl: typeof payload.avatarUrl === 'string' ? payload.avatarUrl : undefined,
            };
        } catch {
            return null;
        }
    }
}
