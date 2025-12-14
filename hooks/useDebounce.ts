'use client';

import { useCallback, useRef, useEffect } from 'react';

export function useDebounce(callback: () => void, delay: number) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callbackRef = useRef(callback);

    // Update the ref to the latest callback on every render
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    return useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            if (callbackRef.current) {
                callbackRef.current();
            }
        }, delay);
    }, [delay]);
}