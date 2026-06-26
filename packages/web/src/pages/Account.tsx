import { AlertTriangle, Mail, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LoginView from '../components/config/LoginView';
import PageShell from '../components/PageShell';
import { useAuth } from '../hooks/useAuth';
import { getDiscordDisplayName } from '../lib/discord';
import { getErrorMessage } from '../lib/errors';
import { supabase } from '../lib/supabase';

export default function Account() {
    const { session, user, authLoading } = useAuth();

    const handleLogin = useCallback(async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'discord',
                options: {
                    redirectTo: window.location.origin + '/account',
                    scopes: 'identify guilds',
                    skipBrowserRedirect: true,
                },
            });
            if (error) throw error;
            if (data?.url) {
                const width = 600;
                const height = 800;
                const left = window.screen.width / 2 - width / 2;
                const top = window.screen.height / 2 - height / 2;
                window.open(
                    data.url,
                    'discord-login',
                    `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=no`,
                );
            }
        } catch (err) {
            console.error('Login error', getErrorMessage(err, 'Erreur de connexion.'));
        }
    }, []);

    const displayName = getDiscordDisplayName(user);
    const email = user?.email ?? user?.user_metadata?.email ?? '';
    const avatarUrl = user?.user_metadata?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png';

    return (
        <PageShell
            title="Mon compte - LiveChat"
            description="Gérez votre compte LiveChat connecté avec Discord."
            path="/account"
        >
            <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
                {authLoading ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-20">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Chargement de votre compte...</span>
                    </div>
                ) : !session || !user ? (
                    <LoginView onLogin={handleLogin} />
                ) : (
                    <div className="space-y-8">
                        {/* Header */}
                        <div className="flex items-center gap-4 border-b border-border pb-8">
                            <img
                                src={avatarUrl}
                                alt=""
                                className="h-14 w-14 shrink-0 rounded-full border border-border object-cover"
                            />
                            <div className="min-w-0">
                                <h1 className="truncate text-xl font-bold sm:text-2xl">{displayName}</h1>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Connecté avec Discord
                                </p>
                            </div>
                        </div>

                        {/* Email */}
                        <section className="rounded-lg border border-border bg-card p-6">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <h2 className="text-base font-semibold">Adresse e-mail</h2>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Votre adresse e-mail est gérée par Discord.
                            </p>

                            <div className="mt-4 space-y-1.5">
                                <Label htmlFor="account-email" className="text-xs text-muted-foreground">
                                    E-mail
                                </Label>
                                <Input
                                    id="account-email"
                                    type="email"
                                    value={email}
                                    disabled
                                    readOnly
                                    className="cursor-not-allowed"
                                />
                            </div>

                            <div className="mt-4 flex items-start gap-2.5 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-xs leading-normal text-muted-foreground">
                                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <p>
                                    Vous êtes connecté avec Discord. Pour modifier votre adresse e-mail, changez-la
                                    directement dans les paramètres de votre compte Discord, puis reconnectez-vous.
                                </p>
                            </div>
                        </section>

                        {/* Danger zone */}
                        <section className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                <h2 className="text-base font-semibold text-destructive">Supprimer mon compte</h2>
                            </div>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                La suppression de votre compte est définitive et irréversible. Toutes vos données
                                seront effacées, notamment&nbsp;:
                            </p>
                            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                                    L'ensemble de vos overlays sur tous vos serveurs.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                                    Vos liens d'overlay, qui cesseront immédiatement de fonctionner dans OBS.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                                    Vos préférences et réglages associés à votre compte.
                                </li>
                            </ul>

                            <div className="mt-5">
                                <Button variant="destructive" disabled>
                                    <Trash2 className="h-4 w-4" />
                                    Supprimer mon compte
                                </Button>
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </PageShell>
    );
}
