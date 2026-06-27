import { ShieldAlert } from 'lucide-react';

interface RestrictedViewProps {
    error: string | null;
}

export default function RestrictedView({ error }: RestrictedViewProps) {
    return (
        <div className="mx-auto max-w-md py-8">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                    <ShieldAlert className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-destructive">Accès restreint</h3>
                <p className="mt-2 text-sm leading-relaxed text-destructive/80">
                    {error ||
                        'Un rôle obligatoire est requis pour utiliser LiveChat et configurer des overlays sur ce serveur Discord.'}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                    Veuillez contacter un administrateur du serveur pour obtenir le rôle nécessaire.
                </p>
            </div>
        </div>
    );
}
