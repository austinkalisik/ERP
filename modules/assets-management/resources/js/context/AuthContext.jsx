import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../api/client';
import { clearApiSessionCache } from '../hooks/useApi';

const AuthContext = createContext(null);
const isLoginRoute = window.location.pathname === '/login';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(!isLoginRoute);

    const fetchMe = useCallback(async () => {
        try {
            const response = await apiClient.get('/me');
            setUser(response.data);
            return response.data;
        } catch (error) {
            if (error?.response?.status !== 401) {
                console.error('Failed to fetch authenticated user', error);
            }

            setUser(null);
            return null;
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        async function initialize() {
            try {
                await fetchMe();
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        void initialize();

        return () => {
            mounted = false;
        };
    }, [fetchMe]);

    const login = useCallback(
        async (email, password) => {
            setLoading(true);

            try {
                const response = await apiClient.post('/login', {
                    email,
                    password,
                });

                const authenticatedUser = response?.data?.user ?? (await fetchMe());

                if (!authenticatedUser) {
                    return {
                        success: false,
                        error: 'Login succeeded but user session could not be loaded.',
                    };
                }

                clearApiSessionCache();
                setUser(authenticatedUser);

                return {
                    success: true,
                    user: authenticatedUser,
                };
            } catch (error) {
                setUser(null);

                return {
                    success: false,
                    error:
                        error?.response?.data?.message ||
                        error?.response?.data?.error ||
                        'Invalid email or password.',
                };
            } finally {
                setLoading(false);
            }
        },
        [fetchMe]
    );

    const logout = useCallback(async () => {
        try {
            await apiClient.post('/logout');
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            clearApiSessionCache();
            setUser(null);
        }
    }, []);

    const impersonate = useCallback(
        async (userId) => {
            await apiClient.post(`/users/${userId}/impersonate`);
            clearApiSessionCache();
            return fetchMe();
        },
        [fetchMe]
    );

    const stopImpersonation = useCallback(async () => {
        const response = await apiClient.post('/users/stop-impersonation');
        clearApiSessionCache();
        const restoredUser = response?.data?.user ?? (await fetchMe());

        if (restoredUser) {
            setUser(restoredUser);
        }

        return restoredUser;
    }, [fetchMe]);

    const value = useMemo(
        () => ({
            user,
            loading,
            isAuthenticated: Boolean(user),
            login,
            logout,
            refreshUser: fetchMe,
            impersonate,
            stopImpersonation,
        }),
        [user, loading, login, logout, fetchMe, impersonate, stopImpersonation]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }

    return context;
}
