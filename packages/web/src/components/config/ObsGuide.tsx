import { ChevronDown, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface ObsGuideProps {
    showObsGuide?: boolean;
}

const steps = [
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
        text: 'Configurez la Largeur sur 1920 et la Hauteur sur 1080 (ou adaptez à votre résolution) pour un positionnement optimal.',
    },
    {
        step: 4,
        title: "Contrôler l'audio",
        text: 'Cochez "Contrôler l\'audio via OBS" afin de gérer ou couper le son directement depuis votre mixeur audio.',
    },
];

export default function ObsGuide({ showObsGuide: defaultShowObsGuide = false }: ObsGuideProps) {
    const [showObsGuide, setShowObsGuide] = useState(defaultShowObsGuide);
    const [isCssCopied, setIsCssCopied] = useState(false);

    const handleCopyCss = () => {
        navigator.clipboard.writeText('body:not(.livechat-overlay) { display: none !important; }').then(() => {
            setIsCssCopied(true);
            setTimeout(() => setIsCssCopied(false), 2000);
        });
    };

    return (
        <div className="rounded-lg border border-border bg-card">
            <button
                onClick={() => setShowObsGuide(!showObsGuide)}
                className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left"
            >
                <span className="flex items-center gap-2 text-sm font-semibold">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    Guide : Installer LiveChat sur OBS Studio
                </span>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${showObsGuide ? '-rotate-180' : ''}`}
                />
            </button>

            {showObsGuide && (
                <div className="border-t border-border px-5 pb-5 pt-4">
                    <div className="space-y-5">
                        {steps.map((item) => (
                            <div key={item.step} className="flex gap-4">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs font-bold">
                                    {item.step}
                                </span>
                                <div>
                                    <p className="text-sm font-semibold">{item.title}</p>
                                    <p className="mt-0.5 text-xs leading-normal text-muted-foreground">{item.text}</p>
                                </div>
                            </div>
                        ))}

                        {/* Step 5 — CSS */}
                        <div className="flex gap-4">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs font-bold">
                                5
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold">Masquer le fond noir (CSS)</p>
                                <p className="mt-0.5 text-xs leading-normal text-muted-foreground">
                                    Collez la règle CSS suivante dans "CSS personnalisé" d'OBS pour masquer le fond noir
                                    lorsque le chat est inactif :
                                </p>
                                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <code className="flex-1 overflow-x-auto whitespace-pre rounded-md border border-input bg-muted px-3 py-2 font-mono text-xs">
                                        body:not(.livechat-overlay) &#123; display: none !important; &#125;
                                    </code>
                                    <button
                                        onClick={handleCopyCss}
                                        className="shrink-0 cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent"
                                    >
                                        {isCssCopied ? 'Copié !' : 'Copier'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Step 6 — Audio monitoring */}
                        <div className="flex gap-4">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs font-bold">
                                6
                            </span>
                            <div>
                                <p className="text-sm font-semibold">Monitoring audio</p>
                                <p className="mt-0.5 text-xs leading-normal text-muted-foreground">
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
