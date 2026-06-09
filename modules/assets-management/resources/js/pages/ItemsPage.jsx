import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { downloadCsv } from '../utils/csv';
import { fetchFilteredExportRows } from '../utils/exportData';
import { invalidateApiCache, useApi } from '../hooks/useApi';

const PNG_TIME_ZONE = 'Pacific/Port_Moresby';
const MIN_DATE_INPUT = '1900-01-01';
const MAX_DATE_INPUT = '9999-12-31';
const DATE_PLACEHOLDER = 'Select date';
const STOCK_EXPORT_OPTIONS = {
    current: { label: 'Current Filters CSV', stock: null, filename: 'inventory.csv' },
    all: { label: 'All stock states CSV', stock: '', filename: 'inventory-all-stock-states.csv' },
    available: { label: 'Available CSV', stock: 'available', filename: 'inventory-available.csv' },
    low: { label: 'Low Stock CSV', stock: 'low', filename: 'inventory-low-stock.csv' },
    out: { label: 'Out of Stock CSV', stock: 'out', filename: 'inventory-out-of-stock.csv' },
    depreciation: { label: 'Depreciation Report CSV', stock: null, filename: 'inventory-depreciation-report.csv', depreciation: true },
};

function getStockStateBadge(item) {
    if (item?.status === 'retired') {
        return { label: 'Retired', className: 'bg-slate-200 text-slate-700' };
    }

    if (item?.status === 'maintenance') {
        return { label: 'Maintenance', className: 'bg-blue-100 text-blue-700' };
    }

    if (item?.status === 'lost') {
        return { label: 'Lost', className: 'bg-red-100 text-red-700' };
    }

    const quantity = Number(item?.quantity || 0);
    const reorderLevel = Number(item?.reorder_level ?? 5);

    if (quantity === 0) {
        return { label: 'Out of Stock', className: 'bg-rose-100 text-rose-700' };
    }

    if (quantity <= reorderLevel) {
        return { label: 'Low Stock', className: 'bg-amber-100 text-amber-700' };
    }

    return { label: 'Available', className: 'bg-emerald-100 text-emerald-700' };
}

function defaultForm() {
    return {
        tracking_mode: 'bulk',
        name: '',
        brand: '',
        sku: '',
        description: '',
        category_id: '',
        supplier_id: '',
        status: 'available',
        quantity: 1,
        unit_of_measurement: 'unit',
        reorder_level: 5,
        unit_cost: '',
        is_depreciable: false,
        depreciation_method: 'straight_line',
        useful_life_years: '',
        salvage_value: '',
        depreciation_start_date: '',
        asset_tag: '',
        serial_number: '',
        location: '',
        purchase_date: '',
    };
}

function extractErrorMessage(error) {
    const response = error?.response?.data;

    if (response?.errors && typeof response.errors === 'object') {
        const firstKey = Object.keys(response.errors)[0];

        if (firstKey && Array.isArray(response.errors[firstKey]) && response.errors[firstKey][0]) {
            return response.errors[firstKey][0];
        }
    }

    return response?.message || error?.message || 'Failed to save inventory item.';
}

function formatDate(value) {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleDateString('en-PG', {
        timeZone: PNG_TIME_ZONE,
    });
}

