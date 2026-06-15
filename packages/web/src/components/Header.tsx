import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
    subtitle?: string;
}

const NAV_LINKS: { label: string; href: string; external?: boolean }[] = [
    { href: '/config', label: 'Configuration' },
    { href: '/usage', label: 'Utilisation' },
    { href: '/updates', label: 'Patch Notes' },
];

export default function Header({ subtitle }: HeaderProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    const closeMenu = useCallback(() => {
        setMenuOpen(false);
        document.body.style.overflow = '';
    }, []);

    useEffect(() => {
        closeMenu();
    }, [location.pathname, closeMenu]);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape' && menuOpen) closeMenu();
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [menuOpen, closeMenu]);

    function toggleMenu() {
        if (menuOpen) {
            closeMenu();
        } else {
            setMenuOpen(true);
            document.body.style.overflow = 'hidden';
        }
    }

    return (
        <>
            <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-sm">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
                    <a href="/" className="flex items-center gap-2.5 text-lg font-bold">
                        <img
                            src="/assets/images/livechat_transparent.png"
                            alt="LiveChat"
                            className="h-8 w-8"
                            draggable={false}
                        />
                        <span>
                            LiveChat
                            {subtitle && (
                                <span className="ml-1.5 text-sm font-normal text-muted-foreground">— {subtitle}</span>
                            )}
                        </span>
                    </a>

                    {/* Desktop nav */}
                    <nav className="hidden md:block">
                        <ul className="flex items-center gap-6 text-sm font-semibold text-muted-foreground">
                            {NAV_LINKS.map((link) => (
                                <li key={link.href}>
                                    <a
                                        href={link.href}
                                        target={link.external ? '_blank' : undefined}
                                        rel={link.external ? 'noopener noreferrer' : undefined}
                                        className={`transition-colors duration-200 hover:text-foreground ${
                                            !link.external && location.pathname === link.href ? 'text-foreground' : ''
                                        }`}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Spacer pour le burger sur mobile (réserve l'espace) */}
                    <div className="h-10 w-10 md:hidden" />
                </div>
            </header>

            {/* Burger button — fixed, au-dessus de tout, y compris l'overlay */}
            <button
                className="fixed right-4 top-3.5 z-60 flex h-10 w-10 items-center justify-center rounded-lg sm:right-5 md:hidden"
                onClick={toggleMenu}
                aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={menuOpen}
            >
                <div className="flex h-[18px] w-[22px] flex-col justify-between">
                    <span
                        className={`block h-[2px] w-full origin-center rounded-full bg-foreground transition-transform duration-300 ${
                            menuOpen ? 'translate-y-[8px] rotate-45' : ''
                        }`}
                    />
                    <span
                        className={`block h-[2px] w-full rounded-full bg-foreground transition-opacity duration-200 ${
                            menuOpen ? 'opacity-0' : ''
                        }`}
                    />
                    <span
                        className={`block h-[2px] w-full origin-center rounded-full bg-foreground transition-transform duration-300 ${
                            menuOpen ? '-translate-y-[8px] -rotate-45' : ''
                        }`}
                    />
                </div>
            </button>

            {/* Mobile overlay — z-50, sous le burger button */}
            <div
                className={`fixed inset-0 z-50 flex flex-col bg-background transition-opacity duration-300 md:pointer-events-none md:hidden md:opacity-0 ${
                    menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                }`}
                aria-hidden={!menuOpen}
            >
                <nav className="flex flex-1 flex-col items-center justify-center gap-8">
                    {NAV_LINKS.map((link, i) => (
                        <a
                            key={link.href}
                            href={link.href}
                            target={link.external ? '_blank' : undefined}
                            rel={link.external ? 'noopener noreferrer' : undefined}
                            onClick={link.external ? undefined : closeMenu}
                            className="text-2xl font-bold text-muted-foreground transition-colors duration-200 hover:text-foreground"
                            style={{
                                transitionDelay: menuOpen ? `${80 + i * 60}ms` : '0ms',
                                transform: menuOpen ? 'translateY(0)' : 'translateY(16px)',
                                opacity: menuOpen ? 1 : 0,
                                transitionProperty: 'transform, opacity, color',
                                transitionDuration: '300ms, 300ms, 200ms',
                            }}
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>
            </div>
        </>
    );
}
