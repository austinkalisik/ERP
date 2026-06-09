import { useCallback, useEffect, useState } from 'react';
import apiClient from '../api/client';

let notificationsCache = null;
let unreadCountCache = null;
let notificationStatsCache = null;
let notificationsPromise = null;
const CACHE_TTL = 5 * 60 * 1000;
const POLL_INTERVAL = 2 * 60 * 1000;
const INITIAL_LOAD_DELAY = 1500;

function hasFreshCache() {
    if (!notificationsCache || unreadCountCache === null) {
        return false;
    }

    return Date.now() - notificationsCache.timestamp < CACHE_TTL;
}

async function fetchNotifications(force = false) {
    if (!force && hasFreshCache()) {
        return {
            notifications: notificationsCache.data,
            unreadCount: unreadCountCache,
            stats: notificationStatsCache,
        };
    }

    if (!force && notificationsPromise) {
        return notificationsPromise;
    }

    notificationsPromise = Promise.all([
        apiClient.get('/notifications', { params: { per_page: 8 } }),
        apiClient.get('/notifications/stats'),
    ])
        .then(([notificationsResponse, statsResponse]) => {
            const notifications = notificationsResponse.data.data || [];
            const stats = statsResponse.data || {};
            const unreadCount = stats.unread || 0;

            notificationsCache = {
                data: notifications,
                timestamp: Date.now(),
            };
            unreadCountCache = unreadCount;
            notificationStatsCache = stats;

            return {
                notifications,
                unreadCount,
                stats,
            };
        })
        .finally(() => {
            notificationsPromise = null;
        });

    return notificationsPromise;
}

function updateNotificationCache(notifications, unreadCount, stats = notificationStatsCache) {
    notificationsCache = {
        data: notifications,
        timestamp: Date.now(),
    };
    unreadCountCache = unreadCount;
    notificationStatsCache = stats;
}

export function invalidateNotificationsCache() {
    notificationsCache = null;
    unreadCountCache = null;
    notificationStatsCache = null;
    notificationsPromise = null;
}

export default function useNotifications() {
    const [notifications, setNotifications] = useState(() => notificationsCache?.data || []);
    const [unreadCount, setUnreadCount] = useState(() => unreadCountCache || 0);
    const [stats, setStats] = useState(() => notificationStatsCache || {});
    const [loading, setLoading] = useState(() => !hasFreshCache());

    const loadNotifications = useCallback(async (force = false) => {
        try {
            setLoading(!hasFreshCache() || force);

            const result = await fetchNotifications(force);

            setNotifications(result.notifications);
            setUnreadCount(result.unreadCount);
            setStats(result.stats || {});
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const markRead = useCallback(
        async (id) => {
            const response = await apiClient.patch(`/notifications/${id}/read`);
            const serverNotification = response.data.notification;

            setNotifications((prev) => {
                const previous = prev.find((item) => item.id === id);
                const wasUnread = previous ? !previous.is_read : false;
                const next = prev.map((item) =>
                    item.id === id
                        ? { ...item, ...(serverNotification || {}), is_read: true, read_at: serverNotification?.read_at || item.read_at || new Date().toISOString() }
                        : item
                );

                const nextUnreadCount = Math.max(0, (unreadCountCache || 0) - (wasUnread ? 1 : 0));
                updateNotificationCache(next, nextUnreadCount);
                setUnreadCount(nextUnreadCount);
                setStats((prev) => ({
                    ...prev,
                    unread: nextUnreadCount,
                    read: (prev.read || 0) + (wasUnread ? 1 : 0),
                }));

                return next;
            });
        },
        []
    );

    const markUnread = useCallback(async (id) => {
        const response = await apiClient.patch(`/notifications/${id}/unread`);
        const serverNotification = response.data.notification;

        setNotifications((prev) => {
            const previous = prev.find((item) => item.id === id);
            const wasRead = previous ? previous.is_read : true;
            const next = prev.map((item) =>
                item.id === id ? { ...item, ...(serverNotification || {}), is_read: false, read_at: null } : item
            );

            const nextUnreadCount = (unreadCountCache || 0) + (wasRead ? 1 : 0);
            updateNotificationCache(next, nextUnreadCount);
            setUnreadCount(nextUnreadCount);
            setStats((prev) => ({
                ...prev,
                unread: nextUnreadCount,
                read: Math.max(0, (prev.read || 0) - (wasRead ? 1 : 0)),
            }));

            return next;
        });
    }, []);

    const markAllRead = useCallback(async () => {
        await apiClient.patch('/notifications/read-all');

        setNotifications((prev) => {
            const next = prev.map((item) => ({
                ...item,
                is_read: true,
                read_at: item.read_at || new Date().toISOString(),
            }));

            updateNotificationCache(next, 0);
            return next;
        });

        setUnreadCount(0);
        setStats((prev) => ({
            ...prev,
            unread: 0,
            read: prev.total || prev.read || 0,
        }));
    }, []);

    const deleteNotification = useCallback(async (id) => {
        await apiClient.delete(`/notifications/${id}`);

        setNotifications((prev) => {
            const deleted = prev.find((item) => item.id === id);
            const next = prev.filter((item) => item.id !== id);
            const nextUnreadCount = Math.max(0, (unreadCountCache || 0) - (deleted && !deleted.is_read ? 1 : 0));

            updateNotificationCache(next, nextUnreadCount);
            setUnreadCount(nextUnreadCount);
            setStats((prev) => ({
                ...prev,
                total: Math.max(0, (prev.total ?? ((prev.read || 0) + (prev.unread || 0))) - 1),
                unread: nextUnreadCount,
            }));

            return next;
        });
    }, []);

    useEffect(() => {
        if (hasFreshCache()) {
            void loadNotifications(false);
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            void loadNotifications(false);
        }, INITIAL_LOAD_DELAY);

        return () => window.clearTimeout(timeoutId);
    }, [loadNotifications]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            void loadNotifications(true);
        }, POLL_INTERVAL);

        return () => window.clearInterval(intervalId);
    }, [loadNotifications]);

    return {
        notifications,
        unreadCount,
        stats,
        loading,
        loadNotifications,
        markRead,
        markUnread,
        markAllRead,
        deleteNotification,
    };
}
