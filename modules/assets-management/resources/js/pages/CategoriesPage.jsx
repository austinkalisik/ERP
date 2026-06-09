import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { downloadCsv } from '../utils/csv';
import { fetchFilteredExportRows } from '../utils/exportData';
import { invalidateApiCache, useApi } from '../hooks/useApi';

function defaultForm() {
    return {
        name: '',
        description: '',
        default_useful_life_years: '',
    };
}

function initials(name) {
    return (name || 'Category')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function extractError(error) {
    const response = error?.response?.data;

    if (response?.errors && typeof response.errors === 'object') {
        const firstKey = Object.keys(response.errors)[0];
        const firstError = firstKey ? response.errors[firstKey]?.[0] : null;

        if (firstError) {
            return firstError;
        }
    }

    return response?.message || error?.message || 'Unable to save category.';
}

function CategoryActions({ category, onEdit, onDelete, deletingId }) {
    const hasItems = Number(category.items_count || 0) > 0;

    return (
        <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onEdit(category)} className="btn-secondary !px-3 !py-2">
                Edit
            </button>
            <button
                type="button"
                onClick={() => onDelete(category)}
                disabled={deletingId === category.id || hasItems}
                title={hasItems ? 'Move or remove linked items before deleting this category.' : 'Delete category'}
                className="btn-danger !px-3 !py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {deletingId === category.id ? 'Deleting...' : 'Delete'}
            </button>
        </div>
    );
}

