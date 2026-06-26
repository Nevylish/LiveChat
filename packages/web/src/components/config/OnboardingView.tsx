import type { DiscordGuild } from '@livechat/types';
import { ShieldAlert, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OnboardingViewProps {
    selectedGuild: DiscordGuild;
    username: string;
    validateAndSetUsername: (val: string) => void;
    error: string | null;
    isGenerating: boolean;
    handleCreateConfig: () => void;
}

export default function OnboardingView({
    selectedGuild,
    username,
    validateAndSetUsername,
    error,
    isGenerating,
    handleCreateConfig,
}: OnboardingViewProps) {
    return (
        <div className="mx-auto max-w-md py-8">
            <div className="rounded-lg border border-border bg-card p-8">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                    <Sliders className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Activer votre premier overlay</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Choisissez votre pseudo d'affichage pour générer le lien de votre overlay sur{' '}
                    <strong className="text-foreground">{selectedGuild.name}</strong>.
                </p>

                <div className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="username" className="text-xs font-semibold text-muted-foreground">
                            Pseudo d'affichage
                        </Label>
                        <Input
                            id="username"
                            placeholder="noobmaster69"
                            value={username}
                            onChange={(e) => validateAndSetUsername(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Ce pseudo identifie votre overlay. Vous pourrez le modifier plus tard.
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2.5 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>{error}</div>
                        </div>
                    )}

                    <Button
                        onClick={() => handleCreateConfig()}
                        disabled={isGenerating || !username}
                        className="w-full"
                        size="lg"
                    >
                        {isGenerating ? "Génération de l'overlay..." : "Créer et générer votre lien d'overlay"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
