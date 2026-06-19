import { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ScrollReveal from '../components/ScrollReveal';
import Seo from '../components/Seo';

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
        <div className="dark flex min-h-screen flex-col text-foreground">
            <Seo
                title="Notes de mise à jour - LiveChat"
                description="Consultez l'historique des mises à jour de LiveChat : nouvelles fonctionnalités, corrections et améliorations."
                path="/updates"
            />
            <Header subtitle="Patch Notes" />

            <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:px-6 sm:py-12">
                {loading && (
                    <div className="space-y-5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <article
                                key={i}
                                className="rounded-xl border border-border bg-white/2 p-5 sm:p-6 animate-pulse"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-16 rounded-md bg-white/10"></div>
                                    <div className="h-4 w-24 rounded bg-white/5"></div>
                                </div>
                                <div className="mt-3 h-6 w-3/4 rounded bg-white/10 sm:h-7 sm:w-1/2"></div>
                                <div className="mt-4 space-y-2.5">
                                    {[{ width: '85%' }, { width: '60%' }, { width: '75%' }].map((style, j) => (
                                        <div key={j} className="flex gap-2.5 items-center">
                                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/10" />
                                            <div className="h-4 rounded bg-white/5" style={style}></div>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {error && (
                    <p className="text-center text-sm text-red-400">
                        Impossible de charger les mises à jour. Réessayez plus tard.
                    </p>
                )}

                {!loading && !error && (
                    <>
                        <div className="space-y-5">
                            {patchNotes.map((note, i) => (
                                <ScrollReveal key={note.version} direction="up" delay={(i % 3) * 20}>
                                    <article
                                        className="rounded-xl border border-border bg-white/2 p-5 sm:p-6"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-bold">
                                                {note.version}
                                            </span>
                                            <time className="text-sm text-muted-foreground">{note.date}</time>
                                        </div>
                                        <h2 className="mt-3 text-lg font-bold sm:text-xl">{note.title}</h2>
                                        {note.changes.length > 0 && (
                                            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                                                {note.changes.map((change, j) => (
                                                    <li key={j} className="flex gap-2.5">
                                                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
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
                                <a
                                    href="/"
                                    className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-white/5"
                                >
                                    ← Retour à l'accueil
                                </a>
                            </div>
                        </ScrollReveal>
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
