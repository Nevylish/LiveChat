import { AlertTriangle } from 'lucide-react';
import { useCallback } from 'react';
import PageShell from '../components/PageShell';
import LoginView from '../components/config/LoginView';
import { Button } from '@/components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { openDiscordLoginPopup } from '../lib/authApi';
import { getDiscordAvatarUrl, getDiscordDisplayName } from '../lib/discord';
import { getErrorMessage } from '../lib/errors';

export default function Account() {
    const { session, user, authLoading, signOut } = useAuth();

    const handleLogin = useCallback(async () => {
        try {
            openDiscordLoginPopup();
        } catch (err) {
            console.error('Login error', getErrorMessage(err, 'Erreur de connexion.'));
        }
    }, []);

    const displayName = getDiscordDisplayName(user);
    const avatarUrl = getDiscordAvatarUrl(user);

    return (
        <PageShell
            title="Mon compte - LiveChat"
            description="Gérez votre compte LiveChat connecté avec Discord."
            path="/account"
        >
            <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
                {authLoading ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-20">
                        <span className="text-sm text-muted-foreground">Chargement de votre compte...</span>
                    </div>
                ) : !session || !user ? (
                    <LoginView onLogin={handleLogin} />
                ) : (
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 border-b border-border pb-8">
                            <img
                                src={avatarUrl}
                                alt=""
                                className="h-14 w-14 shrink-0 rounded-full border border-border object-cover"
                            />
                            <div className="min-w-0">
                                <h1 className="truncate text-xl font-bold sm:text-2xl">{displayName}</h1>
                                <p className="mt-0.5 text-sm text-muted-foreground">Connecté avec Discord</p>
                                <p className="mt-1 font-mono text-xs text-muted-foreground">{user.id}</p>
                            </div>
                        </div>

                        <section className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                <h2 className="text-base font-semibold text-destructive">Supprimer mon compte</h2>
                            </div>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                La suppression de votre compte est définitive et irréversible. Toutes vos données seront
                                effacées, notamment&nbsp;:
                            </p>
                            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                                    L'ensemble de vos overlays sur tous vos serveurs.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                                    Vos préférences et réglages associés à votre compte.
                                </li>
                            </ul>

                            <div className="mt-5 flex flex-wrap gap-3">
                                <Button variant="destructive" disabled className="w-full sm:w-auto">
                                    Supprimer mon compte
                                </Button>
                                <Button variant="outline" onClick={signOut} className="w-full sm:w-auto">
                                    Se déconnecter
                                </Button>
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </PageShell>
    );
}
