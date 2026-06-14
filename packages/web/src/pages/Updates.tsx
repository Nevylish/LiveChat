import { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';

// TODO: Changer le lien
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
            <Header subtitle="Patch Notes" />

            <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:px-6 sm:py-12">
                {loading && <p className="text-center text-sm text-muted-foreground">Chargement des mises à jour...</p>}

                {error && (
                    <p className="text-center text-sm text-red-400">
                        Impossible de charger les mises à jour. Réessayez plus tard.
                    </p>
                )}

                {!loading && !error && (
                    <>
                        <div className="space-y-5">
                            {patchNotes.map((note) => (
                                <article
                                    key={note.version}
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
                                            {note.changes.map((change, i) => (
                                                <li key={i} className="flex gap-2.5">
                                                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                                                    <span className="whitespace-pre-line">{change}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </article>
                            ))}
                        </div>

                        <div className="mt-10 text-center">
                            <a
                                href="/"
                                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-white/5"
                            >
                                ← Retour à l'accueil
                            </a>
                        </div>
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
