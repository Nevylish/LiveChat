import { ChevronDown, HelpCircle } from 'lucide-react';
import { useState } from 'react';

export interface BrowserSourceGuideStep {
    title: string;
    text: string;
    /** When set, shows a copyable CSS block below this step's description. */
    css?: string;
}

export interface BrowserSourceGuideConfig {
    guideTitle: string;
    steps: BrowserSourceGuideStep[];
}

interface BrowserSourceGuideProps extends BrowserSourceGuideConfig {
    defaultOpen?: boolean;
}

export default function BrowserSourceGuide({ guideTitle, steps, defaultOpen = false }: BrowserSourceGuideProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [copiedCss, setCopiedCss] = useState<string | null>(null);

    const handleCopyCss = (css: string) => {
        navigator.clipboard.writeText(css).then(() => {
            setCopiedCss(css);
            setTimeout(() => setCopiedCss(null), 2000);
        });
    };

    return (
        <div className="rounded-lg border border-border bg-card">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left"
            >
                <span className="flex items-center gap-2 text-sm font-semibold">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    {guideTitle}
                </span>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? '-rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="border-t border-border px-5 pb-5 pt-4">
                    <div className="space-y-5">
                        {steps.map((item, index) => (
                            <div key={`${item.title}-${index}`} className="flex gap-4">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs font-bold">
                                    {index + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">{item.title}</p>
                                    <p className="mt-0.5 text-xs leading-normal text-muted-foreground">{item.text}</p>
                                    {item.css && (
                                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                                            <code className="flex-1 overflow-x-auto whitespace-pre rounded-md border border-input bg-muted px-3 py-2 font-mono text-xs">
                                                {item.css}
                                            </code>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyCss(item.css!)}
                                                className="shrink-0 cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent"
                                            >
                                                {copiedCss === item.css ? 'Copié !' : 'Copier'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