export default function CategoriesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
    const [showForm, setShowForm] = useState(searchParams.get('create') === '1');
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(defaultForm());
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [exporting, setExporting] = useState(false);

    const requestOptions = useMemo(
        () => ({
            params: {
                search: searchParams.get('search') || undefined,
                page: Number.parseInt(searchParams.get('page') ?? '1', 10),
                per_page: 12,
            },
        }),
        [searchParams]
    );

    const { data, loading, error: loadError, refetch } = useApi('/categories', requestOptions, { ttl: 120000 });
    const categories = data?.data || [];
    const meta = {
        current_page: data?.current_page || 1,
        last_page: data?.last_page || 1,
        total: data?.total || 0,
    };

    const totalLinkedItems = useMemo(
        () => categories.reduce((sum, category) => sum + Number(category.items_count || 0), 0),
        [categories]
    );

    useEffect(() => {
        setSearchInput(searchParams.get('search') ?? '');
    }, [searchParams]);

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

    function resetForm() {
        setForm(defaultForm());
        setEditingId(null);
        setShowForm(false);
        setSaving(false);
        setError('');
    }

    function openCreateForm() {
        setSuccess('');
        setError('');
        setForm(defaultForm());
        setEditingId(null);
        setShowForm(true);
        updateQuery({ create: 1 });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleEdit(category) {
        setSuccess('');
        setError('');
        setForm({
            name: category.name || '',
            description: category.description || '',
            default_useful_life_years: category.default_useful_life_years ?? '',
        });
        setEditingId(category.id);
        setShowForm(true);
        updateQuery({ create: 1 });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSaving(true);
            setSuccess('');
            setError('');

            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
                default_useful_life_years:
                    form.default_useful_life_years === ''
                        ? ''
                        : Number.parseInt(String(form.default_useful_life_years), 10),
            };

            if (editingId) {
                await apiClient.put(`/categories/${editingId}`, payload);
                setSuccess('Category updated successfully.');
            } else {
                await apiClient.post('/categories', payload);
                setSuccess('Category created successfully.');
            }

            invalidateApiCache('/categories');
            resetForm();
            updateQuery({ create: '', page: 1 });
            await refetch();
        } catch (err) {
            setError(extractError(err));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(category) {
        if (Number(category.items_count || 0) > 0) {
            setError('This category has linked inventory items. Move those items before deleting it.');
            return;
        }

        if (!window.confirm(`Delete category "${category.name}"?`)) {
            return;
        }

        try {
            setDeletingId(category.id);
            setSuccess('');
            setError('');
            await apiClient.delete(`/categories/${category.id}`);
            setSuccess('Category deleted successfully.');
            invalidateApiCache('/categories');
            await refetch();
        } catch (err) {
            setError(extractError(err));
        } finally {
            setDeletingId(null);
        }
    }

    async function handleExportCsv() {
        try {
            setExporting(true);
            setError('');

            const exportRows = await fetchFilteredExportRows('/categories', requestOptions.params);

            downloadCsv(
                'categories.csv',
                exportRows.map((category) => ({
                    'Category Name': category.name || '',
                    Description: category.description || '',
                    'Default Useful Life (Years)': category.default_useful_life_years ?? '',
                    'Linked Items': category.items_count ?? 0,
                }))
            );
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to export categories.');
        } finally {
            setExporting(false);
        }
    }

    if (loading && !data) {
        return <div className="text-slate-500">Loading categories...</div>;
    }

    return (
        <div className="space-y-5">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Categories</h1>
                    <p className="page-subtitle">Organize inventory into simple groups officers can recognize when adding or finding assets.</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <button type="button" onClick={handleExportCsv} disabled={exporting} className="btn-secondary disabled:opacity-60">
                        {exporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                    <button type="button" onClick={openCreateForm} className="btn-primary">
                        Add Category
                    </button>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="metric-card">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Categories</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">{meta.total}</p>
                </div>
                <div className="metric-card">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Linked Items</p>
                    <p className="mt-2 text-2xl font-bold text-blue-700">{totalLinkedItems}</p>
                </div>
                <div className="metric-card">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Page</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">{meta.current_page} / {meta.last_page}</p>
                </div>
            </div>

            <div className="panel">
                <div className="panel-body">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                                type="search"
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Search categories or descriptions"
                                className="input-shell w-full sm:w-96"
                            />
                            <button type="submit" className="btn-secondary">
                                Find
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchInput('');
                                    updateQuery({ search: '', page: 1 });
                                }}
                                className="btn-secondary"
                            >
                                Clear
                            </button>
                        </div>
                        <p className="text-sm text-slate-500">{meta.total} record(s)</p>
                    </form>
                </div>
            </div>

            {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
            {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

            {showForm ? (
                <div className="panel">
                    <div className="panel-body">
                        <div className="mb-5">
                            <h2 className="section-title">{editingId ? 'Edit Category' : 'Create Category'}</h2>
                            <p className="section-subtitle">Use short category names that officers will understand during asset entry.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[280px_220px_1fr]">
                            <div>
                                <label className="field-label">Category Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                    className="input-shell w-full"
                                    placeholder="Example: Laptops"
                                    required
                                />
                            </div>
                            <div>
                                <label className="field-label">Default Useful Life</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={form.default_useful_life_years}
                                    onChange={(event) => setForm((prev) => ({ ...prev, default_useful_life_years: event.target.value }))}
                                    className="input-shell w-full"
                                    placeholder="Years"
                                />
                            </div>
                            <div>
                                <label className="field-label">Description</label>
                                <textarea
                                    rows={3}
                                    value={form.description}
                                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                                    className="input-shell w-full"
                                    placeholder="Explain what belongs in this category"
                                />
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row lg:col-span-3">
                                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                                    {saving ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
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
                {categories.length > 0 ? (
                    categories.map((category) => (
                        <div key={category.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                                    {initials(category.name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="font-semibold text-slate-950">{category.name}</h2>
                                    <p className="mt-1 text-sm leading-6 text-slate-500">{category.description || 'No description provided.'}</p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                            {category.items_count ?? 0} linked item(s)
                                        </span>
                                        {category.default_useful_life_years ? (
                                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                {category.default_useful_life_years} year useful life
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="mt-4">
                                        <CategoryActions category={category} onEdit={handleEdit} onDelete={handleDelete} deletingId={deletingId} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-500 shadow-sm">
                        No categories found.
                    </div>
                )}
            </div>

            <div className="desktop-table table-shell">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="table-head">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold">Category</th>
                                <th className="px-6 py-4 text-left font-semibold">Description</th>
                                <th className="px-6 py-4 text-left font-semibold">Useful Life</th>
                                <th className="px-6 py-4 text-left font-semibold">Linked Items</th>
                                <th className="px-6 py-4 text-left font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {categories.length > 0 ? (
                                categories.map((category) => (
                                    <tr key={category.id} className="table-row">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                                                    {initials(category.name)}
                                                </div>
                                                <p className="font-semibold text-slate-950">{category.name}</p>
                                            </div>
                                        </td>
                                        <td className="max-w-xl px-6 py-4 text-slate-700">{category.description || '-'}</td>
                                        <td className="px-6 py-4 text-slate-700">
                                            {category.default_useful_life_years ? `${category.default_useful_life_years} years` : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                {category.items_count ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <CategoryActions category={category} onEdit={handleEdit} onDelete={handleDelete} deletingId={deletingId} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                                        No categories found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        Page {meta.current_page} of {meta.last_page} | {meta.total} total
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={meta.current_page <= 1}
                            onClick={() => updateQuery({ page: meta.current_page - 1 })}
                            className="btn-secondary !px-3 !py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            disabled={meta.current_page >= meta.last_page}
                            onClick={() => updateQuery({ page: meta.current_page + 1 })}
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
