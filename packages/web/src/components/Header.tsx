import type { User as SupabaseUser } from '@supabase/supabase-js';
import { LogOut, Sliders, User as UserIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const NAV_LINKS: { label: string; href: string; external?: boolean }[] = [
    { href: '/config', label: 'Configuration' },
    { href: '/usage', label: 'Utilisation' },
    { href: '/updates', label: 'Patch Notes' },
];

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Scroll listener to detach header
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    function toggleMenu() {
        if (menuOpen) {
            closeMenu();
        } else {
            setMenuOpen(true);
            document.body.style.overflow = 'hidden';
        }
    }

    const handleLogout = async () => {
        setDropdownOpen(false);
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <>
            <header
                className={`sticky z-50 transition-all duration-300 w-full ${
                    menuOpen
                        ? 'top-0 px-0 bg-transparent border-b border-transparent backdrop-blur-none'
                        : scrolled
                          ? 'top-4 px-4 sm:px-6 bg-transparent border-b border-transparent backdrop-blur-none'
                          : 'top-0 px-0 bg-background/80 backdrop-blur-sm border-b border-border/40'
                }`}
            >
                <div
                    className={`mx-auto flex w-full max-w-6xl items-center justify-between transition-all duration-300 ${
                        menuOpen
                            ? 'rounded-none border border-transparent bg-transparent shadow-none px-5 py-4'
                            : scrolled
                              ? 'rounded-2xl border border-border bg-background/70 backdrop-blur-md shadow-lg shadow-black/10 px-5 py-3'
                              : 'rounded-none border border-transparent bg-transparent shadow-none px-5 py-4'
                    }`}
                >
                    <div className="flex items-center gap-8">
                        <a href="/" className="flex items-center gap-2.5 text-lg font-bold shrink-0">
                            <img
                                src="/assets/images/livechat_transparent.png"
                                alt="LiveChat"
                                className="h-8 w-8"
                                width={32}
                                height={32}
                                draggable={false}
                            />
                            <span>LiveChat</span>
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
                                                !link.external && location.pathname === link.href
                                                    ? 'text-foreground'
                                                    : ''
                                            }`}
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>

                    <div className="relative flex items-center gap-4" ref={dropdownRef}>
                        {user ? (
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className={`flex items-center gap-2 rounded-full border border-border bg-white/3 hover:bg-white/5 p-1 pr-3 transition-all duration-200 group shrink-0 cursor-pointer ${
                                    menuOpen ? 'hidden' : 'flex'
                                }`}
                                aria-expanded={dropdownOpen}
                                aria-haspopup="true"
                            >
                                <img
                                    src={
                                        user.user_metadata?.avatar_url ||
                                        'https://cdn.discordapp.com/embed/avatars/0.png'
                                    }
                                    alt="Avatar"
                                    className="h-7 w-7 rounded-full border border-white/10 object-cover"
                                />
                                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[120px]">
                                    {user.user_metadata?.global_name ||
                                        user.user_metadata?.custom_claims?.global_name ||
                                        user.user_metadata?.full_name ||
                                        user.user_metadata?.name ||
                                        'Utilisateur'}
                                </span>
                            </button>
                        ) : (
                            <a
                                href="/config"
                                className={`flex items-center gap-2 rounded-full border border-border bg-white/3 hover:bg-white/5 p-1 pr-3 transition-all duration-200 group shrink-0 ${
                                    menuOpen ? 'hidden' : 'flex'
                                }`}
                            >
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-muted-foreground group-hover:bg-white/10 group-hover:text-foreground transition-colors duration-200">
                                    <UserIcon className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                    Se connecter
                                </span>
                            </a>
                        )}

                        {/* Dropdown Menu */}
                        {user && dropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                                <button
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        navigate('/config');
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors cursor-pointer"
                                >
                                    <Sliders className="h-4 w-4" />
                                    Configuration
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Se déconnecter
                                </button>
                            </div>
                        )}

                        {/* Burger button */}
                        <button
                            className="flex h-10 w-10 items-center justify-center rounded-lg md:hidden hover:bg-white/5 transition-colors cursor-pointer shrink-0"
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
                                        menuOpen ? 'translate-y-[-8px] -rotate-45' : ''
                                    }`}
                                />
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            <div
                className={`fixed inset-0 z-40 flex flex-col bg-background transition-opacity duration-300 md:pointer-events-none md:hidden md:opacity-0 ${
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
                            tabIndex={menuOpen ? 0 : -1}
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
