import { ShieldAlert } from 'lucide-react';

interface RestrictedViewProps {
    error: string | null;
}

export default function RestrictedView({ error }: RestrictedViewProps) {
    return (
        <div className="max-w-xl mx-auto py-8">
            <div className="config-card flex flex-col items-start space-y-6 border-red-500/20 bg-red-500/5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                    <ShieldAlert className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold sm:text-2xl text-red-200">Accès restreint</h3>
                    <p className="text-sm text-red-200/80 leading-relaxed max-w-md">
                        {error ||
                            'Un rôle obligatoire est requis pour utiliser LiveChat et configurer des overlays sur ce serveur Discord.'}
                    </p>
                </div>
                <p className="text-xs text-muted-foreground max-w-md">
                    Veuillez contacter un administrateur du serveur pour obtenir le rôle nécessaire.
                </p>
            </div>
        </div>
    );
}
