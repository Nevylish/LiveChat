import express = require('express');
import rateLimit from 'express-rate-limit';
import { AuthService } from '../services/AuthService';
import { Constants } from '../utils/Constants';
import { Logger } from '../utils/Logger';

interface AuthRouteDeps {
    app: express.Application;
}

export function registerAuthRoutes({ app }: AuthRouteDeps): void {
    const redirectUri = `${Constants.getBaseUrl()}/api/auth/discord/callback`;
    Logger.log(
        'AuthRoutes',
        `Discord OAuth redirect URI (add this in Developer Portal → OAuth2 → Redirects): ${redirectUri}`,
    );

    const limiter = rateLimit({
        windowMs: 1 * 60 * 1000,
        max: 30,
        message: { error: 'Too many requests.' },
        standardHeaders: true,
        legacyHeaders: false,
    });

    app.get('/api/auth/discord', limiter, (req, res) => {
        const returnTo =
            typeof req.query.returnTo === 'string'
                ? req.query.returnTo
                : `${Constants.getFrontendUrl()}/auth/callback`;

        try {
            const url = AuthService.getDiscordAuthorizeUrl(returnTo);
            res.redirect(url);
        } catch (err) {
            Logger.error('AuthRoutes', 'Failed to start Discord OAuth', { err });
            res.status(400).json({ error: 'Invalid OAuth request' });
        }
    });

    app.get('/api/auth/discord/callback', limiter, async (req, res) => {
        const { code, state, error } = req.query;

        if (typeof error === 'string') {
            res.redirect(`${Constants.getFrontendUrl()}/auth/callback?error=${encodeURIComponent(error)}`);
            return;
        }

        if (typeof code !== 'string' || typeof state !== 'string') {
            res.redirect(`${Constants.getFrontendUrl()}/auth/callback?error=missing_code`);
            return;
        }

        const returnTo = AuthService.consumeOAuthState(state);
        if (!returnTo) {
            res.redirect(`${Constants.getFrontendUrl()}/auth/callback?error=invalid_state`);
            return;
        }

        try {
            const { user, providerToken } = await AuthService.exchangeCode(code);
            const accessToken = await AuthService.signAccessToken(user);
            const redirectUrl = new URL(returnTo);
            redirectUrl.searchParams.set('access_token', accessToken);
            redirectUrl.searchParams.set('provider_token', providerToken);
            res.redirect(redirectUrl.toString());
        } catch (err) {
            Logger.error('AuthRoutes', 'Discord OAuth callback failed', { err });
            res.redirect(`${Constants.getFrontendUrl()}/auth/callback?error=oauth_failed`);
        }
    });
}
