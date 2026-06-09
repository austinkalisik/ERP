import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import apiClient from '../api/client';

const requestCache = new Map();
const inFlightRequests = new Map();
const DEFAULT_TTL = 2 * 60 * 1000;
const CACHE_PREFIX = 'nextgen-api-cache:';

function stableStringify(value) {
    try {
        return JSON.stringify(value ?? {});
    } catch {
        return '{}';
    }
}

function buildCacheKey(endpoint, options) {
    return `${endpoint}::${stableStringify(options)}`;
}

function readSessionCache(cacheKey) {
    try {
        const raw = window.sessionStorage.getItem(`${CACHE_PREFIX}${cacheKey}`);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeSessionCache(cacheKey, value) {
    try {
        window.sessionStorage.setItem(
            `${CACHE_PREFIX}${cacheKey}`,
            JSON.stringify(value)
        );
    } catch {
        return;
    }
}

function removeSessionCache(cacheKey) {
    try {
        window.sessionStorage.removeItem(`${CACHE_PREFIX}${cacheKey}`);
    } catch {
        return;
    }
}

function getCachedEntry(key, ttl) {
    const memoryEntry = requestCache.get(key);
    const entry = memoryEntry ?? readSessionCache(key);

    if (!entry) {
        return null;
    }

    if (Date.now() - entry.timestamp > ttl) {
        requestCache.delete(key);
        removeSessionCache(key);
        return null;
    }

    if (!memoryEntry) {
        requestCache.set(key, entry);
    }

    return entry;
}

async function fetchWithCache(endpoint, options, cacheKey, ttl, force = false) {
    if (!force) {
        const cached = getCachedEntry(cacheKey, ttl);

        if (cached) {
            return cached.data;
        }

        if (inFlightRequests.has(cacheKey)) {
            return inFlightRequests.get(cacheKey);
        }
    }

    const requestPromise = apiClient
        .get(endpoint, options)
        .then((response) => {
            const data = response.data;
            const entry = {
                data,
                timestamp: Date.now(),
            };

            requestCache.set(cacheKey, entry);
            writeSessionCache(cacheKey, entry);
            inFlightRequests.delete(cacheKey);

            return data;
        })
        .catch((error) => {
            inFlightRequests.delete(cacheKey);
            throw error;
        });

    inFlightRequests.set(cacheKey, requestPromise);

    return requestPromise;
}

export function invalidateApiCache(prefix = '') {
    for (const key of requestCache.keys()) {
        if (!prefix || key.startsWith(prefix)) {
            requestCache.delete(key);
            removeSessionCache(key);
        }
    }

    for (const key of inFlightRequests.keys()) {
        if (!prefix || key.startsWith(prefix)) {
            inFlightRequests.delete(key);
        }
    }
}

export function clearApiSessionCache() {
    requestCache.clear();
    inFlightRequests.clear();

    try {
        Object.keys(window.sessionStorage)
            .filter((key) => key.startsWith(CACHE_PREFIX))
            .forEach((key) => window.sessionStorage.removeItem(key));
    } catch {
        return;
    }
}

export function useApi(endpoint, options = {}, config = {}) {
    const ttl = config.ttl ?? DEFAULT_TTL;
    const enabled = config.enabled ?? true;

    const serializedOptions = useMemo(() => stableStringify(options), [options]);

    const parsedOptions = useMemo(() => {
        try {
            return JSON.parse(serializedOptions);
        } catch {
            return {};
        }
    }, [serializedOptions]);

    const cacheKey = useMemo(
        () => buildCacheKey(endpoint, parsedOptions),
        [endpoint, parsedOptions]
    );

    const initialCached = useMemo(() => {
        const cached = getCachedEntry(cacheKey, ttl);
        return cached ? cached.data : null;
    }, [cacheKey, ttl]);

    const [data, setData] = useState(initialCached);
    const [loading, setLoading] = useState(enabled && initialCached === null);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const mountedRef = useRef(true);

    const execute = useCallback(
        async (force = false) => {
            if (!enabled) {
                return null;
            }

            if (force) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError(null);

            try {
                const result = await fetchWithCache(
                    endpoint,
                    parsedOptions,
                    cacheKey,
                    ttl,
                    force
                );

                if (mountedRef.current) {
                    setData(result);
                }

                return result;
            } catch (err) {
                if (mountedRef.current) {
                    setError(
                        err?.response?.data?.message ||
                            err?.message ||
                            'An error occurred'
                    );
                }

                throw err;
            } finally {
                if (mountedRef.current) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [enabled, endpoint, parsedOptions, cacheKey, ttl]
    );

    const refetch = useCallback(async () => {
        invalidateApiCache(cacheKey);
        return execute(true);
    }, [cacheKey, execute]);

    const invalidate = useCallback(() => {
        invalidateApiCache(cacheKey);
    }, [cacheKey]);

    useEffect(() => {
        mountedRef.current = true;

        if (!enabled) {
            setLoading(false);
            return () => {
                mountedRef.current = false;
            };
        }

        const cached = getCachedEntry(cacheKey, ttl);

        if (cached) {
            setData(cached.data);
            setLoading(false);
            setError(null);
        } else {
            void execute(false);
        }

        return () => {
            mountedRef.current = false;
        };
    }, [cacheKey, ttl, enabled, execute]);

    return {
        data,
        loading,
        refreshing,
        error,
        refetch,
        invalidate,
    };
}

export default useApi;
