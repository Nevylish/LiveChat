import type { ReactNode } from 'react';

export interface TabItem<T extends string> {
    id: T;
    label: string;
    icon?: ReactNode;
    count?: number;
}

interface ConfigTabsProps<T extends string> {
    tabs: TabItem<T>[];
    active: T;
    onChange: (id: T) => void;
}

export default function ConfigTabs<T extends string>({ tabs, active, onChange }: ConfigTabsProps<T>) {
    return (
        <div className="mb-6 overflow-hidden border-b border-border">
            <div role="tablist" aria-label="Sections" className="tabs-scroll flex gap-1">
                {tabs.map((tab) => {
                    const isActive = tab.id === active;
                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onChange(tab.id)}
                            className={`-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                                isActive
                                    ? 'border-foreground text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {typeof tab.count === 'number' && (
                                <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                                        isActive
                                            ? 'bg-foreground text-background'
                                            : 'bg-secondary text-muted-foreground'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
