import { useEffect, useState } from 'react';
import { fetchDevMe } from '../api/devApi';

export function useDevAdmin(accessToken: string | undefined): { isDevAdmin: boolean; accessChecked: boolean } {
    const [isDevAdmin, setIsDevAdmin] = useState(false);
    const [accessChecked, setAccessChecked] = useState(!accessToken);

    useEffect(() => {
        if (!accessToken) {
            setIsDevAdmin(false);
            setAccessChecked(true);
            return;
        }

        setAccessChecked(false);
        let cancelled = false;

        fetchDevMe(accessToken)
            .then((data) => {
                if (!cancelled) {
                    setIsDevAdmin(data.isDevAdmin);
                    setAccessChecked(true);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setIsDevAdmin(false);
                    setAccessChecked(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [accessToken]);

    return { isDevAdmin, accessChecked };
}
