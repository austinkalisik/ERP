import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from './AuthContext';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
    system_name: 'Nextgen Assets Management System',
    system_tagline: 'Owned by Nextgen Technology',
    company_name: 'NextGen Technology',
    company_website: 'https://nextgenpng.net/',
    support_email: 'support@nextgenpng.net',
    low_stock_threshold: '5',
    assignment_overdue_days: '7',
    items_per_page: '10',
    email_notifications_enabled: '1',
    maintenance_alerts_enabled: '1',
    allow_user_impersonation: '1',
    system_logo: '',
    system_logo_url: '',
};

const SETTINGS_CACHE_KEY = 'nextgen.settings.v1';
const SETTINGS_CACHE_TTL = 10 * 60 * 1000;

function readCachedSettings() {
    try {
        const cached = window.sessionStorage.getItem(SETTINGS_CACHE_KEY);

        if (!cached) {
            return null;
        }

        const parsed = JSON.parse(cached);

        if (!parsed?.settings || Date.now() - parsed.timestamp > SETTINGS_CACHE_TTL) {
            window.sessionStorage.removeItem(SETTINGS_CACHE_KEY);
            return null;
        }

        return parsed.settings;
    } catch {
        return null;
    }
}

function writeCachedSettings(settings) {
    try {
        window.sessionStorage.setItem(
            SETTINGS_CACHE_KEY,
            JSON.stringify({
                settings,
                timestamp: Date.now(),
            })
        );
    } catch {
        // Storage can be unavailable in private browser modes.
    }
}

export function SettingsProvider({ children }) {
    const { isAuthenticated } = useAuth();
    const cachedSettings = readCachedSettings();
    const [settings, setSettings] = useState(cachedSettings || DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(!cachedSettings);

    const refreshSettings = useCallback(async () => {
        if (!isAuthenticated) {
            setSettings(DEFAULT_SETTINGS);
            setLoading(false);
            return;
        }

        try {
            const response = await apiClient.get('/settings');
            const rows = response.data.data || response.data || [];
            const mapped = { ...DEFAULT_SETTINGS };

            rows.forEach((row) => {
                mapped[row.key] = row.value ?? '';

                if (row.key === 'system_logo' && row.value) {
                    const version = encodeURIComponent(row.updated_at ?? Date.now());
                    mapped.system_logo_url = `/api/settings/branding/logo/file?v=${version}`;
                }
            });

            if (!mapped.system_logo) {
                mapped.system_logo_url = '';
            }

            writeCachedSettings(mapped);
            setSettings(mapped);
        } catch (error) {
            console.error('Failed to load settings', error);
            setSettings(DEFAULT_SETTINGS);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        void refreshSettings();
    }, [refreshSettings]);

    const value = useMemo(
        () => ({
            settings,
            loading,
            refreshSettings,
            getSetting: (key, fallback = '') => settings[key] ?? fallback,
            getNumberSetting: (key, fallback = 0) => {
                const value = Number.parseInt(settings[key] ?? '', 10);
                return Number.isNaN(value) ? fallback : value;
            },
            isEnabled: (key) => String(settings[key] ?? '0') === '1',
        }),
        [settings, loading, refreshSettings]
    );

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
    const context = useContext(SettingsContext);

    if (!context) {
        throw new Error('useSettings must be used inside SettingsProvider');
    }

    return context;
}
