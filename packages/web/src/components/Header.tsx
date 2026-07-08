import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ChevronRight, LogOut, Moon, Settings, Sun, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDevAdmin } from '../hooks/useDevAdmin';
import { useTheme } from '../hooks/useTheme';
import { getDiscordDisplayName } from '../lib/discord';
import { DiscordAvatar } from './DiscordAvatar';

const NAV_LINKS: { label: string; href: string }[] = [
    { href: '/config', label: 'Configuration' },
    { href: '/usage', label: 'Utilisation' },
    { href: '/updates', label: 'Patch Notes' },
];

function BurgerIcon() {
    return (
        <span className="flex w-4 flex-col gap-[5px]" aria-hidden="true">
            <span className="h-px w-full bg-foreground" />
            <span className="h-px w-full bg-foreground" />
        </span>
    );
}

export default function Header() {
    const { session, user, signOut } = useAuth();
    const { isDevAdmin } = useDevAdmin(session?.access_token);
    const location = useLocation();
    const navigate = useNavigate();
    const { isDark, toggle, setTheme } = useTheme();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 0);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [location.pathname]);

    const isActive = (href: string) => (href === '/' ? location.pathname === '/' : location.pathname.startsWith(href));

    const handleLogout = () => {
        signOut();
        window.location.href = '/';
    };

    const displayName = getDiscordDisplayName(user);

    return (
        <>
            <header
                className={cn(
                    'fixed inset-x-0 top-0 z-50 w-full border-b bg-background/70 backdrop-blur-md transition-colors duration-200 supports-[backdrop-filter]:bg-background/60',
                    scrolled ? 'border-border' : 'border-transparent',
                )}
            >
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
                    {/* Logo */}
                    <a href="/" className="flex shrink-0 items-center gap-2 text-base font-semibold">
                        <img
                            src="/assets/images/livechat_transparent.png"
                            alt="LiveChat"
                            className={cn('h-6 w-6', !isDark && 'invert')}
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
                                    isActive(link.href) ? 'text-foreground font-medium' : 'text-muted-foreground'
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
                            className="hidden lg:flex"
                        >
                            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>

                        {user ? (
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <button className="group hidden h-8 shrink-0 cursor-pointer items-center gap-0 rounded-full border border-border bg-background p-0 transition-colors hover:bg-accent sm:gap-2 sm:pr-3 lg:flex">
                                        <DiscordAvatar
                                            user={user}
                                            className="h-full w-8 shrink-0 rounded-full object-cover"
                                        />
                                        <span className="hidden max-w-[120px] truncate text-xs font-semibold text-muted-foreground transition-colors group-hover:text-foreground sm:inline">
                                            {displayName}
                                        </span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem onClick={() => navigate('/account')}>
                                        <User className="h-4 w-4" />
                                        Mon compte
                                    </DropdownMenuItem>
                                    {isDevAdmin ? (
                                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                                            <Settings className="h-4 w-4" />
                                            Développeur
                                        </DropdownMenuItem>
                                    ) : null}
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
                            <Button asChild size="sm" variant="outline" className="hidden lg:flex">
                                <a href="/config">Se connecter</a>
                            </Button>
                        )}

                        {/* Mobile full-screen menu */}
                        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Ouvrir le menu">
                                    <BurgerIcon />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="fullscreen"
                                overlayClassName="bg-background"
                                className="flex flex-col p-0 duration-200 [&>button]:hidden"
                            >
                                {/* Menu header */}
                                <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 px-4 sm:px-6">
                                    <a
                                        href="/"
                                        className="flex items-center gap-2 text-base font-semibold"
                                        onClick={() => setSheetOpen(false)}
                                    >
                                        <img
                                            src="/assets/images/livechat_transparent.png"
                                            alt="LiveChat"
                                            className={cn('h-6 w-6', !isDark && 'invert')}
                                            width={24}
                                            height={24}
                                            draggable={false}
                                        />
                                        <span>LiveChat</span>
                                    </a>
                                    <SheetClose asChild>
                                        <Button variant="ghost" size="icon" aria-label="Fermer le menu">
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </SheetClose>
                                </div>

                                <div className="flex flex-1 flex-col overflow-y-auto">
                                    {/* User section */}
                                    {user && (
                                        <div className="border-b border-border px-4 py-5 sm:px-6">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold">{displayName}</p>
                                                    <p className="truncate font-mono text-xs text-muted-foreground">
                                                        {user.id}
                                                    </p>
                                                </div>
                                                <DiscordAvatar
                                                    user={user}
                                                    alt=""
                                                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                                                />
                                            </div>

                                            <div className="mt-4 divide-y divide-border">
                                                <button
                                                    onClick={() => {
                                                        navigate('/account');
                                                        setSheetOpen(false);
                                                    }}
                                                    className="flex w-full cursor-pointer items-center justify-between py-3 text-sm transition-colors hover:text-muted-foreground"
                                                >
                                                    Mon compte
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                </button>
                                                {isDevAdmin ? (
                                                    <button
                                                        onClick={() => {
                                                            navigate('/admin');
                                                            setSheetOpen(false);
                                                        }}
                                                        className="flex w-full cursor-pointer items-center justify-between py-3 text-sm transition-colors hover:text-muted-foreground"
                                                    >
                                                        Développeur
                                                        <Settings className="h-4 w-4 text-muted-foreground" />
                                                    </button>
                                                ) : null}
                                                <div className="flex items-center justify-between py-3">
                                                    <span className="text-sm">Thème</span>
                                                    <div className="flex rounded-md border border-border p-0.5">
                                                        <button
                                                            onClick={() => setTheme(false)}
                                                            className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm transition-colors ${
                                                                !isDark
                                                                    ? 'bg-foreground text-background'
                                                                    : 'text-muted-foreground hover:text-foreground'
                                                            }`}
                                                            aria-label="Mode clair"
                                                        >
                                                            <Sun className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setTheme(true)}
                                                            className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm transition-colors ${
                                                                isDark
                                                                    ? 'bg-foreground text-background'
                                                                    : 'text-muted-foreground hover:text-foreground'
                                                            }`}
                                                            aria-label="Mode sombre"
                                                        >
                                                            <Moon className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        void handleLogout();
                                                        setSheetOpen(false);
                                                    }}
                                                    className="flex w-full cursor-pointer items-center justify-between py-3 text-sm transition-colors hover:text-muted-foreground"
                                                >
                                                    Se déconnecter
                                                    <LogOut className="h-4 w-4 text-muted-foreground" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Main navigation */}
                                    <nav className="flex flex-col px-4 py-6 sm:px-6" aria-label="Navigation mobile">
                                        {NAV_LINKS.map((link) => (
                                            <a
                                                key={link.href}
                                                href={link.href}
                                                onClick={() => setSheetOpen(false)}
                                                className={`flex items-center justify-between border-b border-border py-4 text-lg font-medium transition-colors hover:text-muted-foreground ${
                                                    isActive(link.href) ? 'text-foreground' : 'text-foreground/80'
                                                }`}
                                            >
                                                {link.label}
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </a>
                                        ))}
                                    </nav>

                                    {/* Theme for guests */}
                                    {!user && (
                                        <div className="flex items-center justify-between border-t border-border px-4 py-4 sm:px-6">
                                            <span className="text-sm">Thème</span>
                                            <div className="flex rounded-md border border-border p-0.5">
                                                <button
                                                    onClick={() => setTheme(false)}
                                                    className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm transition-colors ${
                                                        !isDark
                                                            ? 'bg-foreground text-background'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                                    aria-label="Mode clair"
                                                >
                                                    <Sun className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setTheme(true)}
                                                    className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm transition-colors ${
                                                        isDark
                                                            ? 'bg-foreground text-background'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                                    aria-label="Mode sombre"
                                                >
                                                    <Moon className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bottom CTA */}
                                    <div className="mt-auto px-4 pb-8 pt-4 sm:px-6">
                                        {!user ? (
                                            <a
                                                href="/config"
                                                onClick={() => setSheetOpen(false)}
                                                className="block w-full rounded-md border border-border py-3 text-center text-sm font-medium transition-colors hover:bg-accent"
                                            >
                                                Se connecter
                                            </a>
                                        ) : (
                                            <a
                                                href="/config"
                                                onClick={() => setSheetOpen(false)}
                                                className="block w-full rounded-md border border-border py-3 text-center text-sm font-medium transition-colors hover:bg-accent"
                                            >
                                                Configurer votre overlay
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>
            <div className="h-14 shrink-0" aria-hidden="true" />
        </>
    );
}
