import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

export interface BreadcrumbSegment {
    label: string;
    icon?: ReactNode;
    onClick?: () => void;
}

interface ConfigBreadcrumbProps {
    segments: BreadcrumbSegment[];
    actions?: ReactNode;
}

export default function ConfigBreadcrumb({ segments, actions }: ConfigBreadcrumbProps) {
    return (
        <div className="sticky top-14 z-40 -mx-4 mb-6 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <nav aria-label="Fil d'Ariane" className="flex min-w-0 items-center gap-1.5 text-sm">
                    {segments.map((segment, i) => {
                        const isLast = i === segments.length - 1;
                        return (
                            <div key={i} className="flex min-w-0 items-center gap-1.5">
                                {i > 0 && (
                                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                                )}
                                {segment.onClick && !isLast ? (
                                    <button
                                        onClick={segment.onClick}
                                        className="flex min-w-0 cursor-pointer items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {segment.icon}
                                        <span className="truncate">{segment.label}</span>
                                    </button>
                                ) : (
                                    <span
                                        className={`flex min-w-0 items-center gap-1.5 ${
                                            isLast ? 'font-medium text-foreground' : 'text-muted-foreground'
                                        }`}
                                    >
                                        {segment.icon}
                                        <span className="truncate">{segment.label}</span>
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {actions && (
                    <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">{actions}</div>
                )}
            </div>
        </div>
    );
}
