import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

function StatCard({ label, value, gradient, icon: Icon }) {
    return (
        <div className={`group relative overflow-hidden rounded-[28px] bg-gradient-to-br ${gradient} p-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.24)]`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.22),_transparent_35%)]" />
            <div className="relative z-10 flex items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/70">{label}</p>
                    <p className="mt-3 text-3xl font-bold">{value ?? 0}</p>
                </div>
                {Icon ? (
                    <div className="p-3 border rounded-2xl border-white/15 bg-white/10 backdrop-blur">
                        <Icon className="h-7 w-7 text-white/85" />
                    </div>
                ) : null}
            </div>
            <div className="absolute w-24 h-24 rounded-full -right-6 -top-6 bg-white/10" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        </div>
    );
}

function ActionCard({ to, title, description, icon: Icon, variant = 'primary' }) {
    const variants = {
        primary: 'border border-blue-400/20 bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-500 text-white shadow-[0_18px_40px_rgba(37,99,235,0.24)]',
        secondary: 'border border-slate-200/80 bg-white/88 text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)]',
        success: 'border border-emerald-400/20 bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-500 text-white shadow-[0_18px_40px_rgba(16,185,129,0.24)]',
    };

    return (
        <Link
            to={to}
            className={`group block rounded-[28px] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.14)] ${variants[variant]}`}
        >
            <div className="flex items-center gap-4">
                <div className={`rounded-2xl p-3.5 ${variant === 'secondary' ? 'bg-slate-100 text-slate-700' : 'bg-white/15 text-white'}`}>
                    {Icon ? <Icon className={`h-5 w-5 ${variant === 'secondary' ? 'text-slate-700' : 'text-white'}`} /> : null}
                </div>
                <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className={`mt-1 text-sm ${variant === 'secondary' ? 'text-slate-500' : 'text-white/80'}`}>
                        {description}
                    </p>
                </div>
            </div>
        </Link>
    );
}

function formatDate(value) {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleDateString();
}