function formatDateTime(value) {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString('en-PG', {
        timeZone: PNG_TIME_ZONE,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function isValidDateTextInput(value) {
    if (!value) {
        return true;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split('-').map(Number);

    if (year < 1900 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) {
        return false;
    }

    const parsed = new Date(`${value}T00:00:00`);

    return (
        parsed.getFullYear() === year &&
        parsed.getMonth() + 1 === month &&
        parsed.getDate() === day
    );
}

function formatCurrency(value) {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return '-';
    }

    return new Intl.NumberFormat('en-PG', {
        style: 'currency',
        currency: 'PGK',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function RequiredMark() {
    return <span className="ml-1 text-red-500">*</span>;
}

function DateInput({ id, value, onChange, required = false }) {
    const pickerRef = useRef(null);
    const safeValue = isValidDateTextInput(value) ? value : '';

    function openPicker() {
        const picker = pickerRef.current;

        if (!picker) {
            return;
        }

        if (typeof picker.showPicker === 'function') {
            picker.showPicker();
            return;
        }

        picker.focus();
        picker.click();
    }

    return (
        <div className="relative">
            <input
                id={id}
                type="text"
                value={safeValue}
                onClick={openPicker}
                onKeyDown={(event) => {
                    if (event.key === 'Tab') {
                        return;
                    }

                    event.preventDefault();
                    openPicker();
                }}
                className="w-full cursor-pointer pr-12 input-shell office-date-input"
                placeholder={DATE_PLACEHOLDER}
                readOnly
                required={required}
            />
            <input
                ref={pickerRef}
                type="date"
                min={MIN_DATE_INPUT}
                max={MAX_DATE_INPUT}
                value={safeValue}
                onChange={(event) => onChange(event.target.value)}
                className="pointer-events-none absolute right-3 top-1/2 h-6 w-6 -translate-y-1/2 opacity-0"
                tabIndex={-1}
                aria-hidden="true"
            />
            <button
                type="button"
                onClick={openPicker}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-blue-600"
                aria-label="Choose date"
            >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            </button>
        </div>
    );
}

function SectionBlock({ eyebrow, title, description, children, className = '' }) {
    return (
        <section className={`rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-5 ${className}`}>
            <div className="mb-4">
                {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p> : null}
                <h3 className="mt-1 text-lg font-semibold text-slate-950">{title}</h3>
                {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
            </div>
            {children}
        </section>
    );
}

function toDateInputValue(date) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: PNG_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })
        .formatToParts(date)
        .reduce((next, part) => ({ ...next, [part.type]: part.value }), {});

    return `${parts.year}-${parts.month}-${parts.day}`;
}

function getPeriodRange(period, customStart = '', customEnd = '') {
    const today = new Date();
    const start = new Date(today);

    if (period === 'today') {
        return { date_start: toDateInputValue(today), date_end: toDateInputValue(today) };
    }

    if (period === 'month') {
        start.setDate(1);
        return { date_start: toDateInputValue(start), date_end: toDateInputValue(today) };
    }

    if (period === 'year') {
        start.setMonth(0, 1);
        return { date_start: toDateInputValue(start), date_end: toDateInputValue(today) };
    }

    if (period === 'custom') {
        return { date_start: customStart, date_end: customEnd };
    }

    return { date_start: '', date_end: '' };
}

export default function ItemsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [notice, setNotice] = useState('');
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(searchParams.get('create') === '1');
    const [editingId, setEditingId] = useState(null);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [form, setForm] = useState(defaultForm());
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemReport, setItemReport] = useState({ items: [], history: [] });
    const [itemReportLoading, setItemReportLoading] = useState(false);
    const [itemReportPeriod, setItemReportPeriod] = useState('all');
    const [itemDateStart, setItemDateStart] = useState('');
    const [itemDateEnd, setItemDateEnd] = useState('');
    const [exporting, setExporting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [retireTarget, setRetireTarget] = useState(null);
    const [retiringId, setRetiringId] = useState(null);
    const [retireForm, setRetireForm] = useState({
        disposal_value: '',
        disposal_reason: '',
        retired_at: '',
    });

    const filters = useMemo(
        () => ({
            search: searchParams.get('search') ?? '',
            stock: searchParams.get('stock') ?? '',
            category_id: searchParams.get('category_id') ?? '',
            page: Number.parseInt(searchParams.get('page') ?? '1', 10),
            per_page: 10,
        }),
        [searchParams]
    );

    const { data, loading, error, refetch } = useApi('/items', { params: filters }, { ttl: 180000 });
    const items = data?.data || [];
    const meta = {
        current_page: data?.current_page || 1,
        last_page: data?.last_page || 1,
        total: data?.total || 0,
    };

    const [searchInput, setSearchInput] = useState(filters.search);

    useEffect(() => {
        setSearchInput(filters.search);
    }, [filters.search]);

    useEffect(() => {
        if (searchParams.get('create') === '1' && !editingId) {
            setShowForm(true);
        }
    }, [searchParams, editingId]);

    useEffect(() => {
        void fetchCategories();
        void fetchSuppliers();
    }, []);

    useEffect(() => {
        if (selectedItem) {
            void fetchItemReport(selectedItem);
        }
    }, [selectedItem, itemReportPeriod, itemDateStart, itemDateEnd]);

    async function fetchCategories() {
        try {
            const response = await apiClient.get('/categories', { params: { per_page: 100 } });
            setCategories(response.data.data || response.data || []);
        } catch (err) {
            console.error('Failed to load categories', err);
        }
    }

    async function fetchSuppliers() {
        try {
            const response = await apiClient.get('/suppliers', { params: { per_page: 100 } });
            setSuppliers(response.data.data || response.data || []);
        } catch (err) {
            console.error('Failed to load suppliers', err);
        }
    }

    async function fetchItemReport(item) {
        setItemReportLoading(true);

        try {
            const response = await apiClient.get('/assignments/report', {
                params: {
                    item_id: item.id,
                    date_start: itemReportDateRange.date_start,
                    date_end: itemReportDateRange.date_end,
                },
            });

            setItemReport({
                items: response.data?.items || [],
                history: response.data?.history || [],
            });
        } catch (err) {
            console.error('Failed to load item assignment report', err);
        } finally {
            setItemReportLoading(false);
        }
    }

    const refreshItems = useCallback(async () => {
        invalidateApiCache('/items');
        await refetch();
    }, [refetch]);

    const resetForm = useCallback(() => {
        setForm(defaultForm());
        setEditingId(null);
        setShowForm(false);
        setFormError('');
    }, []);

    const isSerializedMode = form.tracking_mode === 'serialized';
    const isDepreciable = Boolean(form.is_depreciable);
    const itemReportDateRange = useMemo(
        () => getPeriodRange(itemReportPeriod, itemDateStart, itemDateEnd),
        [itemReportPeriod, itemDateStart, itemDateEnd]
    );
    const selectedItemPosition = useMemo(
        () => itemReport.items.find((item) => Number(item.id) === Number(selectedItem?.id)) || null,
        [itemReport.items, selectedItem]
    );
    const selectedCategory = useMemo(
        () => categories.find((category) => Number(category.id) === Number(form.category_id)) || null,
        [categories, form.category_id]
    );

    useEffect(() => {
        if (!editingId && isSerializedMode && Number(form.quantity) !== 1) {
            setForm((prev) => ({
                ...prev,
                quantity: 1,
            }));
        }
    }, [editingId, isSerializedMode, form.quantity]);

    useEffect(() => {
        if (!isDepreciable || !selectedCategory?.default_useful_life_years || form.useful_life_years) {
            return;
        }

        setForm((prev) => ({
            ...prev,
            useful_life_years: selectedCategory.default_useful_life_years,
        }));
    }, [form.useful_life_years, isDepreciable, selectedCategory]);

    const handleSubmit = useCallback(
        async (event) => {
            event.preventDefault();
            setNotice('');
            setFormError('');
            const enteredAssetTag = form.asset_tag.trim();
            const enteredSerialNumber = form.serial_number.trim();
            const currentQuantity = Number(form.quantity || 0);

            if (!editingId && isSerializedMode && currentQuantity !== 1) {
                setFormError('Serialized assets are tracked one-by-one, so initial quantity must be 1.');
                return;
            }

            if (!editingId && !isSerializedMode && enteredSerialNumber) {
                setFormError('Serial Number is only for serialized assets. Clear Serial Number or switch to serialized asset.');
                return;
            }

            if (currentQuantity < 0 || !Number.isInteger(currentQuantity)) {
                setFormError('Quantity must be a whole number and cannot be negative.');
                return;
            }

            if (editingId && enteredSerialNumber && currentQuantity !== 1) {
                setFormError('Serial Number is only allowed when the quantity is 1.');
                return;
            }

            if (!isValidDateTextInput(form.purchase_date)) {
                setFormError('Purchase Date must be a valid date in YYYY-MM-DD format.');
                return;
            }

            if (isDepreciable && !isValidDateTextInput(form.depreciation_start_date)) {
                setFormError('Depreciation Start Date must be a valid date in YYYY-MM-DD format.');
                return;
            }

            try {
                setSubmitting(true);

                const payload = {
                    name: form.name.trim(),
                    brand: form.brand.trim(),
                    sku: form.sku.trim(),
                    description: form.description.trim(),
                    category_id: form.category_id,
                    supplier_id: form.supplier_id,
                    status: form.status,
                    unit_of_measurement: form.unit_of_measurement.trim() || 'unit',
                    reorder_level: Number.parseInt(String(form.reorder_level || 0), 10),
                    unit_cost: form.unit_cost === '' ? '' : form.unit_cost,
                    is_depreciable: isDepreciable,
                    depreciation_method: isDepreciable ? form.depreciation_method : '',
                    useful_life_years: isDepreciable && form.useful_life_years !== '' ? Number.parseInt(String(form.useful_life_years), 10) : '',
                    salvage_value: isDepreciable && form.salvage_value !== '' ? form.salvage_value : '',
                    depreciation_start_date: isDepreciable ? form.depreciation_start_date || form.purchase_date || '' : '',
                    asset_tag: enteredAssetTag,
                    serial_number: editingId || isSerializedMode ? enteredSerialNumber : '',
                    location: form.location.trim(),
                    purchase_date: form.purchase_date || '',
                };

                payload.quantity = Number.parseInt(String(form.quantity || (editingId ? 0 : 1)), 10);

                const response = editingId
                    ? await apiClient.put(`/items/${editingId}`, payload)
                    : await apiClient.post('/items', payload);

                setNotice(
                    response?.data?.message ||
                        (editingId ? 'Inventory item updated successfully.' : 'Inventory item saved successfully.')
                );

                resetForm();
                await refreshItems();
            } catch (err) {
                console.error(err);
                setFormError(extractErrorMessage(err));
            } finally {
                setSubmitting(false);
            }
        },
        [editingId, form, isDepreciable, isSerializedMode, refreshItems, resetForm]
    );

    const handleDelete = useCallback(
        async (item) => {
            try {
                setNotice('');
                setFormError('');
                setDeletingId(item.id);
                await apiClient.delete(`/items/${item.id}`);
                setNotice('Inventory item deleted successfully.');
                setDeleteTarget(null);
                await refreshItems();
            } catch (err) {
                console.error(err);
                setFormError(extractErrorMessage(err));
            }
            finally {
                setDeletingId(null);
            }
        },
        [refreshItems]
    );

    function openRetireDialog(item) {
        setFormError('');
        setNotice('');
        setRetireTarget(item);
        setRetireForm({
            disposal_value: item.current_book_value_total ?? item.current_book_value_per_unit ?? '',
            disposal_reason: '',
            retired_at: toDateInputValue(new Date()),
        });
    }

    async function handleRetireSubmit(event) {
        event.preventDefault();

        if (!retireTarget) {
            return;
        }

        try {
            setRetiringId(retireTarget.id);
            setFormError('');

            const response = await apiClient.post(`/items/${retireTarget.id}/retire`, {
                disposal_value: retireForm.disposal_value === '' ? null : retireForm.disposal_value,
                disposal_reason: retireForm.disposal_reason.trim(),
                retired_at: retireForm.retired_at || null,
            });

            setNotice(response?.data?.message || 'Asset retired/disposed successfully.');
            setRetireTarget(null);
            setRetireForm({ disposal_value: '', disposal_reason: '', retired_at: '' });
            await refreshItems();
        } catch (err) {
            setFormError(extractErrorMessage(err));
        } finally {
            setRetiringId(null);
        }
    }

    const handleEdit = useCallback((item) => {
        setNotice('');
        setFormError('');
        setForm({
            tracking_mode: item.asset_tag || item.serial_number ? 'serialized' : 'bulk',
            name: item.name || '',
            brand: item.brand || '',
            sku: item.sku || '',
            description: item.description || '',
            category_id: item.category_id || '',
            supplier_id: item.supplier_id || '',
            status: item.status || 'available',
            quantity: item.quantity || 1,
            unit_of_measurement: item.unit_of_measurement || 'unit',
            reorder_level: item.reorder_level ?? 5,
            unit_cost: item.unit_cost || '',
            is_depreciable: Boolean(item.is_depreciable),
            depreciation_method: item.depreciation_method || 'straight_line',
            useful_life_years: item.useful_life_years ?? '',
            salvage_value: item.salvage_value ?? '',
            depreciation_start_date: item.depreciation_start_date || '',
            asset_tag: item.asset_tag || '',
            serial_number: item.serial_number || '',
            location: item.location || '',
            purchase_date: item.purchase_date || '',
        });

        setEditingId(item.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

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

    function handleFilterChange(key, value) {
        updateQuery({ [key]: value, page: 1 });
    }

    async function handleExportCsv(exportType = 'current') {
        try {
            setExporting(true);
            setFormError('');

            const exportOption = STOCK_EXPORT_OPTIONS[exportType] || STOCK_EXPORT_OPTIONS.current;
            const exportFilters = {
                ...filters,
                stock: exportOption.stock === null ? filters.stock : exportOption.stock,
            };
            const exportRows = exportOption.depreciation
                ? (await apiClient.get('/items/depreciation-report', { params: exportFilters })).data.data || []
                : await fetchFilteredExportRows('/items', exportFilters);

            downloadCsv(
                exportOption.filename,
                exportRows.map((item) => ({
                    Name: item.name || '',
                    'Asset Tag': item.asset_tag || '',
                    Brand: item.brand || '',
                    SKU: item.sku || '',
                    Category: item.category?.name || '',
                    Supplier: item.supplier?.name || '',
                    'Available Quantity': item.quantity ?? 0,
                    'Unit of Measurement': item.unit_of_measurement || 'unit',
                    'Assigned Quantity': item.active_assigned_quantity ?? 0,
                    'Managed Quantity': item.managed_quantity ?? item.quantity ?? 0,
                    'Unit Cost (PGK)': item.unit_cost ?? '',
                    'Depreciable': item.depreciation_enabled ? 'Yes' : 'No',
                    'Useful Life (Years)': item.useful_life_years ?? '',
                    'Salvage Value (PGK)': item.salvage_value ?? '',
                    'Annual Depreciation (PGK)': item.annual_depreciation ?? '',
                    'Monthly Depreciation (PGK)': item.monthly_depreciation ?? '',
                    'Accumulated Depreciation / Unit (PGK)': item.accumulated_depreciation_per_unit ?? '',
                    'Book Value / Unit (PGK)': item.current_book_value_per_unit ?? '',
                    'Book Value Total (PGK)': item.current_book_value_total ?? '',
                    'Depreciation End Date': item.depreciation_end_date ?? '',
                    'Fully Depreciated': item.is_fully_depreciated ? 'Yes' : 'No',
                    'Retired At': formatDateTime(item.retired_at),
                    'Disposal Value (PGK)': item.disposal_value ?? '',
                    'Disposal Reason': item.disposal_reason ?? '',
                    'Stock State': getStockStateBadge(item).label,
                    'Date Added (PNG Time)': formatDateTime(item.date_added_at || item.date_added),
                }))
            );
        } catch (err) {
            setFormError(err?.response?.data?.message || 'Failed to export inventory.');
        } finally {
            setExporting(false);
        }
    }

    function handlePdfExport() {
        window.print();
    }

    function handleItemExportCsv() {
        if (!selectedItem) {
            return;
        }

        downloadCsv(
            `${selectedItem.name || 'item'}-assignment-report.csv`,
            itemReport.history.map((entry) => ({
                Item: entry.item_name,
                'Asset Tag': entry.asset_tag || '',
                SKU: entry.sku || '',
                Receiver: entry.receiver,
                Department: entry.department || '',
                Date: formatDate(entry.assigned_at),
                'Date / Time (PNG Time)': formatDateTime(entry.assigned_at),
                Quantity: entry.quantity,
                Status: entry.status,
            }))
        );
    }

    function openItemReport(item) {
        setSelectedItem(item);
        document.getElementById('inventory-item-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function goToPage(page) {
        updateQuery({ page });
    }

    function toggleForm() {
        setNotice('');
        setFormError('');

        if (showForm) {
            resetForm();
            return;
        }

        setEditingId(null);
        setForm(defaultForm());
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (loading && !data) {
        return <div className="text-slate-500">Loading inventory...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="page-header">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100 rounded-full bg-blue-50">
                        Inventory Control
                    </div>
                    <h1 className="mt-4 page-title whitespace-nowrap">Inventory</h1>
                    <p className="page-subtitle">
                        Manage inventory records, stock levels, and item details in one place.
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
                    <form onSubmit={handleSearchSubmit} className="flex items-center min-w-0 gap-2">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search inventory..."
                            className="w-full input-shell sm:w-80"
                        />
                        <button type="submit" className="btn-primary">
                            Find
                        </button>
                    </form>

                    <button type="button" onClick={toggleForm} className="btn-primary">
                        {showForm ? 'Cancel' : 'Add Inventory Item'}
                    </button>

                    <select
                        value=""
                        onChange={(e) => {
                            if (e.target.value.startsWith('csv:')) {
                                void handleExportCsv(e.target.value.replace('csv:', ''));
                            }
                        }}
                        disabled={exporting}
                        className="input-shell sm:w-56 disabled:opacity-60"
                    >
                        <option value="">{exporting ? 'Exporting...' : 'Export...'}</option>
                        {Object.entries(STOCK_EXPORT_OPTIONS).map(([key, option]) => (
                            <option key={key} value={`csv:${key}`}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="panel">
                <div className="panel-body">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div>
                            <h2 className="section-title">Filters</h2>
                            <p className="section-subtitle">Refine inventory by stock state and category.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <select
                        value={filters.stock}
                        onChange={(e) => handleFilterChange('stock', e.target.value)}
                        className="input-shell"
                    >
                        <option value="">All stock states</option>
                        <option value="available">Available</option>
                        <option value="low">Low Stock</option>
                        <option value="out">Out of Stock</option>
                    </select>

                    <select
                        value={filters.category_id}
                        onChange={(e) => handleFilterChange('category_id', e.target.value)}
                        className="input-shell"
                    >
                        <option value="">All categories</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>

                    <button type="button" onClick={() => setSearchParams({})} className="btn-secondary">
                        Clear Filters
                    </button>
                    </div>
                </div>
            </div>

            {notice ? (
                <div className="px-4 py-3 text-sm border rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700">
                    {notice}
                </div>
            ) : null}

            {formError ? (
                <div className="px-4 py-3 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
                    {formError}
                </div>
            ) : null}

            {error ? (
                <div className="px-4 py-3 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
                    {error}
                </div>
            ) : null}

            {selectedItem ? (
                <section id="inventory-item-report" className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
                    <div className="px-6 py-5 border-b border-blue-100 bg-blue-50/50">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                            <div>
                                <p className="text-xs font-bold tracking-wide text-blue-600 uppercase">Asset File</p>
                                <h2 className="mt-1 text-2xl font-bold text-slate-900">{selectedItem.name}</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Available stock, assigned receivers, movement dates, and exportable item history.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <select
                                    value={itemReportPeriod}
                                    onChange={(e) => setItemReportPeriod(e.target.value)}
                                    className="input-shell"
                                >
                                    <option value="all">All dates</option>
                                    <option value="today">Today</option>
                                    <option value="month">This month</option>
                                    <option value="year">This year</option>
                                    <option value="custom">Custom dates</option>
                                </select>

                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value === 'csv') {
                                            handleItemExportCsv();
                                        }
                                        if (e.target.value === 'pdf') {
                                            handlePdfExport();
                                        }
                                    }}
                                    className="input-shell"
                                >
                                    <option value="">Export...</option>
                                    <option value="csv">CSV</option>
                                    <option value="pdf">PDF</option>
                                </select>

                                <button type="button" onClick={() => setSelectedItem(null)} className="btn-secondary">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 panel-body">

                        {itemReportPeriod === 'custom' ? (
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                     <input
                          type="date"
                          value={itemDateStart}
                          onChange={(e) => setItemDateStart(e.target.value)}
                         className="input-shell"
                             />
                                 <input
                                       type="date"
                                       value={itemDateEnd}
                                       onChange={(e) => setItemDateEnd(e.target.value)}
                                      className="input-shell"
                                        />
                                           </div>
                                            ) : null}

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                            <div className="metric-card">
                                <p className="text-xs font-semibold uppercase text-slate-500">Asset Tag</p>
                                <p className="mt-1 font-semibold text-slate-900">{selectedItem.asset_tag || '-'}</p>
                            </div>
                            <div className="metric-card">
                                <p className="text-xs font-semibold uppercase text-slate-500">Date Added</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {formatDateTime(selectedItem.date_added_at || selectedItem.date_added)}
                                </p>
                            </div>
                            <div className="metric-card">
                                <p className="text-xs font-semibold uppercase text-slate-500">Available</p>
                                <p className="mt-1 text-2xl font-bold text-emerald-700">
                                    {selectedItemPosition?.available_quantity ?? selectedItem.quantity ?? 0}
                                </p>
                            </div>
                            <div className="metric-card">
                                <p className="text-xs font-semibold uppercase text-slate-500">Assigned</p>
                                <p className="mt-1 text-2xl font-bold text-blue-700">
                                    {selectedItemPosition?.active_assigned_quantity ?? 0}
                                </p>
                            </div>
                            <div className="metric-card">
                                <p className="text-xs font-semibold uppercase text-slate-500">Managed Total</p>
                                <p className="mt-1 text-2xl font-bold text-slate-900">
                                    {selectedItemPosition?.managed_quantity ?? selectedItem.quantity ?? 0}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                            <div className="metric-card">
                                <p className="text-xs font-semibold uppercase text-slate-500">Unit Cost</p>
                                <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(selectedItem.unit_cost)}</p>
                            </div>
                            <div className="metric-card">
                                <p className="text-xs font-semibold uppercase text-slate-500">Monthly Depreciation</p>
                                <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(selectedItem.monthly_depreciation)}</p>
                            </div>
                            <div className="metric-card">
                                <p className="text-xs font-semibold uppercase text-slate-500">Book Value / Unit</p>
                                <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(selectedItem.current_book_value_per_unit)}</p>
                            </div>
                            <div className="metric-card">
                                <p className="text-xs font-semibold uppercase text-slate-500">Book Value Total</p>
                                <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(selectedItem.current_book_value_total)}</p>
                            </div>
                        </div>

                        {selectedItem.depreciation_enabled ? (
                            <div className="px-4 py-3 text-sm border rounded-xl border-emerald-100 bg-emerald-50 text-emerald-800">
                                Straight-line depreciation runs from {formatDate(selectedItem.depreciation_start_date)} to{' '}
                                {formatDate(selectedItem.depreciation_end_date)}. Accumulated depreciation is{' '}
                                {formatCurrency(selectedItem.accumulated_depreciation_total)} across{' '}
                                {selectedItem.managed_quantity ?? selectedItem.quantity ?? 0} managed {selectedItem.unit_of_measurement || 'unit'}.
                            </div>
                        ) : (
                            <div className="px-4 py-3 text-sm border rounded-xl border-slate-200 bg-slate-50 text-slate-600">
                                Depreciation is not enabled for this item.
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="min-w-full overflow-hidden text-sm rounded-xl">
                                <thead className="table-head">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-left">Receiver</th>
                                        <th className="px-4 py-3 font-semibold text-left">Date / Time</th>
                                        <th className="px-4 py-3 font-semibold text-left">Qty</th>
                                        <th className="px-4 py-3 font-semibold text-left">Status</th>
                                        <th className="px-4 py-3 font-semibold text-left">Department</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {itemReport.history.map((entry) => (
                                        <tr key={entry.id} className="table-row">
                                            <td className="px-4 py-3 font-medium text-slate-900">{entry.receiver}</td>
                                            <td className="px-4 py-3 text-slate-700">{formatDateTime(entry.assigned_at)}</td>
                                            <td className="px-4 py-3 text-slate-700">{entry.quantity}</td>
                                            <td className="px-4 py-3 text-slate-700">{entry.status}</td>
                                            <td className="px-4 py-3 text-slate-700">{entry.department || '-'}</td>
                                        </tr>
                                    ))}
                                    {!itemReportLoading && itemReport.history.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                                No assignments found for this item in the selected date range.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            ) : null}

            {showForm ? (
                <div className="panel">
                    <div className="panel-body">
                        <div className="flex flex-col gap-3 mb-6 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">Inventory Form</p>
                                <h2 className="mt-1 text-2xl font-bold text-slate-950">
                                    {editingId ? 'Edit Inventory Item' : 'Add New Inventory Item'}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Required fields are marked with <RequiredMark /> and depreciation fields only matter when depreciation is enabled.
                                </p>
                            </div>
                            <div className="px-4 py-3 text-sm border rounded-2xl border-slate-200 bg-slate-50 text-slate-600">
                                Keep item basics, stock details, and financial details complete for clearer reporting.
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!editingId ? (
                                <SectionBlock
                                    eyebrow="Tracking"
                                    title="Item Tracking Mode"
                                    description="Choose how this item should be tracked before entering the rest of the record."
                                >
                                {!editingId ? (
                                    <div>
                                        <label className="field-label">Tracking Mode</label>
                                        <select
                                            value={form.tracking_mode}
                                            onChange={(e) => {
                                                const nextMode = e.target.value;

                                                setForm({
                                                    ...form,
                                                    tracking_mode: nextMode,
                                                    quantity: nextMode === 'serialized' ? 1 : form.quantity,
                                                    serial_number: nextMode === 'bulk' ? '' : form.serial_number,
                                                });
                                            }}
                                            className="w-full input-shell"
                                        >
                                            <option value="bulk">Bulk stock - one row with many units</option>
                                            <option value="serialized">Serialized asset - one unique asset</option>
                                        </select>
                                        <p className="mt-2 text-xs text-slate-500">
                                            {isSerializedMode
                                                ? 'Asset Tag and Serial Number will be saved. Quantity is fixed at 1.'
                                                : 'Bulk stock can still have an Asset Tag. Serial Number is only for serialized assets.'}
                                        </p>
                                    </div>
                                ) : null}
                                </SectionBlock>
                            ) : null}

                            <SectionBlock
                                eyebrow="Basics"
                                title="Item Basics"
                                description="Core identification details for the asset or stock item."
                            >
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                                <div>
                                    <label className="field-label">Name<RequiredMark /></label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full input-shell"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="field-label">Brand</label>
                                    <input
                                        type="text"
                                        value={form.brand}
                                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                                        className="w-full input-shell"
                                    />
                                </div>

                                <div>
                                    <label className="field-label">{isSerializedMode ? 'SKU' : 'SKU / Bulk Item Code'}</label>
                                    <input
                                        type="text"
                                        value={form.sku}
                                        onChange={(e) => setForm({ ...form, sku: e.target.value })}
                                        className="w-full input-shell"
                                    />
                                    {!editingId && !isSerializedMode ? (
                                        <p className="mt-2 text-xs text-slate-500">
                                            This appears in the SKU column. It is not an Asset Tag.
                                        </p>
                                    ) : null}
                                </div>
                                <div>
                                    <label className="field-label">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        rows="4"
                                        className="w-full input-shell"
                                    />
                                </div>
                            </div>
                            </SectionBlock>

                            <SectionBlock
                                eyebrow="Stock"
                                title="Stock and Availability"
                                description="Operational fields that control quantity, reorder behavior, and item state."
                            >
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {!editingId ? (
                                    <div>
                                        <label className="field-label">Initial Quantity<RequiredMark /></label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={form.quantity}
                                            disabled={isSerializedMode}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    quantity: Number.parseInt(e.target.value || '1', 10),
                                                })
                                            }
                                            className="w-full input-shell disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                                            required
                                        />
                                        <p className="mt-2 text-xs text-slate-500">
                                            {isSerializedMode
                                                ? 'Serialized assets are tracked one-by-one, so quantity is fixed at 1.'
                                                : 'This is the starting stock count. Assignments subtract from this number and returns add back to it.'}
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="field-label">Available Quantity<RequiredMark /></label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.quantity}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    quantity: Number.parseInt(e.target.value || '0', 10),
                                                })
                                            }
                                            className="w-full input-shell"
                                            required
                                        />
                                        <p className="mt-2 text-xs text-slate-500">
                                            Saving a changed quantity records an audited stock adjustment.
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="field-label">Unit of Measurement<RequiredMark /></label>
                                    <input
                                        type="text"
                                        value={form.unit_of_measurement}
                                        onChange={(e) => setForm({ ...form, unit_of_measurement: e.target.value })}
                                        className="w-full input-shell"
                                        placeholder="unit, box, roll, set"
                                        required
                                    />
                                    <p className="mt-2 text-xs text-slate-500">
                                        Shows beside quantities across inventory, dashboard, assignments, and reports.
                                    </p>
                                </div>

                                <div>
                                    <label className="field-label">Reorder Level</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.reorder_level}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                reorder_level: Number.parseInt(e.target.value || '0', 10),
                                            })
                                        }
                                        className="w-full input-shell"
                                    />
                                </div>

                                <div>
                                    <label className="field-label">Unit Cost {isDepreciable ? <RequiredMark /> : null}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.unit_cost}
                                        onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                                        className="w-full input-shell"
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Lifecycle Status<RequiredMark /></label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className="w-full input-shell"
                                    >
                                        <option value="available">Available</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="lost">Lost</option>
                                        <option value="retired">Retired</option>
                                    </select>
                                </div>
                            </div>
                            </SectionBlock>

                                <SectionBlock
                                    eyebrow="Financials"
                                    title="Depreciation"
                                    description="Use this for fixed assets like laptops, printers, and office equipment that lose value over time."
                                >
                                    <div className="px-4 py-4 border rounded-2xl border-slate-200 bg-slate-50">
                                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">Financial depreciation tracking</p>
                                                <p className="mt-1 text-xs text-slate-500">Enable this only for fixed assets that lose value over time.</p>
                                            </div>

                                            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={isDepreciable}
                                                    onChange={(e) =>
                                                        setForm({
                                                            ...form,
                                                            is_depreciable: e.target.checked,
                                                            depreciation_method: 'straight_line',
                                                            useful_life_years: e.target.checked
                                                                ? form.useful_life_years || selectedCategory?.default_useful_life_years || ''
                                                                : '',
                                                            salvage_value: e.target.checked ? form.salvage_value : '',
                                                            depreciation_start_date: e.target.checked
                                                                ? form.depreciation_start_date || form.purchase_date
                                                                : '',
                                                        })
                                                    }
                                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                />
                                                Track depreciation for this item
                                            </label>
                                        </div>

                                        {isDepreciable ? (
                                            <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 xl:grid-cols-4">
                                                <div>
                                                    <label className="field-label">Method</label>
                                                    <select
                                                        value={form.depreciation_method}
                                                        onChange={(e) => setForm({ ...form, depreciation_method: e.target.value })}
                                                        className="w-full input-shell"
                                                    >
                                                        <option value="straight_line">Straight Line</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="field-label">Useful Life (Years)<RequiredMark /></label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="50"
                                                        value={form.useful_life_years}
                                                        onChange={(e) => setForm({ ...form, useful_life_years: e.target.value })}
                                                        className="w-full input-shell"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="field-label">Salvage Value</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={form.salvage_value}
                                                        onChange={(e) => setForm({ ...form, salvage_value: e.target.value })}
                                                        className="w-full input-shell"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="field-label">Depreciation Start Date<RequiredMark /></label>
                                                    <DateInput
                                                        id="depreciation-start-date"
                                                        value={form.depreciation_start_date}
                                                        onChange={(value) =>
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                depreciation_start_date: value,
                                                            }))
                                                        }
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="mt-3 text-xs text-slate-500">
                                                Leave this off for consumables or bulk stock that you only count by quantity.
                                            </p>
                                        )}
                                    </div>
                                </SectionBlock>

                            <SectionBlock
                                eyebrow="Classification"
                                title="Category, Supplier, and Identity"
                                description="These fields determine where the item belongs and how it will be recognized later."
                            >
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <div>
                                    <label className="field-label">Category<RequiredMark /></label>
                                    <select
                                        value={form.category_id}
                                        onChange={(e) => {
                                            const category = categories.find((item) => Number(item.id) === Number(e.target.value));

                                            setForm({
                                                ...form,
                                                category_id: e.target.value,
                                                useful_life_years:
                                                    isDepreciable && !form.useful_life_years && category?.default_useful_life_years
                                                        ? category.default_useful_life_years
                                                        : form.useful_life_years,
                                            });
                                        }}
                                        className="w-full input-shell"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="field-label">Supplier<RequiredMark /></label>
                                    <select
                                        value={form.supplier_id}
                                        onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                                        className="w-full input-shell"
                                        required
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map((supplier) => (
                                            <option key={supplier.id} value={supplier.id}>
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="field-label">Asset Tag</label>
                                    <input
                                        type="text"
                                        value={form.asset_tag}
                                        onChange={(e) => setForm({ ...form, asset_tag: e.target.value })}
                                        className="w-full input-shell"
                                    />
                                    <p className="mt-2 text-xs text-slate-500">
                                        This appears in the Asset Tag column.
                                    </p>
                                </div>

                                {(editingId || isSerializedMode) ? (
                                    <>
                                        <div>
                                            <label className="field-label">Serial Number</label>
                                            <input
                                                type="text"
                                                value={form.serial_number}
                                                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                                                className="w-full input-shell"
                                            />
                                        </div>
                                    </>
                                ) : null}

                                <div>
                                    <label className="field-label">Location</label>
                                    <input
                                        type="text"
                                        value={form.location}
                                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                                        className="w-full input-shell"
                                    />
                                </div>

                                <div>
                                    <label className="field-label">Purchase Date</label>
                                    <DateInput
                                        id="purchase-date"
                                        value={form.purchase_date}
                                        onChange={(value) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                purchase_date: value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                            </SectionBlock>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : editingId ? 'Update Inventory Item' : 'Create Inventory Item'}
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
                    <table className="min-w-[1480px] w-full text-sm">
                        <thead className="table-head">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-left whitespace-nowrap">Name</th>
                                <th className="px-6 py-4 font-semibold text-left whitespace-nowrap">Asset Tag</th>
                                <th className="px-6 py-4 font-semibold text-left whitespace-nowrap">SKU</th>
                                <th className="px-6 py-4 font-semibold text-left whitespace-nowrap">Brand</th>
                                <th className="px-6 py-4 font-semibold text-left whitespace-nowrap">Category</th>
                                <th className="px-6 py-4 font-semibold text-left whitespace-nowrap">Supplier</th>
                                <th className="px-6 py-4 font-semibold text-left whitespace-nowrap">Available</th>
                                <th className="px-6 py-4 font-semibold text-left whitespace-nowrap">Assigned</th>
                                <th className="px-6 py-4 font-semibold text-left whitespace-nowrap">Managed</th>
                                <th className="px-6 py-4 font-semibold text-left whitespace-nowrap">Unit Cost</th>
                                <th className="px-6 py-4 font-semibold text-left whitespace-nowrap">Stock State</th>
                                <th className="px-6 py-4 font-semibold text-left whitespace-nowrap">Date Added</th>
                                <th className="px-6 py-4 font-semibold text-left whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {items.length > 0 ? (
                                items.map((item) => {
                                    const badge = getStockStateBadge(item);

                                    return (
                                        <tr key={item.id} className="table-row">
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                <button
                                                    type="button"
                                                    onClick={() => openItemReport(item)}
                                                    className="font-bold text-blue-700 transition hover:text-blue-900 hover:underline"
                                                >
                                                    {item.name || '-'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">{item.asset_tag || '-'}</td>
                                            <td className="px-6 py-4 text-slate-700">{item.sku || '-'}</td>
                                            <td className="px-6 py-4 text-slate-700">{item.brand || '-'}</td>
                                            <td className="px-6 py-4 text-slate-700">{item.category?.name || '-'}</td>
                                            <td className="px-6 py-4 text-slate-700">{item.supplier?.name || '-'}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">{item.quantity ?? 0} {item.unit_of_measurement || 'unit'}</td>
                                            <td className="px-6 py-4 font-semibold text-blue-700">{item.active_assigned_quantity ?? 0} {item.unit_of_measurement || 'unit'}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">{item.managed_quantity ?? item.quantity ?? 0} {item.unit_of_measurement || 'unit'}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">
                                                {formatCurrency(item.unit_cost)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                                                {formatDateTime(item.date_added_at || item.date_added)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(item)}
                                                    className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTarget(item)}
                                                    className="inline-flex rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openRetireDialog(item)}
                                                    disabled={item.status === 'retired'}
                                                    className="inline-flex rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Retire
                                                </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="13" className="px-6 py-10 text-center text-slate-500">
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

            {retireTarget ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40">
                    <div className="w-full max-w-lg p-6 bg-white border shadow-2xl rounded-2xl border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900">Retire or dispose asset</h2>
                        <p className="mt-3 text-sm text-slate-600">
                            This records an audited disposal for <strong>{retireTarget.name}</strong>, reduces available quantity to zero,
                            and keeps the asset in history as retired.
                        </p>

                        <form onSubmit={handleRetireSubmit} className="mt-5 space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="field-label">Retirement Date</label>
                                    <input
                                        type="date"
                                        value={retireForm.retired_at}
                                        onChange={(event) => setRetireForm((prev) => ({ ...prev, retired_at: event.target.value }))}
                                        className="w-full input-shell"
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Disposal Value (PGK)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={retireForm.disposal_value}
                                        onChange={(event) => setRetireForm((prev) => ({ ...prev, disposal_value: event.target.value }))}
                                        className="w-full input-shell"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="field-label">Reason<RequiredMark /></label>
                                <textarea
                                    rows={3}
                                    value={retireForm.disposal_reason}
                                    onChange={(event) => setRetireForm((prev) => ({ ...prev, disposal_reason: event.target.value }))}
                                    className="w-full input-shell"
                                    placeholder="Example: damaged beyond repair, sold, replaced, obsolete"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRetireTarget(null)}
                                    disabled={retiringId === retireTarget.id}
                                    className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={retiringId === retireTarget.id}
                                    className="inline-flex px-4 py-2 text-sm font-bold transition border rounded-lg border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {retiringId === retireTarget.id ? 'Retiring...' : 'Confirm Retirement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {deleteTarget ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40">
                    <div className="w-full max-w-md p-6 bg-white border shadow-2xl rounded-2xl border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900">Delete inventory item?</h2>
                        <p className="mt-3 text-sm text-slate-600">
                            Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                            This will only work if the item has not been used in real assignment or stock activity yet.
                        </p>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={deletingId === deleteTarget.id}
                                className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleDelete(deleteTarget)}
                                disabled={deletingId === deleteTarget.id}
                                className="inline-flex px-4 py-2 text-sm font-bold text-red-700 transition border border-red-200 rounded-lg bg-red-50 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deletingId === deleteTarget.id ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
