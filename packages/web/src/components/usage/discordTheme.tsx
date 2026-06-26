import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface DiscordTheme {
    bg: string;
    separator: string;
    elementBorder: string;
    channelText: string;
    hashIcon: string;
    textMuted: string;
    textSecondary: string;
    textPrimary: string;
    botName: string;
    link: string;
    slashIcon: string;
    slashUsername: string;
    embedBg: string;
    embedTitle: string;
    embedBody: string;
    embedArrow: string;
    buttonBg: string;
    buttonBgHover: string;
    buttonText: string;
}

const DISCORD_DARK: DiscordTheme = {
    bg: '#070709',
    separator: '#222225',
    elementBorder: '#2c2d31',
    channelText: '#dbdee1',
    hashIcon: '#80848e',
    textMuted: '#949ba4',
    textSecondary: '#dbdee1',
    textPrimary: '#f2f3f5',
    botName: '#62a1ff',
    link: '#00a8fc',
    slashIcon: '#4e5058',
    slashUsername: '#dbdee1',
    embedBg: '#131416',
    embedTitle: '#f2f3f5',
    embedBody: '#dbdee1',
    embedArrow: '#f2f3f5',
    buttonBg: '#2A2B3A',
    buttonBgHover: '#35364a',
    buttonText: '#f2f3f5',
};

const DISCORD_LIGHT: DiscordTheme = {
    bg: '#ffffff',
    separator: '#e3e5e8',
    elementBorder: '#e3e5e8',
    channelText: '#060607',
    hashIcon: '#80848e',
    textMuted: '#747f8d',
    textSecondary: '#2e3338',
    textPrimary: '#060607',
    botName: '#006ce7',
    link: '#006ce7',
    slashIcon: '#b5bac1',
    slashUsername: '#2e3338',
    embedBg: '#f2f3f5',
    embedTitle: '#060607',
    embedBody: '#2e3338',
    embedArrow: '#2e3338',
    buttonBg: '#e3e5e8',
    buttonBgHover: '#d4d7dc',
    buttonText: '#4e5058',
};

const DiscordThemeContext = createContext<DiscordTheme>(DISCORD_DARK);

function useSiteIsDark() {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    return isDark;
}

export function DiscordThemeProvider({ children }: { children: ReactNode }) {
    const isDark = useSiteIsDark();
    const theme = isDark ? DISCORD_DARK : DISCORD_LIGHT;

    return <DiscordThemeContext.Provider value={theme}>{children}</DiscordThemeContext.Provider>;
}

export function useDiscordTheme() {
    return useContext(DiscordThemeContext);
}
