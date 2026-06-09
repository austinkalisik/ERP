import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { invalidateApiCache, useApi } from '../hooks/useApi';

const ROLE_OPTIONS = [
    { value: 'admin', label: 'Admin', note: 'Full system access', className: 'bg-red-50 text-red-700 border-red-200' },
    { value: 'manager', label: 'Manager', note: 'Approves and oversees operations', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { value: 'asset_officer', label: 'Asset Officer', note: 'Manages inventory and assignments', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'procurement_officer', label: 'Procurement Officer', note: 'Manages supplier and stock intake work', className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    { value: 'auditor', label: 'Auditor', note: 'Read-only audit and report access', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'staff', label: 'Staff', note: 'Read-only standard user access', className: 'bg-slate-50 text-slate-700 border-slate-200' },
];

function defaultForm() {
    return {
        name: '',
        email: '',
        role: 'staff',
        password: '',
        password_confirmation: '',
    };
}

function roleMeta(role) {
    return ROLE_OPTIONS.find((option) => option.value === role) || ROLE_OPTIONS[ROLE_OPTIONS.length - 1];
}

function initials(name) {
    return (name || 'User')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function RoleBadge({ role }) {
    const meta = roleMeta(role);

    return (
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
            {meta.label}
        </span>
    );
}

function UserActions({ user, currentUser, canSwitchUser, busyId, onEdit, onDelete, onImpersonate }) {
    const isCurrentUser = Number(currentUser?.id) === Number(user.id);
    const canManageUsers = currentUser?.role === 'admin' && !currentUser?.is_impersonating;
    const canImpersonate = canSwitchUser && canManageUsers && !isCurrentUser;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {canManageUsers ? (
                <button type="button" onClick={() => onEdit(user)} className="btn-secondary !px-3 !py-2">
                    Edit
                </button>
            ) : null}

            {canImpersonate ? (
                <button
                    type="button"
                    onClick={() => onImpersonate(user.id)}
                    disabled={busyId === user.id}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                >
                    Switch
                </button>
            ) : null}

            {canManageUsers ? (
                <button
                    type="button"
                    onClick={() => onDelete(user.id)}
                    disabled={busyId === user.id || isCurrentUser}
                    className="btn-danger !px-3 !py-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Delete
                </button>
            ) : null}
        </div>
    );
}

export default function UsersPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user: currentUser, impersonate, stopImpersonation, refreshUser } = useAuth();
    const { settings } = useSettings();
    const canSwitchUser = String(settings.allow_user_impersonation ?? '1') === '1';
    const canManageUsers = currentUser?.role === 'admin' && !currentUser?.is_impersonating;

    const filters = useMemo(
        () => ({
            search: searchParams.get('search') ?? '',
            page: Number.parseInt(searchParams.get('page') ?? '1', 10),
            per_page: 10,
        }),
        [searchParams]
    );

    const { data, loading, error, refetch } = useApi('/users', { params: filters }, { ttl: 180000, enabled: canManageUsers });
    const users = data?.data || [];
    const meta = {
        current_page: data?.current_page || 1,
        last_page: data?.last_page || 1,
        total: data?.total || 0,
    };

    const roleCounts = useMemo(
        () => data?.role_counts || {},
        [data?.role_counts]
    );

    const [success, setSuccess] = useState('');
    const [actionError, setActionError] = useState('');
    const [showForm, setShowForm] = useState(searchParams.get('create') === '1');
    const [editingId, setEditingId] = useState(null);
    const [searchInput, setSearchInput] = useState(filters.search);
    const [form, setForm] = useState(defaultForm());
    const [formErrors, setFormErrors] = useState({});
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        setSearchInput(filters.search);
    }, [filters.search]);

    useEffect(() => {
        if (searchParams.get('create') === '1' && !editingId) {
            setShowForm(true);
        }
    }, [searchParams, editingId]);

    function updateQuery(nextValues) {
        const next = new URLSearchParams(searchParams);

        Object.entries(nextValues).forEach(([key, value]) => {
            if (value === '' || value === null || value === undefined) {
                next.delete(key);
            } else {
                next.set(key, String(value));
            }
        });

        if (!next.get('page')) {
            next.set('page', '1');
        }

        setSearchParams(next);
    }

    function handleSearchSubmit(event) {
        event.preventDefault();
        updateQuery({ search: searchInput.trim(), page: 1 });
    }

    function goToPage(page) {
        updateQuery({ page });
    }

    function resetForm() {
        setForm(defaultForm());
        setFormErrors({});
        setEditingId(null);
        setShowForm(false);
    }

    function handleEdit(user) {
        setForm({
            name: user.name || '',
            email: user.email || '',
            role: user.role || 'staff',
            password: '',
            password_confirmation: '',
        });

        setEditingId(user.id);
        setShowForm(true);
        setSuccess('');
        setActionError('');
        setFormErrors({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function toggleForm() {
        setSuccess('');
        setActionError('');

        if (showForm) {
            resetForm();
            return;
        }

        setForm(defaultForm());
        setFormErrors({});
        setEditingId(null);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function refreshUsers() {
        invalidateApiCache('/users');
        await refetch();
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSuccess('');
            setActionError('');
            setFormErrors({});

            if (!editingId && form.password.length < 8) {
                setFormErrors({ password: ['Password must be at least 8 characters.'] });
                setActionError('Password must be at least 8 characters.');
                return;
            }

            if (form.password && form.password !== form.password_confirmation) {
                setFormErrors({ password_confirmation: ['Password confirmation does not match.'] });
                setActionError('Password confirmation does not match.');
                return;
            }

            const payload = {
                name: form.name.trim(),
                email: form.email.trim(),
                role: form.role,
            };

            if (form.password) {
                payload.password = form.password;
                payload.password_confirmation = form.password_confirmation;
            }

            if (editingId) {
                await apiClient.put(`/users/${editingId}`, payload);
                setSuccess('User updated successfully.');
            } else {
                payload.password = form.password;
                payload.password_confirmation = form.password_confirmation;
                await apiClient.post('/users', payload);
                setSuccess('User created successfully.');
            }

            resetForm();
            await refreshUsers();
            await refreshUser();
        } catch (err) {
            setFormErrors(err?.response?.data?.errors || {});
            setActionError(err?.response?.data?.message || 'Unable to save user. Check the form and try again.');
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Delete this user? Users with assignment history cannot be removed.')) {
            return;
        }

        try {
            setBusyId(id);
            setSuccess('');
            setActionError('');
            await apiClient.delete(`/users/${id}`);
            setSuccess('User deleted successfully.');
            await refreshUsers();
        } catch (err) {
            setActionError(err?.response?.data?.message || 'Unable to delete user.');
        } finally {
            setBusyId(null);
        }
    }

    async function handleImpersonate(userId) {
        try {
            setBusyId(userId);
            setSuccess('');
            setActionError('');
            await impersonate(userId);
            setSuccess('User switched successfully.');
        } catch (err) {
            setActionError(err?.response?.data?.message || 'Unable to switch user.');
        } finally {
            setBusyId(null);
        }
    }

    async function handleStopImpersonation() {
        try {
            setSuccess('');
            setActionError('');
            await stopImpersonation();
            setSuccess('Returned to admin successfully.');
            await refreshUsers();
            await refreshUser();
        } catch (err) {
            setActionError(err?.response?.data?.message || 'Unable to return to admin.');
        }
    }

    if (loading && !data) {
        return <div className="text-slate-500">Loading users...</div>;
    }

    if (!canManageUsers) {
        return (
            <div className="space-y-5">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Users</h1>
                        <p className="page-subtitle">Only administrator accounts can manage staff accounts and switch-user access.</p>
                    </div>

                    {currentUser?.is_impersonating ? (
                        <button type="button" onClick={handleStopImpersonation} className="btn-secondary">
                            Return to Admin
                        </button>
                    ) : null}
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    You are signed in as {currentUser?.name || currentUser?.email || 'this user'}. User management is hidden until you return to an administrator account.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Users</h1>
                    <p className="page-subtitle">Manage staff accounts, roles, assignment ownership, and safe switch-user access.</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    {currentUser?.is_impersonating ? (
                        <button type="button" onClick={handleStopImpersonation} className="btn-secondary">
                            Return to Admin
                        </button>
                    ) : null}
                    <button type="button" onClick={toggleForm} className="btn-primary">
                        {showForm ? 'Close Form' : 'Add User'}
                    </button>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="metric-card">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Users</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">{meta.total}</p>
                </div>
                {ROLE_OPTIONS.map((role) => (
                    <div key={role.value} className="metric-card">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{role.label}</p>
                        <p className="mt-2 text-2xl font-bold text-slate-950">{roleCounts[role.value] || 0}</p>
                    </div>
                ))}
            </div>

            <div className="panel">
                <div className="panel-body">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                                type="search"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search name, email, or role"
                                className="input-shell w-full sm:w-80"
                            />
                            <button type="submit" className="btn-secondary">
                                Find
                            </button>
                        </form>

                        <p className="text-sm text-slate-500">
                            Page {meta.current_page} of {meta.last_page}, {meta.total} total
                        </p>
                    </div>
                </div>
            </div>

            {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
            {actionError || error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {actionError || error}
                </div>
            ) : null}

            {showForm ? (
                <div className="panel">
                    <div className="panel-body">
                        <div className="mb-5 flex flex-col gap-1">
                            <h2 className="section-title">{editingId ? 'Edit User' : 'Create User'}</h2>
                            <p className="section-subtitle">
                                Choose the role that matches the officer's responsibilities. Passwords must be confirmed before saving.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div>
                                <label className="field-label">Full Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="input-shell w-full"
                                    required
                                />
                                {formErrors.name ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.name[0]}</p> : null}
                            </div>

                            <div>
                                <label className="field-label">Email Address</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="input-shell w-full"
                                    required
                                />
                                {formErrors.email ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.email[0]}</p> : null}
                            </div>

                            <div>
                                <label className="field-label">Role</label>
                                <select
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    className="input-shell w-full"
                                >
                                    {ROLE_OPTIONS.map((role) => (
                                        <option key={role.value} value={role.value}>
                                            {role.label} - {role.note}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.role ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.role[0]}</p> : null}
                            </div>

                            <div>
                                <label className="field-label">Password {editingId ? '(optional)' : ''}</label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="input-shell w-full"
                                    minLength={8}
                                    required={!editingId}
                                />
                                {formErrors.password ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.password[0]}</p> : null}
                            </div>

                            <div>
                                <label className="field-label">Confirm Password</label>
                                <input
                                    type="password"
                                    value={form.password_confirmation}
                                    onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                                    className="input-shell w-full"
                                    minLength={form.password ? 8 : undefined}
                                    required={!editingId || Boolean(form.password)}
                                />
                                {formErrors.password_confirmation ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.password_confirmation[0]}</p> : null}
                            </div>

                            <div className="flex flex-col gap-2 pt-1 sm:flex-row lg:col-span-2">
                                <button type="submit" className="btn-primary">
                                    {editingId ? 'Update User' : 'Create User'}
                                </button>
                                <button type="button" onClick={resetForm} className="btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            <div className="mobile-card-list">
                {users.length > 0 ? (
                    users.map((user) => (
                        <div key={user.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                                    {initials(user.name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="font-semibold text-slate-950">{user.name}</h2>
                                        <RoleBadge role={user.role} />
                                    </div>
                                    <p className="mt-1 break-all text-sm text-slate-500">{user.email}</p>
                                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="rounded-lg bg-slate-50 px-2 py-2">
                                            <p className="font-bold text-slate-950">{user.active_assignments_count ?? 0}</p>
                                            <p className="text-slate-500">Active</p>
                                        </div>
                                        <div className="rounded-lg bg-slate-50 px-2 py-2">
                                            <p className="font-bold text-slate-950">{user.assignments_count ?? 0}</p>
                                            <p className="text-slate-500">History</p>
                                        </div>
                                        <div className="rounded-lg bg-slate-50 px-2 py-2">
                                            <p className="font-bold text-slate-950">{user.asset_logs_count ?? 0}</p>
                                            <p className="text-slate-500">Logs</p>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <UserActions
                                            user={user}
                                            currentUser={currentUser}
                                            canSwitchUser={canSwitchUser}
                                            busyId={busyId}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onImpersonate={handleImpersonate}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-500 shadow-sm">
                        No users found.
                    </div>
                )}
            </div>

            <div className="desktop-table table-shell">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="table-head">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold">User</th>
                                <th className="px-6 py-4 text-left font-semibold">Role</th>
                                <th className="px-6 py-4 text-left font-semibold">Assignments</th>
                                <th className="px-6 py-4 text-left font-semibold">Activity Logs</th>
                                <th className="px-6 py-4 text-left font-semibold">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user.id} className="table-row">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                                                    {initials(user.name)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-950">{user.name}</p>
                                                    <p className="text-sm text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <RoleBadge role={user.role} />
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">
                                            <span className="font-semibold text-slate-950">{user.active_assignments_count ?? 0}</span> active
                                            <span className="mx-2 text-slate-300">|</span>
                                            {user.assignments_count ?? 0} total
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">{user.asset_logs_count ?? 0}</td>
                                        <td className="px-6 py-4">
                                            <UserActions
                                                user={user}
                                                currentUser={currentUser}
                                                canSwitchUser={canSwitchUser}
                                                busyId={busyId}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                onImpersonate={handleImpersonate}
                                            />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        Showing page {meta.current_page} of {meta.last_page} | {meta.total} total
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={meta.current_page <= 1}
                            onClick={() => goToPage(meta.current_page - 1)}
                            className="btn-secondary !px-3 !py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            disabled={meta.current_page >= meta.last_page}
                            onClick={() => goToPage(meta.current_page + 1)}
                            className="btn-secondary !px-3 !py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