function SimpleBarChart({ data = [] }) {
    const max = Math.max(...data.map((item) => Number(item.value) || 0), 1);

    return (
        <div className="flex h-44 items-end gap-3">
            {data.map((item) => {
                const height = Math.max(8, Math.round(((Number(item.value) || 0) / max) * 100));

                return (
                    <div key={item.date || item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                        <div className="flex h-32 w-full items-end rounded-lg bg-slate-100">
                            <div
                                className="w-full rounded-lg bg-gradient-to-t from-blue-700 to-cyan-400 transition-all duration-300"
                                style={{ height: `${height}%` }}
                                title={`${item.label}: ${item.value}`}
                            />
                        </div>
                        <span className="text-xs font-semibold text-slate-500">{item.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

function StatusChart({ data = [] }) {
    const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

    return (
        <div className="space-y-4">
            {data.map((item) => {
                const value = Number(item.value) || 0;
                const percent = total > 0 ? Math.round((value / total) * 100) : 0;

                return (
                    <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                            <span className="font-medium text-slate-700">{item.label}</span>
                            <span className="font-semibold text-slate-900">{value}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${percent}%`, backgroundColor: item.color }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const BoxIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m3 7 9-4 9 4-9 4-9-4Z" />
        <path d="m3 7 9 4 9-4" />
        <path d="M12 11v10" />
        <path d="m3 7v10l9 4 9-4V7" />
    </svg>
);

const CheckCircleIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22,4 12,14.01 9,11.01" />
    </svg>
);

const UserCheckIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <polyline points="16,11 18,13 22,9" />
    </svg>
);

const WrenchIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
);

const AlertTriangleIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" x2="12" y1="9" y2="13" />
        <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
);

const ClockIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12,6 12,12 16,14" />
    </svg>
);

const PlusIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <line x1="12" x2="12" y1="5" y2="19" />
        <line x1="5" x2="19" y1="12" y2="12" />
    </svg>
);

const ClipboardIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M9 5h6" />
        <path d="M8 3h8v4H8z" />
        <path d="M6 7h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
    </svg>
);

const LayersIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m12 3 9 4.5-9 4.5L3 7.5 12 3Z" />
        <path d="m3 12.5 9 4.5 9-4.5" />
        <path d="m3 17 9 4 9-4" />
    </svg>
);

export default function DashboardPage() {
    const { data, loading, refreshing, error, refetch } = useApi('/dashboard', {}, { ttl: 15000 });

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            void refetch();
        }, 15000);

        return () => window.clearInterval(intervalId);
    }, [refetch]);

    const stats = useMemo(
        () => [
            {
                label: 'Total Assets',
                value: data?.total_assets ?? 0,
                gradient: 'from-slate-900 to-slate-700',
                icon: BoxIcon,
            },
            {
                label: 'Available',
                value: data?.available ?? 0,
                gradient: 'from-emerald-500 to-emerald-400',
                icon: CheckCircleIcon,
            },
            {
                label: 'Assigned',
                value: data?.assigned ?? 0,
                gradient: 'from-amber-500 to-yellow-400',
                icon: UserCheckIcon,
            },
            {
                label: 'Maintenance',
                value: data?.maintenance ?? 0,
                gradient: 'from-rose-500 to-red-400',
                icon: WrenchIcon,
            },
            {
                label: 'Low Stock',
                value: data?.low_stock ?? 0,
                gradient: 'from-orange-500 to-orange-400',
                icon: AlertTriangleIcon,
            },
            {
                label: 'Overdue',
                value: data?.overdue ?? 0,
                gradient: 'from-red-600 to-red-500',
                icon: ClockIcon,
            },
        ],
        [data]
    );

    const quickActions = useMemo(
        () => [
            {
                to: '/inventory?create=1',
                title: 'Add New Asset',
                description: 'Register new inventory or stock item',
                icon: PlusIcon,
                variant: 'primary',
            },
            {
                to: '/assignments?create=1',
                title: 'Assign Asset',
                description: 'Assign quantity to a receiver',
                icon: ClipboardIcon,
                variant: 'success',
            },
            {
                to: '/inventory',
                title: 'Stock Operations',
                description: 'Manage stock in, out, and adjustments',
                icon: LayersIcon,
                variant: 'secondary',
            },
        ],
        []
    );

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <div className="w-10 h-10 mx-auto border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
                    <p className="mt-3 text-sm text-slate-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="space-y-4">
                <div className="px-4 py-3 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
                    Failed to load dashboard data: {error}
                </div>
                <button type="button" onClick={() => void refetch()} className="btn-primary">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <section className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(135deg,rgba(6,18,38,0.99)_0%,rgba(24,58,116,0.99)_48%,rgba(247,250,255,0.98)_48%,rgba(255,255,255,0.96)_100%)] px-6 py-7 shadow-[0_30px_80px_rgba(15,23,42,0.14)]">
                <div className="absolute inset-y-0 left-0 w-[56%] bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.18),transparent_36%),radial-gradient(circle_at_70%_70%,rgba(37,99,235,0.22),transparent_42%)]" />
                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 xl:max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium border rounded-full shadow-lg border-white/10 bg-white/10 text-blue-50 shadow-slate-950/10 backdrop-blur">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            System overview
                        </div>

                        <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">Admin Dashboard</h1>

                        <p className="max-w-2xl mt-3 text-sm leading-6 text-blue-50/95 sm:text-base">
                            Operational control center for assets, assignments, departments, notifications, and daily asset movement.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-5">
                            <button
                                type="button"
                                onClick={() => void refetch()}
                                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white transition border shadow-lg min-h-11 rounded-2xl border-white/15 bg-white/10 shadow-slate-950/10 backdrop-blur hover:bg-white/15"
                            >
                                {refreshing ? 'Refreshing...' : 'Refresh dashboard'}
                            </button>

                            <Link to="/items" className="text-sm font-semibold text-white transition hover:text-cyan-100">
                                View all assets
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 gap-3 mt-6 sm:grid-cols-3">
                            {quickActions.map((action) => (
                                <ActionCard key={action.to} {...action} />
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:w-[390px]">
                        <div className="metric-card border-slate-200/70">
                            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-400">Assets</p>
                            <p className="mt-3 text-3xl font-bold text-slate-950">{data?.total_assets ?? 0}</p>
                            <p className="mt-1 text-xs text-slate-500">Tracked inventory records</p>
                        </div>

                        <div className="metric-card border-slate-200/70">
                            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-400">Active</p>
                            <p className="mt-3 text-3xl font-bold text-slate-950">{data?.assigned ?? 0}</p>
                            <p className="mt-1 text-xs text-slate-500">Units in circulation</p>
                        </div>

                        <div className="metric-card border-slate-200/70">
                            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-400">Notifications</p>
                            <p className="mt-3 text-3xl font-bold text-slate-950">{data?.notifications_count ?? 0}</p>
                            <p className="mt-1 text-xs text-slate-500">Unread alerts</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {stats.map((stat) => (
                    <StatCard key={stat.label} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
                <div className="space-y-6 xl:col-span-3">
                    <div className="table-shell">
                        <div className="flex items-center justify-between gap-4 panel-header">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Recent Assignments</h2>
                                <p className="mt-1 text-sm text-slate-500">Latest asset movement across departments.</p>
                            </div>

                            <div className="hidden px-3 py-2 text-xs font-medium border rounded-2xl border-emerald-200 bg-emerald-50/80 text-emerald-700 md:block">
                                Live refresh every 15s
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="table-head">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-left">Asset</th>
                                        <th className="px-6 py-4 font-semibold text-left">Receiver</th>
                                        <th className="px-6 py-4 font-semibold text-left">Department</th>
                                        <th className="px-6 py-4 font-semibold text-left">Qty</th>
                                        <th className="px-6 py-4 font-semibold text-left">Date</th>
                                        <th className="px-6 py-4 font-semibold text-left">Status</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {data?.recent_assignments?.length ? (
                                        data.recent_assignments.map((assignment) => (
                                            <tr key={assignment.id} className="table-row">
                                                <td className="px-6 py-4 font-medium text-slate-900">{assignment.item?.name || '-'}</td>
                                                <td className="px-6 py-4 text-slate-700">
                                                    {assignment.receiver_name || assignment.user?.name || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-700">{assignment.assigned_department?.name || '-'}</td>
                                                <td className="px-6 py-4 text-slate-700">{assignment.quantity || 0} {assignment.item?.unit_of_measurement || 'unit'}</td>
                                                <td className="px-6 py-4 text-slate-700">{formatDate(assignment.assigned_at)}</td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                            assignment.returned_at
                                                                ? 'bg-slate-100 text-slate-700'
                                                                : 'bg-emerald-100 text-emerald-700'
                                                        }`}
                                                    >
                                                        {assignment.returned_at ? 'Returned' : 'Active'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                                                No recent assignments
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="overflow-hidden panel">
                        <div className="border-b border-slate-200/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,0.7))] px-6 py-5">
                            <h3 className="text-lg font-semibold text-slate-900">Asset Status</h3>
                            <p className="mt-1 text-sm text-slate-500">Current live inventory balance.</p>
                        </div>

                        <div className="panel-body">
                            <StatusChart data={data?.charts?.asset_status || []} />
                        </div>
                    </div>

                    <div className="overflow-hidden panel">
                        <div className="border-b border-slate-200/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,0.7))] px-6 py-5">
                            <h3 className="text-lg font-semibold text-slate-900">Assignment Trend</h3>
                            <p className="mt-1 text-sm text-slate-500">Units assigned over the last 7 days.</p>
                        </div>

                        <div className="panel-body">
                            <SimpleBarChart data={data?.charts?.assignment_trend || []} />
                        </div>
                    </div>

                    <div className="overflow-hidden panel">
                        <div className="border-b border-slate-200/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,0.7))] px-6 py-5">
                            <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
                            <p className="mt-1 text-sm text-slate-500">Common tasks and shortcuts.</p>
                        </div>

                        <div className="pt-4 panel-body">
                            <div className="space-y-2">
                                <Link to="/items" className="block px-4 py-3 text-sm font-medium transition border border-transparent rounded-2xl text-slate-700 hover:border-slate-200 hover:bg-slate-50">
                                    View All Assets
                                </Link>
                                <Link to="/users" className="block px-4 py-3 text-sm font-medium transition border border-transparent rounded-2xl text-slate-700 hover:border-slate-200 hover:bg-slate-50">
                                    Manage Users
                                </Link>
                                <Link to="/settings" className="block px-4 py-3 text-sm font-medium transition border border-transparent rounded-2xl text-slate-700 hover:border-slate-200 hover:bg-slate-50">
                                    System Settings
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
