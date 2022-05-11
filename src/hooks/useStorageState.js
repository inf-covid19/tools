import { useState, useMemo, useEffect } from 'react'

function useStorageState(key, initialState) {
    const effectiveKey = useMemo(() => `tools.storageState.${key}`, [key]);

    const [state, setState] = useState(() => {
        try {
            const data = localStorage.getItem(effectiveKey);
            return JSON.parse(data) || initialState;
        } catch {
            return initialState;
        }
    });

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            localStorage.setItem(effectiveKey, JSON.stringify(state));
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [effectiveKey, state]);

    return [state, setState];
}

export default useStorageState