import { useEffect, useState } from 'react';
import { fetchDevMe } from '../api/devApi';

export function useDevAdmin(accessToken: string | undefined): boolean {
    const [isDevAdmin, setIsDevAdmin] = useState(false);

    useEffect(() => {
        if (!accessToken) {
            setIsDevAdmin(false);
            return;
        }

        let cancelled = false;

        fetchDevMe(accessToken)
            .then((data) => {
                if (!cancelled) setIsDevAdmin(data.isDevAdmin);
            })
            .catch(() => {
                if (!cancelled) setIsDevAdmin(false);
            });

        return () => {
            cancelled = true;
        };
    }, [accessToken]);

    return isDevAdmin;
}
