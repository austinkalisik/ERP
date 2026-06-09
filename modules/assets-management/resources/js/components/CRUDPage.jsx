import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { invalidateApiCache, useApi } from '../hooks/useApi';
import apiClient from '../api/client';
import { downloadCsv } from '../utils/csv';
import { fetchFilteredExportRows } from '../utils/exportData';

function formatValue(value) {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    return String(value);
}

function getDefaultForm(fields) {
    const initialForm = {};

    fields.forEach((field) => {
        if (field.form === false) {
            return;
        }

        if (field.type === 'checkbox') {
            initialForm[field.name] = field.defaultValue ?? false;
            return;
        }

        initialForm[field.name] = field.defaultValue ?? '';
    });

    return initialForm;
}

export function CRUDPage({
    title,
    endpoint,
    fields,
    searchPlaceholder = 'Search...',
    createLabel = 'Add',
    csvConfig = null,
}) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(searchParams.get('create') === '1');
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [form, setForm] = useState(() => getDefaultForm(fields));
    const [meta, setMeta] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 10,
    });

    const searchInputFromUrl = searchParams.get('search') ?? '';
    const pageFromUrl = Number.parseInt(searchParams.get('page') ?? '1', 10);
    const [searchInput, setSearchInput] = useState(searchInputFromUrl);

    useEffect(() => {
        setForm(getDefaultForm(fields));
    }, [fields]);

    useEffect(() => {
        setSearchInput(searchInputFromUrl);
    }, [searchInputFromUrl]);

    useEffect(() => {
        if (searchParams.get('create') === '1' && !editingId) {
            setShowForm(true);
        }
    }, [searchParams, editingId]);

    const requestOptions = useMemo(
        () => ({
            params: {
                search: searchInputFromUrl || undefined,
                page: pageFromUrl > 0 ? pageFromUrl : 1,
                per_page: 10,
            },
        }),
        [searchInputFromUrl, pageFromUrl]
    );

    const {
        data: payload,
        loading,
        error: loadError,
        refetch,
    } = useApi(`/${endpoint}`, requestOptions, { ttl: 180000 });

    const items = payload?.data || payload || [];

    useEffect(() => {
        if (payload) {
            setMeta({
                current_page: payload.current_page || 1,
                last_page: payload.last_page || 1,
                total: payload.total || 0,
                per_page: payload.per_page || 10,
            });
        }
    }, [payload]);

    useEffect(() => {
        if (loadError) {
            setError(loadError);
        }
    }, [loadError]);

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
        setForm(getDefaultForm(fields));
        setEditingId(null);
        setShowForm(false);
        setSaving(false);
        setDeletingId(null);
        setError('');
    }

    function toggleForm() {
        setSuccess('');
        setError('');

        if (showForm) {
            resetForm();
            return;
        }

        setEditingId(null);
        setForm(getDefaultForm(fields));
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function normalizePayload(source) {
        const payload = {};

        fields.forEach((field) => {
            if (field.form === false) {
                return;
            }

            const rawValue = source[field.name];

            if (field.type === 'checkbox') {
                payload[field.name] = rawValue ? 1 : 0;
                return;
            }

            if (field.type === 'number') {
                payload[field.name] = rawValue === '' || rawValue === null ? null : Number(rawValue);
                return;
            }

            payload[field.name] = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
        });

        return payload;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const payloadToSend = normalizePayload(form);

            if (editingId) {
                await apiClient.put(`/${endpoint}/${editingId}`, payloadToSend);
                setSuccess(`${title.slice(0, -1)} updated successfully.`);
            } else {
                await apiClient.post(`/${endpoint}`, payloadToSend);
                setSuccess(`${title.slice(0, -1)} created successfully.`);
            }

            invalidateApiCache(`/${endpoint}`);
            resetForm();
            await refetch();
        } catch (err) {
            setError(err?.response?.data?.message || `Failed to save ${title.toLowerCase()}`);
        } finally {
            setSaving(false);
        }
    }

    function handleEdit(item) {
        const nextForm = getDefaultForm(fields);

        fields.forEach((field) => {
            nextForm[field.name] = item[field.name] ?? nextForm[field.name];
        });

        setForm(nextForm);
        setEditingId(item.id);
        setShowForm(true);
        setSuccess('');
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function handleDelete(id) {
        if (!window.confirm(`Are you sure you want to delete this ${title.slice(0, -1).toLowerCase()}?`)) {
            return;
        }

        try {
            setDeletingId(id);
            setError('');
            setSuccess('');

            await apiClient.delete(`/${endpoint}/${id}`);
            setSuccess(`${title.slice(0, -1)} deleted successfully.`);
            invalidateApiCache(`/${endpoint}`);
            await refetch();
        } catch (err) {
            setError(err?.response?.data?.message || `Failed to delete ${title.toLowerCase()}`);
        } finally {
            setDeletingId(null);
        }
    }

    async function handleExportCsv() {
        if (!csvConfig) {
            return;
        }

        try {
            setExporting(true);
            setError('');

            const exportRows = await fetchFilteredExportRows(`/${endpoint}`, requestOptions.params);

            downloadCsv(
                csvConfig.filename,
                exportRows.map((item) => csvConfig.mapRow(item))
            );
        } catch (err) {
            setError(err?.response?.data?.message || `Failed to export ${title.toLowerCase()}.`);
        } finally {
            setExporting(false);
        }
    }

    if (loading && !payload) {
        return <div className="text-slate-500">Loading {title.toLowerCase()}...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
                    <p className="mt-1 text-sm text-slate-500">Manage {title.toLowerCase()} records for the system.</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder={searchPlaceholder}
                            className="input-shell w-72"
                        />
                        <button type="submit" className="btn-secondary">
                            Find
                        </button>
                    </form>

                    <button type="button" onClick={toggleForm} className="btn-primary">
                        {showForm ? 'Cancel' : createLabel}
                    </button>

                    {csvConfig ? (
                        <button type="button" onClick={handleExportCsv} disabled={exporting} className="btn-secondary disabled:opacity-60">
                            {exporting ? 'Exporting...' : 'Export CSV'}
                        </button>
                    ) : null}
                </div>
            </div>

            {success ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                </div>
            ) : null}

            {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            ) : null}

            {showForm ? (
                <div className="panel">
                    <div className="panel-body">
                        <h2 className="mb-4 text-lg font-semibold">
                            {editingId ? `Edit ${title.slice(0, -1)}` : createLabel}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {fields.filter((field) => field.form !== false).map((field) => {
                                    const isFullWidth = field.fullWidth === true;
                                    const value = form[field.name] ?? '';

                                    return (
                                        <div key={field.name} className={isFullWidth ? 'md:col-span-2' : ''}>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                                {field.label}
                                            </label>

                                            {field.type === 'textarea' ? (
                                                <textarea
                                                    rows={field.rows || 3}
                                                    value={value}
                                                    onChange={(event) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            [field.name]: event.target.value,
                                                        }))
                                                    }
                                                    className="input-shell w-full"
                                                    required={field.required}
                                                />
                                            ) : field.type === 'checkbox' ? (
                                                <label className="inline-flex cursor-pointer items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(value)}
                                                        onChange={(event) =>
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                [field.name]: event.target.checked,
                                                            }))
                                                        }
                                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-slate-600">
                                                        {Boolean(value) ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                </label>
                                            ) : field.type === 'select' ? (
                                                <select
                                                    value={value}
                                                    onChange={(event) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            [field.name]: event.target.value,
                                                        }))
                                                    }
                                                    className="input-shell w-full"
                                                    required={field.required}
                                                >
                                                    <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
                                                    {(field.options || []).map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type={field.type || 'text'}
                                                    value={value}
                                                    onChange={(event) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            [field.name]: event.target.value,
                                                        }))
                                                    }
                                                    className="input-shell w-full"
                                                    required={field.required}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3">
                                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                                    {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                                </button>

                                <button type="button" onClick={resetForm} className="btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            <div className="table-shell">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="table-head">
                            <tr>
                                {fields.map((field) => (
                                    <th key={field.name} className="px-6 py-4 text-left font-semibold">
                                        {field.label}
                                    </th>
                                ))}
                                <th className="px-6 py-4 text-left font-semibold">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {items.length > 0 ? (
                                items.map((item) => (
                                    <tr key={item.id} className="table-row">
                                        {fields.map((field) => (
                                            <td key={field.name} className="px-6 py-4 text-slate-700">
                                                {field.render ? field.render(item[field.name], item) : formatValue(item[field.name])}
                                            </td>
                                        ))}
                                        <td className="space-x-3 px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(item)}
                                                className="text-blue-600 hover:underline"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(item.id)}
                                                disabled={deletingId === item.id}
                                                className="text-red-600 hover:underline disabled:opacity-50"
                                            >
                                                {deletingId === item.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={fields.length + 1} className="px-6 py-10 text-center text-slate-500">
                                        No items found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        Showing page {meta.current_page} of {meta.last_page} · {meta.total} total
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

export default CRUDPage;
