import { Hash } from 'lucide-react';
import type { ReactNode } from 'react';
import { DiscordThemeProvider, useDiscordTheme } from './discordTheme';

interface DiscordDemoProps {
    children: ReactNode;
    /** Channel name shown in the mock header. */
    channel?: string;
    className?: string;
}

function DiscordDemoFrame({ children, channel = 'commandes', className }: DiscordDemoProps) {
    const theme = useDiscordTheme();

    return (
        <div className={`min-w-0 overflow-hidden rounded-xl border border-border shadow-sm ${className ?? ''}`}>
            <div
                className="flex items-center gap-2 border-b px-4 py-2.5 text-sm font-semibold"
                style={{
                    backgroundColor: theme.bg,
                    borderColor: theme.separator,
                    color: theme.channelText,
                }}
            >
                <Hash className="h-4 w-4" style={{ color: theme.hashIcon }} />
                {channel}
            </div>
            <div className="py-3" style={{ backgroundColor: theme.bg }}>
                {children}
            </div>
        </div>
    );
}

/**
 * Frames a custom Discord-style chat mockup that follows the site light/dark theme.
 */
export default function DiscordDemo(props: DiscordDemoProps) {
    return (
        <DiscordThemeProvider>
            <DiscordDemoFrame {...props} />
        </DiscordThemeProvider>
    );
}
