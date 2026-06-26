import { CheckCircle, EthernetPort } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface LoginViewProps {
    onLogin: () => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
    return (
        <div className="mx-auto max-w-md py-8">
            <div className="rounded-lg border border-border bg-card p-8">
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-foreground">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107 14.36 14.36 0 0 0 1.226 1.99.076.076 0 0 0 .084-.03 19.86 19.86 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                    </svg>
                </div>

                <h2 className="text-xl font-bold">Configurer votre overlay</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Connectez-vous avec Discord pour récupérer vos serveurs et gérer votre lien d'overlay en toute
                    sécurité.
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
                            <span>Un compte Discord et un serveur sur lequel installer le bot.</span>
                        </li>
                        <li className="flex items-start gap-2.5 text-xs text-muted-foreground">
                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            <span>Un logiciel de streaming supportant les sources navigateur (OBS, Streamlabs).</span>
                        </li>
                        <li className="flex items-start gap-2.5 text-xs text-muted-foreground">
                            <EthernetPort className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span>Une connexion internet correcte.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
