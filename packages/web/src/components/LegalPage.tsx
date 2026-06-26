import PageShell from './PageShell';
import TableOfContents, { type TocItem } from './TableOfContents';

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
    const tocItems: TocItem[] = sections.map((section) => ({ id: section.id, label: slugLabel(section.title) }));

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
                            <a href={crossLink.href} className="btn-secondary">
                                {crossLink.label}
                            </a>
                            <a href="/" className="btn-secondary">
                                ← Retour à l'accueil
                            </a>
                        </div>
                    </div>

                    {/* Table of contents */}
                    <aside className="order-2 hidden lg:block">
                        <TableOfContents items={tocItems} />
                    </aside>
                </div>
            </main>
        </PageShell>
    );
}
