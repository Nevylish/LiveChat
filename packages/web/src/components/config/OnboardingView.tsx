import type { DiscordGuild } from '@livechat/types';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingViewProps {
    selectedGuild: DiscordGuild;
    onOpenCreate: () => void;
}

export default function OnboardingView({ selectedGuild, onOpenCreate }: OnboardingViewProps) {
    return (
        <div className="mx-auto max-w-md py-8">
            <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-foreground">
                    <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">Activer votre premier overlay</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Créez un overlay pour <strong className="text-foreground">{selectedGuild.name}</strong> et générez
                    le lien à intégrer dans OBS Studio.
                </p>

                <Button onClick={onOpenCreate} size="lg" className="mt-6">
                    <Plus className="h-4 w-4" />
                    Créer mon premier overlay
                </Button>
            </div>
        </div>
    );
}
