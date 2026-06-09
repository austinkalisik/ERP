import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { invalidateNotificationsCache } from '../hooks/useNotifications';

const STATUS_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
];

const PRIORITY_OPTIONS = [
    { value: 'all', label: 'All priorities' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Low' },
];

const PRIORITY_STYLES = {
    high: 'border-red-200 bg-red-50 text-red-700',
    medium: 'border-amber-200 bg-amber-50 text-amber-700',
    normal: 'border-blue-200 bg-blue-50 text-blue-700',
    low: 'border-slate-200 bg-slate-50 text-slate-600',
};

function formatDate(value) {
    if (!value) {
        return 'N/A';
    }

    return new Date(value).toLocaleString();
}

function titleCase(value) {
    return (value || 'general')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function priorityClass(priority) {
    return PRIORITY_STYLES[priority] || PRIORITY_STYLES.normal;
}

export default function NotificationsPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        type: 'all',
        search: '',
    });

    const unreadCount = stats.unread ?? items.filter((item) => !item.is_read).length;
    const typeOptions = useMemo(() => {
        const types = Object.keys(stats.by_type || {});

        return [
            { value: 'all', label: 'All types' },
            ...types.map((type) => ({ value: type, label: titleCase(type) })),
        ];
    }, [stats.by_type]);

    async function loadNotifications() {
        try {
            setLoading(true);

            const params = {
                per_page: 50,
                status: filters.status,
                priority: filters.priority,
                type: filters.type,
                search: filters.search,
            };

            const [notificationsResponse, statsResponse] = await Promise.all([
                apiClient.get('/notifications', { params }),
                apiClient.get('/notifications/stats'),
            ]);

            setItems(notificationsResponse.data.data || []);
            setStats(statsResponse.data || {});
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadNotifications();
    }, [filters.status, filters.priority, filters.type, filters.search]);

    function updateFilter(key, value) {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }

    function handleSearchSubmit(event) {
        event.preventDefault();
        updateFilter('search', searchInput.trim());
    }

    async function refreshAfterMutation() {
        invalidateNotificationsCache();
        await loadNotifications();
    }

    async function handleOpen(notification) {
        try {
            setBusyId(notification.id);

            if (!notification.is_read) {
                await apiClient.patch(`/notifications/${notification.id}/read`);
                invalidateNotificationsCache();
            }

            navigate(notification.url || '/notifications');
        } catch (error) {
            console.error('Failed to open notification', error);
        } finally {
            setBusyId(null);
        }
    }

    async function handleToggleRead(notification) {
        try {
            setBusyId(notification.id);

            const endpoint = notification.is_read
                ? `/notifications/${notification.id}/unread`
                : `/notifications/${notification.id}/read`;

            const response = await apiClient.patch(endpoint);
            const updated = response.data.notification;

            setItems((prev) =>
                prev.map((item) =>
                    item.id === notification.id
                        ? {
                              ...item,
                              ...(updated || {}),
                              is_read: !notification.is_read,
                              read_at: notification.is_read ? null : updated?.read_at || new Date().toISOString(),
                          }
                        : item
                )
            );

            setStats((prev) => ({
                ...prev,
                unread: Math.max(0, (prev.unread || 0) + (notification.is_read ? 1 : -1)),
                read: Math.max(0, (prev.read || 0) + (notification.is_read ? -1 : 1)),
            }));
            invalidateNotificationsCache();
        } catch (error) {
            console.error('Failed to update notification', error);
        } finally {
            setBusyId(null);
        }
    }

    async function handleMarkAllRead() {
        try {
            await apiClient.patch('/notifications/read-all');
            await refreshAfterMutation();
        } catch (error) {
            console.error('Failed to mark all notifications as read', error);
        }
    }

    async function handleDelete(notification) {
        try {
            setBusyId(notification.id);
            await apiClient.delete(`/notifications/${notification.id}`);
            await refreshAfterMutation();
        } catch (error) {
            console.error('Failed to delete notification', error);
        } finally {
            setBusyId(null);
        }
    }

    async function handleClearRead() {
        try {
            await apiClient.delete('/notifications/read');
            await refreshAfterMutation();
        } catch (error) {
            console.error('Failed to clear read notifications', error);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
                    <p className="mt-1 text-sm text-slate-500">Prioritized alerts and system activity for your asset operations.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600">
                        Total <span className="font-semibold text-slate-900">{stats.total ?? items.length}</span>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
                        Unread <span className="font-semibold">{unreadCount}</span>
                    </div>
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                        High <span className="font-semibold">{stats.high_priority_unread ?? 0}</span>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto] lg:items-center">
                    <form onSubmit={handleSearchSubmit} className="flex gap-2">
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Search notifications"
                            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                        <button type="submit" className="btn-primary">
                            Search
                        </button>
                    </form>

                    <select
                        value={filters.status}
                        onChange={(event) => updateFilter('status', event.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.priority}
                        onChange={(event) => updateFilter('priority', event.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                        {PRIORITY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.type}
                        onChange={(event) => updateFilter('type', event.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                        {typeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button type="button" onClick={handleMarkAllRead} className="btn-secondary">
                            Mark All Read
                        </button>
                        <button type="button" onClick={handleClearRead} className="btn-secondary">
                            Clear Read
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
                    Loading notifications...
                </div>
            ) : (
                <div className="space-y-4">
                    {items.length > 0 ? (
                        items.map((notification) => (
                            <div
                                key={notification.id}
                                className={[
                                    'rounded-xl border p-5 shadow-sm transition',
                                    notification.is_read ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50/50',
                                ].join(' ')}
                            >
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-lg font-semibold text-slate-900">{notification.title}</h2>
                                            {!notification.is_read ? (
                                                <span className="inline-flex rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                                                    New
                                                </span>
                                            ) : null}
                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityClass(notification.priority)}`}>
                                                {titleCase(notification.priority)}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-sm text-slate-600">{notification.message}</p>

                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                            <span>{titleCase(notification.type)}</span>
                                            <span>|</span>
                                            <span>{formatDate(notification.created_at)}</span>
                                            {notification.source_type ? (
                                                <>
                                                    <span>|</span>
                                                    <span>{titleCase(notification.source_type)} #{notification.source_id}</span>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleOpen(notification)}
                                            disabled={busyId === notification.id}
                                            className="btn-primary disabled:opacity-60"
                                        >
                                            {busyId === notification.id ? 'Opening...' : 'Open'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleToggleRead(notification)}
                                            disabled={busyId === notification.id}
                                            className="btn-secondary disabled:opacity-60"
                                        >
                                            {notification.is_read ? 'Mark Unread' : 'Mark Read'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(notification)}
                                            disabled={busyId === notification.id}
                                            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
                            No notifications found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
