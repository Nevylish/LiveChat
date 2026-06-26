import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell';
import ScrollReveal from '../components/ScrollReveal';

const GIST_URL = 'https://raw.githubusercontent.com/Nevylish/LiveChat/refs/heads/main/patchnotes.json';

interface PatchNote {
    version: string;
    date: string;
    title: string;
    changes: string[];
}

export default function Updates() {
    const [patchNotes, setPatchNotes] = useState<PatchNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(GIST_URL)
            .then((res) => {
                if (!res.ok) throw new Error('Fetch failed');
                return res.json();
            })
            .then((data: PatchNote[]) => {
                setPatchNotes(data);
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, []);

    return (
        <PageShell
            title="Notes de mise à jour - LiveChat"
            description="Consultez l'historique des mises à jour de LiveChat : nouvelles fonctionnalités, corrections et améliorations."
            path="/updates"
        >
            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
                <ScrollReveal direction="up">
                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Notes de mise à jour</h1>
                    <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                        Historique des changements, nouvelles fonctionnalités et corrections.
                    </p>
                </ScrollReveal>

                <div className="mt-10">
                    {loading && (
                        <div className="space-y-5">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <article
                                    key={i}
                                    className="animate-pulse rounded-lg border border-border bg-card p-5 sm:p-6"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 w-16 rounded-md bg-muted" />
                                        <div className="h-4 w-24 rounded bg-secondary" />
                                    </div>
                                    <div className="mt-3 h-6 w-3/4 rounded bg-muted sm:h-7 sm:w-1/2" />
                                    <div className="mt-4 space-y-2.5">
                                        {[{ width: '85%' }, { width: '60%' }, { width: '75%' }].map((style, j) => (
                                            <div key={j} className="flex items-center gap-2.5">
                                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted" />
                                                <div className="h-4 rounded bg-secondary" style={style} />
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    {error && (
                        <p className="text-center text-sm text-destructive">
                            Impossible de charger les mises à jour. Réessayez plus tard.
                        </p>
                    )}

                    {!loading && !error && (
                        <>
                            <div className="space-y-5">
                                {patchNotes.map((note, i) => (
                                    <ScrollReveal key={note.version} direction="up" delay={(i % 3) * 20}>
                                        <article className="rounded-lg border border-border bg-card p-5 sm:p-6">
                                            <div className="flex items-center gap-3">
                                                <span className="rounded-md bg-secondary px-2.5 py-1 font-mono text-xs font-bold">
                                                    {note.version}
                                                </span>
                                                <time className="text-sm text-muted-foreground">{note.date}</time>
                                            </div>
                                            <h2 className="mt-3 text-lg font-bold sm:text-xl">{note.title}</h2>
                                            {note.changes.length > 0 && (
                                                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                                                    {note.changes.map((change, j) => (
                                                        <li key={j} className="flex gap-2.5">
                                                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                                                            <span className="whitespace-pre-line">{change}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </article>
                                    </ScrollReveal>
                                ))}
                            </div>

                            <ScrollReveal direction="up">
                                <div className="mt-10 text-center">
                                    <a href="/" className="btn-secondary gap-2">
                                        ← Retour à l'accueil
                                    </a>
                                </div>
                            </ScrollReveal>
                        </>
                    )}
                </div>
            </main>
        </PageShell>
    );
}
