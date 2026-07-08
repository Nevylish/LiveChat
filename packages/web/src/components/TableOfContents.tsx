import { useEffect, useState } from 'react';

export interface TocItem {
    id: string;
    label: string;
}

interface TableOfContentsProps {
    items: TocItem[];
    /** Vertical offset (px) used when scrolling to a section, to clear the header. */
    scrollOffset?: number;
}

/**
 * Sticky "On this page" navigation with scroll-spy highlighting, shared by the
 * legal pages and the usage doc.
 */
export default function TableOfContents({ items, scrollOffset = 88 }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) {
                    setActiveId(visible[0].target.id);
                }
            },
            { rootMargin: '-96px 0px -70% 0px', threshold: 0 },
        );

        items.forEach((item) => {
            const el = document.getElementById(item.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [items]);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - scrollOffset;
            window.scrollTo({ top, behavior: 'smooth' });
            setActiveId(id);
            window.history.replaceState(null, '', `#${id}`);
        }
    };

    return (
        <div className="sticky top-24">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sur cette page</p>
            <nav className="flex flex-col gap-1 border-l border-border" aria-label="Sommaire">
                {items.map((item) => {
                    const isActive = item.id === activeId;
                    return (
                        <a
                            key={item.id}
                            href={`#${item.id}`}
                            onClick={(e) => handleNavClick(e, item.id)}
                            className={`-ml-px border-l-2 py-1 pl-4 text-sm transition-colors ${
                                isActive
                                    ? 'border-foreground font-medium text-foreground'
                                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                            }`}
                        >
                            {item.label}
                        </a>
                    );
                })}
            </nav>
        </div>
    );
}
