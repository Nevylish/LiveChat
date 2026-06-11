const FOOTER_LINKS: { label: string; href: string; external?: boolean }[] = [
    { label: 'Politique de confidentialité', href: '/privacy' },
    { label: "Conditions d'utilisation", href: '/terms' },
    { label: 'Code source de LiveChat', href: 'https://github.com/Nevylish/LiveChat', external: true },
    { label: 'Strachamia Studios', href: 'https://strachamia.fr', external: true },
];

export default function Footer() {
    return (
        <footer className="border-t border-border/40 py-8">
            <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 text-sm text-muted-foreground sm:px-6 md:flex-row md:justify-between">
                <nav className="order-1 flex flex-col items-start gap-2 md:order-2 md:grid md:grid-flow-col md:grid-rows-2 md:items-start md:gap-x-8 md:gap-y-2">
                    {FOOTER_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="-mx-2 rounded-md px-3 py-1.5 transition-colors duration-200 hover:bg-muted hover:text-foreground"
                            {...(link.external && { target: '_blank', rel: 'noopener noreferrer' })}
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <hr className="order-2 w-16 border-border/30 md:hidden" />

                <div className="order-3 flex flex-col gap-1 md:order-1 md:items-start">
                    <p className="text-left text-sm leading-relaxed">
                        © {new Date().getFullYear()} Strachamia Studios. Tous droits réservés.
                    </p>
                    <p className="text-left text-[12px] leading-relaxed md:max-w-sm">
                        Non affilié aux plateformes de streaming, réseaux sociaux et services tiers cités, ni à Cacabox
                        ou toute autre marque déposée.
                    </p>
                </div>
            </div>
        </footer>
    );
}
