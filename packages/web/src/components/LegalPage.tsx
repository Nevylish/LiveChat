import { useEffect, useState } from 'react';
import PageShell from './PageShell';

export interface LegalSection {
    id: string;
    title: string;
    content: string;
}

interface LegalPageProps {
    seoTitle: string;
    seoDescription: string;
    path: string;
    heading: string;
    intro: string;
    lastUpdated: string;
    sections: LegalSection[];
    crossLink: { href: string; label: string };
}

function slugLabel(title: string): string {
    return title.replace(/^\d+\.\s*/, '');
}

export default function LegalPage({
    seoTitle,
    seoDescription,
    path,
    heading,
    intro,
    lastUpdated,
    sections,
    crossLink,
}: LegalPageProps) {
    const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '');

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

        sections.forEach((section) => {
            const el = document.getElementById(section.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [sections]);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 88;
            window.scrollTo({ top, behavior: 'smooth' });
            setActiveId(id);
            window.history.replaceState(null, '', `#${id}`);
        }
    };

    return (
        <PageShell title={seoTitle} description={seoDescription} path={path}>
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
                <div className="mb-10 border-b border-border pb-8">
                    <h1 className="text-2xl font-bold sm:text-3xl">{heading}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{intro}</p>
                    <p className="mt-3 text-xs text-muted-foreground/60">Dernière mise à jour : {lastUpdated}</p>
                </div>

                <div className="gap-12 lg:grid lg:grid-cols-[1fr_220px]">
                    {/* Content */}
                    <div className="order-1 max-w-2xl space-y-10">
                        {sections.map((section) => (
                            <section key={section.id} id={section.id} className="scroll-mt-24">
                                <h2 className="text-lg font-semibold sm:text-xl">{section.title}</h2>
                                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                                    {section.content}
                                </p>
                            </section>
                        ))}

                        <div className="flex flex-wrap gap-3 border-t border-border pt-8">
                            <a
                                href={crossLink.href}
                                className="rounded-full border border-border px-5 py-2 text-sm font-semibold transition-colors hover:bg-accent"
                            >
                                {crossLink.label}
                            </a>
                            <a
                                href="/"
                                className="rounded-full border border-border px-5 py-2 text-sm font-semibold transition-colors hover:bg-accent"
                            >
                                ← Retour à l'accueil
                            </a>
                        </div>
                    </div>

                    {/* Table of contents */}
                    <aside className="order-2 hidden lg:block">
                        <div className="sticky top-24">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Sur cette page
                            </p>
                            <nav className="flex flex-col gap-1 border-l border-border" aria-label="Sommaire">
                                {sections.map((section) => {
                                    const isActive = section.id === activeId;
                                    return (
                                        <a
                                            key={section.id}
                                            href={`#${section.id}`}
                                            onClick={(e) => handleNavClick(e, section.id)}
                                            className={`-ml-px border-l-2 py-1 pl-4 text-sm transition-colors ${
                                                isActive
                                                    ? 'border-foreground font-medium text-foreground'
                                                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                                            }`}
                                        >
                                            {slugLabel(section.title)}
                                        </a>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>
                </div>
            </main>
        </PageShell>
    );
}
