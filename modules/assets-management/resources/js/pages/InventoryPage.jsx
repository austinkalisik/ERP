import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import StockOperationModal from '../components/StockOperationModal';

function StatCard({ label, value, helper }) {
    return (
        <div className="panel">
            <div className="panel-body">
                <h3 className="text-sm font-medium text-slate-600">{label}</h3>
                <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{helper}</p>
            </div>
        </div>
    );
}

export default function InventoryPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    const filters = useMemo(
        () => ({
            search: searchParams.get('search') ?? '',
            stock: searchParams.get('stock') ?? '',
            page: Number.parseInt(searchParams.get('page') ?? '1', 10),
        }),
        [searchParams]
    );

    const [searchInput, setSearchInput] = useState(filters.search);
    const [inventory, setInventory] = useState([]);
    const [summary, setSummary] = useState({
        totalItems: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
    });
    const [meta, setMeta] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showStockModal, setShowStockModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        setSearchInput(filters.search);
    }, [filters.search]);

    useEffect(() => {
        void fetchInventory();
    }, [filters]);

    async function fetchInventory() {
        try {
            setLoading(true);

            const response = await apiClient.get('/inventory', {
                params: {
                    search: filters.search || undefined,
                    stock: filters.stock || undefined,
                    page: filters.page > 0 ? filters.page : 1,
                    per_page: 10,
                },
            });

            const payload = response.data;
            const rows = payload.data || [];
            const stats = payload.summary || {};

            setInventory(rows);
            setSummary({
                totalItems: stats.totalItems || 0,
                lowStockCount: stats.lowStockCount || 0,
                outOfStockCount: stats.outOfStockCount || 0,
            });
            setMeta({
                current_page: payload.current_page || 1,
                last_page: payload.last_page || 1,
                total: payload.total || 0,
            });
            setError('');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load inventory');
        } finally {
            setLoading(false);
        }
    }

    function openStockModal(item) {
        setSelectedItem(item);
        setShowStockModal(true);
    }

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

    if (loading) {
        return <div className="text-slate-500">Loading inventory...</div>;
    }

    if (error) {
        return (
            <div className="px-4 py-3 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Inventory</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage stock levels only. Asset record creation stays in Assets.
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search inventory..."
                            className="input-shell w-72"
                        />
                        <button type="submit" className="btn-secondary">
                            Find
                        </button>
                    </form>

                    <button type="button" onClick={() => void fetchInventory()} className="btn-secondary">
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <StatCard label="Low Stock Items" value={summary.lowStockCount} helper="Items at or below reorder level" />
                <StatCard label="Out of Stock" value={summary.outOfStockCount} helper="No inventory available" />
                <StatCard label="Total Items" value={summary.totalItems} helper="Across all categories" />
            </div>

            <div className="panel">
                <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
                    <select
                        value={filters.stock}
                        onChange={(e) => updateQuery({ stock: e.target.value, page: 1 })}
                        className="input-shell"
                    >
                        <option value="">All stock levels</option>
                        <option value="low">Low stock</option>
                        <option value="out">Out of stock</option>
                        <option value="available">Healthy stock</option>
                    </select>

                    <button type="button" onClick={() => setSearchParams({})} className="btn-secondary">
                        Clear Filters
                    </button>
                </div>
            </div>

            <div className="table-shell">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="table-head">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-left">Item</th>
                                <th className="px-6 py-4 font-semibold text-left">SKU</th>
                                <th className="px-6 py-4 font-semibold text-left">Category</th>
                                <th className="px-6 py-4 font-semibold text-left">Supplier</th>
                                <th className="px-6 py-4 font-semibold text-left">Quantity</th>
                                <th className="px-6 py-4 font-semibold text-left">Unit</th>
                                <th className="px-6 py-4 font-semibold text-left">Stock Status</th>
                                <th className="px-6 py-4 font-semibold text-left">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {inventory.length ? (
                                inventory.map((item) => {
                                    const reorderLevel = Number(item.reorder_level || 5);
                                    const quantity = Number(item.quantity || 0);

                                    const badgeClass =
                                        quantity === 0
                                            ? 'bg-red-100 text-red-700'
                                            : quantity <= reorderLevel
                                              ? 'bg-amber-100 text-amber-700'
                                              : 'bg-emerald-100 text-emerald-700';

                                    const badgeText =
                                        quantity === 0
                                            ? 'Out of Stock'
                                            : quantity <= reorderLevel
                                              ? 'Low Stock'
                                              : 'Healthy';

                                    return (
                                        <tr key={item.id} className="table-row">
                                            <td className="px-6 py-4 font-medium text-slate-900">{item.name || '-'}</td>
                                            <td className="px-6 py-4 text-slate-700">{item.sku || item.asset_tag || '-'}</td>
                                            <td className="px-6 py-4 text-slate-700">{item.category?.name || '-'}</td>
                                            <td className="px-6 py-4 text-slate-700">{item.supplier?.name || '-'}</td>
                                            <td className="px-6 py-4 text-slate-700">{quantity} {item.unit_of_measurement || 'unit'}</td>
                                            <td className="px-6 py-4 text-slate-700">{item.unit_of_measurement || 'unit'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                                                    {badgeText}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button type="button" onClick={() => openStockModal(item)} className="text-green-600 hover:underline">
                                                    Stock In / Out
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-10 text-center text-slate-500">
                                        No inventory items found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 px-6 py-4 text-sm border-t border-slate-200 text-slate-600 sm:flex-row sm:items-center sm:justify-between">
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

            <StockOperationModal
                isOpen={showStockModal}
                onClose={() => setShowStockModal(false)}
                item={selectedItem}
                onSuccess={fetchInventory}
            />
        </div>
    );
}
