import { RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { saveAuthSession } from '../lib/authSession';
import { persistDiscordProviderToken } from '../lib/discordAuth';
import { sanitizeDiscordAvatarUrl } from '@livechat/types';

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');
        const accessToken = params.get('access_token');
        const providerToken = params.get('provider_token');

        if (error) {
            if (window.opener) {
                window.close();
            } else {
                navigate('/config', { replace: true });
            }
            return;
        }

        if (!accessToken || !providerToken) {
            navigate('/config', { replace: true });
            return;
        }

        try {
            const payload = JSON.parse(atob(accessToken.split('.')[1] ?? '')) as {
                sub?: string;
                username?: string;
                globalName?: string;
                avatarUrl?: string;
            };

            if (!payload.sub) {
                navigate('/config', { replace: true });
                return;
            }

            const session = {
                access_token: accessToken,
                provider_token: providerToken,
                user: {
                    id: payload.sub,
                    username: payload.username,
                    globalName: payload.globalName,
                    avatarUrl: sanitizeDiscordAvatarUrl(payload.avatarUrl),
                },
            };

            saveAuthSession(session);
            persistDiscordProviderToken(payload.sub, providerToken);

            if (window.opener) {
                window.opener.postMessage({ type: 'livechat-auth-success' }, window.location.origin);
                window.close();
                return;
            }

            navigate('/config', { replace: true });
        } catch {
            navigate('/config', { replace: true });
        }
    }, [navigate]);

    return (
        <PageShell title="Connexion LiveChat" description="Finalisation de la connexion Discord." path="/auth/callback">
            <main className="flex flex-1 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Connexion en cours...</p>
                </div>
            </main>
        </PageShell>
    );
}
