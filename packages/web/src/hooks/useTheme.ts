import { useCallback, useState } from 'react';

const THEME_STORAGE_KEY = 'livechat-theme';

function applyTheme(dark: boolean) {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.backgroundColor = '';
    localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
}

function canAnimateTheme() {
    return (
        typeof document.startViewTransition === 'function' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
        // iOS Safari breaks fixed + filter layers during root view transitions
        window.matchMedia('(hover: hover) and (pointer: fine)').matches
    );
}

export function useTheme() {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

    const setTheme = useCallback((dark: boolean) => {
        const update = () => {
            applyTheme(dark);
            setIsDark(dark);
        };

        if (canAnimateTheme()) {
            document.startViewTransition(update);
        } else {
            update();
        }
    }, []);

    const toggle = useCallback(() => {
        setTheme(!document.documentElement.classList.contains('dark'));
    }, [setTheme]);

    return { isDark, toggle, setTheme };
}
