export default function Footer() {
    return (
        <footer className="border-t border-border/40 py-8">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-sm text-muted-foreground sm:px-6">
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                    <a href="/privacy" className="transition-colors duration-200 hover:text-foreground">
                        Politique de confidentialité
                    </a>
                    <a href="/terms" className="transition-colors duration-200 hover:text-foreground">
                        Conditions d'utilisation
                    </a>
                    <a
                        href="https://github.com/Nevylish/LiveChat"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors duration-200 hover:text-foreground"
                    >
                        Code source
                    </a>
                </div>
                <p className="text-center text-xs leading-relaxed sm:text-sm">
                    © {new Date().getFullYear()} Nevylish — LiveChat. Tous droits réservés.
                    <br />
                    Non affilié à Twitch, Cacabox ou toute autre marque, plateforme ou personne tierce.
                </p>
            </div>
        </footer>
    );
}
