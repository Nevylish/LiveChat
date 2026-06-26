import type { DiscordGuild } from '@livechat/types';
import { ShieldAlert, Sliders } from 'lucide-react';

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
        <div className="max-w-xl mx-auto py-8">
            <div className="config-card flex flex-col items-start text-left space-y-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white">
                    <Sliders className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold sm:text-2xl">Activer votre premier overlay</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Choisissez votre pseudo d'affichage ci-dessous pour générer le lien de votre overlay pour le
                        serveur {selectedGuild.name}.
                    </p>
                </div>

                <div className="w-full text-left space-y-4 pt-2">
                    <div>
                        <label htmlFor="username" className="config-label text-sm text-muted-foreground font-semibold">
                            Pseudo d'affichage
                        </label>
                        <input
                            type="text"
                            id="username"
                            placeholder="noobmaster69"
                            value={username}
                            onChange={(e) => validateAndSetUsername(e.target.value)}
                            className="config-input mt-1.5 py-3 px-4 text-base"
                        />
                        <p className="mt-2 text-xs text-muted-foreground leading-normal">
                            Ce pseudo permet d'identifier votre overlay. Vous pourrez le modifier plus tard.
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3.5 text-sm text-red-200">
                            <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                            <div>{error}</div>
                        </div>
                    )}

                    <button
                        onClick={() => handleCreateConfig()}
                        disabled={isGenerating || !username}
                        className="w-full flex items-center justify-center gap-2 rounded-full bg-white hover:bg-white/90 px-8 py-3.5 text-sm font-semibold text-black transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isGenerating ? "Génération de l'overlay..." : "Créer et générer votre lien d'overlay"}
                    </button>
                </div>
            </div>
        </div>
    );
}
