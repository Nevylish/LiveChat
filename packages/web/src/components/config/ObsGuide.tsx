import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface ObsGuideProps {
    showObsGuide?: boolean;
}

export default function ObsGuide({ showObsGuide: defaultShowObsGuide = false }: ObsGuideProps) {
    const [showObsGuide, setShowObsGuide] = useState(defaultShowObsGuide);
    const [isCssCopied, setIsCssCopied] = useState(false);

    const handleCopyCss = () => {
        const cssText = 'body:not(.livechat-overlay) { display: none !important; }';
        navigator.clipboard.writeText(cssText).then(() => {
            setIsCssCopied(true);
            setTimeout(() => setIsCssCopied(false), 2000);
        });
    };

    return (
        <div className="config-card">
            <button
                onClick={() => setShowObsGuide(!showObsGuide)}
                className="w-full flex items-center justify-between text-left font-bold text-foreground text-sm sm:text-base py-1 cursor-pointer"
            >
                <span className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-white" />
                    Guide : Installer LiveChat sur OBS Studio
                </span>
                <span className="text-xs text-muted-foreground bg-white/5 px-2.5 py-1 rounded-full hover:bg-white/10 transition-colors">
                    {showObsGuide ? 'Masquer' : 'Afficher'}
                </span>
            </button>

            {showObsGuide && (
                <div className="mt-6 border-t border-white/5 pt-6 space-y-5 text-muted-foreground text-sm leading-relaxed">
                    <div className="grid gap-6">
                        {[
                            {
                                step: 1,
                                title: 'Ajouter une source Navigateur',
                                text: 'Dans OBS Studio, faites un clic droit dans votre panneau de Sources, cliquez sur "Ajouter", puis sélectionnez "Navigateur".',
                            },
                            {
                                step: 2,
                                title: "Entrer l'URL de l'overlay",
                                text: 'Collez l\'URL de l\'overlay ci-dessus dans le champ "URL" des propriétés de la source.',
                            },
                            {
                                step: 3,
                                title: 'Définir les dimensions',
                                text: 'Configurez la Largeur sur 1920 et la Hauteur sur 1080 (ou adaptez-le à la résolution de votre écran) pour un positionnement optimal.',
                            },
                            {
                                step: 4,
                                title: "Contrôler l'audio",
                                text: 'Cochez la case "Contrôler l\'audio via OBS" afin de pouvoir gérer ou couper le son directement depuis votre mixeur audio OBS.',
                            },
                        ].map((item) => (
                            <div key={item.step} className="flex gap-4 items-start max-w-[75vw]">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white text-xs font-bold font-mono">
                                    {item.step}
                                </span>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold text-foreground leading-snug">{item.title}</p>
                                    <p className="text-xs text-muted-foreground leading-normal">{item.text}</p>
                                </div>
                            </div>
                        ))}

                        <div className="flex gap-4 items-start pt-2 max-w-[75vw]">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white text-xs font-bold font-mono">
                                5
                            </span>
                            <div className="flex-1 min-w-0 space-y-2">
                                <div>
                                    <p className="text-sm font-bold text-foreground leading-snug">
                                        Masquer le fond noir (CSS)
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-normal">
                                        Collez la règle CSS suivante dans le champ "CSS personnalisé" d'OBS pour masquer
                                        le fond noir lorsque le chat est inactif :
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                                    <code className="flex-1 overflow-x-auto whitespace-pre font-mono rounded-lg bg-black/40 px-3 py-2 border border-white/5 text-xs">
                                        body:not(.livechat-overlay) &#123; display: none !important; &#125;
                                    </code>
                                    <button
                                        onClick={handleCopyCss}
                                        className="shrink-0 rounded-lg border border-border px-4 py-2 text-xs font-semibold transition-colors hover:bg-white/5 cursor-pointer"
                                    >
                                        {isCssCopied ? 'Copié !' : 'Copier'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start pt-2 max-w-[75vw]">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white text-xs font-bold font-mono">
                                6
                            </span>
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold text-foreground leading-snug">Monitoring audio</p>
                                <p className="text-xs text-muted-foreground leading-normal">
                                    Dans le Mélangeur Audio d'OBS, cliquez sur les options de la source &gt; Propriétés
                                    audio avancées &gt; réglez sur "Monitoring et sortie" pour entendre les alertes dans
                                    votre casque.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
