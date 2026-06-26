const FOOTER_LINKS: { label: string; href: string; external?: boolean }[] = [
    { label: 'Confidentialité', href: '/privacy' },
    { label: 'Conditions', href: '/terms' },
    { label: 'Code source', href: 'https://github.com/Nevylish/LiveChat', external: true },
    { label: 'Statut', href: 'https://status.nevylish.fr/fr', external: true },
];

export default function Footer() {
    return (
        <footer className="border-t border-border">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between">
                <p className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Strachamia Studios.{' '}
                    <span className="hidden sm:inline">
                        Non affilié aux plateformes de streaming, réseaux sociaux et services tiers cités.
                    </span>
                </p>

                <nav className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Liens de bas de page">
                    {FOOTER_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                            {...(link.external && { target: '_blank', rel: 'noopener noreferrer' })}
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>
            </div>
        </footer>
    );
}
