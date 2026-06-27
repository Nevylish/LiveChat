import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, EthernetPort } from 'lucide-react';
import { SiDiscord } from 'react-icons/si';

interface LoginViewProps {
    onLogin: () => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
    return (
        <div className="mx-auto max-w-md py-8">
            <div className="rounded-lg border border-border bg-card p-8">
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-foreground">
                    <SiDiscord className="h-5 w-5" aria-hidden />
                </div>
                <h2 className="text-xl font-bold">Connexion au tableau de bord</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Connectez-vous pour gérer vos overlays et les réglages de vos serveurs depuis votre navigateur.
                </p>

                <Button onClick={onLogin} className="mt-6 w-full" size="lg">
                    Se connecter avec Discord
                </Button>

                <Separator className="my-6" />

                <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Pré-requis
                    </p>
                    <ul className="space-y-2.5">
                        <li className="flex items-start gap-2.5 text-xs text-muted-foreground">
                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            <span>Un compte Discord et un serveur sur lequel ajouter le bot.</span>
                        </li>
                        <li className="flex items-start gap-2.5 text-xs text-muted-foreground">
                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            <span>Un logiciel de streaming supportant les sources navigateur.</span>
                        </li>
                        <li className="flex items-start gap-2.5 text-xs text-muted-foreground">
                            <EthernetPort className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span>Une connexion internet correcte, minimum 10 Mbps.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
