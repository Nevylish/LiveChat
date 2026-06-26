import { LogOut, Menu, Moon, Sliders, Sun } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const NAV_LINKS: { label: string; href: string }[] = [
    { href: '/config', label: 'Configuration' },
    { href: '/usage', label: 'Utilisation' },
    { href: '/updates', label: 'Patch Notes' },
];

function useTheme() {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

    const toggle = useCallback(() => {
        const next = !document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', next);
        document.documentElement.style.backgroundColor = '';
        localStorage.setItem('livechat-theme', next ? 'dark' : 'light');
        setIsDark(next);
    }, []);

    return { isDark, toggle };
}

export default function Header() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { isDark, toggle } = useTheme();
    const [sheetOpen, setSheetOpen] = useState(false);

    const isActive = (href: string) =>
        href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const displayName =
        user?.user_metadata?.global_name ??
        user?.user_metadata?.custom_claims?.global_name ??
        user?.user_metadata?.full_name ??
        user?.user_metadata?.name ??
        'Utilisateur';

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-sm">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
                {/* Logo */}
                <a href="/" className="flex shrink-0 items-center gap-2 text-sm font-semibold">
                    <img
                        src="/assets/images/livechat_transparent.png"
                        alt="LiveChat"
                        className="h-6 w-6 invert dark:invert-0"
                        width={24}
                        height={24}
                        draggable={false}
                    />
                    <span>LiveChat</span>
                </a>

                {/* Desktop nav */}
                <nav className="hidden lg:flex items-center gap-6" aria-label="Navigation principale">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className={`text-sm transition-colors hover:text-foreground ${
                                isActive(link.href)
                                    ? 'text-foreground font-medium'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                {/* Right side */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggle}
                        aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
                    >
                        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>

                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="group flex h-8 shrink-0 cursor-pointer items-center gap-0 rounded-full border border-border bg-background p-0 transition-colors hover:bg-accent sm:gap-2 sm:pr-3">
                                    <img
                                        src={
                                            user.user_metadata?.avatar_url ||
                                            'https://cdn.discordapp.com/embed/avatars/0.png'
                                        }
                                        alt="Avatar"
                                        className="h-full w-8 shrink-0 rounded-full object-cover"
                                    />
                                    <span className="hidden max-w-[120px] truncate text-xs font-semibold text-muted-foreground transition-colors group-hover:text-foreground sm:inline">
                                        {displayName}
                                    </span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => navigate('/config')}>
                                    <Sliders className="h-4 w-4" />
                                    Configuration
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Se déconnecter
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild size="sm" variant="outline" className="hidden sm:flex">
                            <a href="/config">Se connecter</a>
                        </Button>
                    )}

                    {/* Mobile sheet */}
                    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                                aria-label="Ouvrir le menu"
                            >
                                <Menu className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64">
                            <div className="mt-6 flex flex-col gap-1">
                                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Navigation
                                </p>
                                {NAV_LINKS.map((link) => (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setSheetOpen(false)}
                                        className={`rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-foreground ${
                                            isActive(link.href)
                                                ? 'bg-accent text-foreground font-medium'
                                                : 'text-muted-foreground'
                                        }`}
                                    >
                                        {link.label}
                                    </a>
                                ))}
                                {!user && (
                                    <a
                                        href="/config"
                                        onClick={() => setSheetOpen(false)}
                                        className="mt-4 rounded-md border border-border px-3 py-2 text-center text-sm font-medium transition-colors hover:bg-accent"
                                    >
                                        Se connecter
                                    </a>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
