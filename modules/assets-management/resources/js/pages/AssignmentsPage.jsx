import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { downloadCsv } from '../utils/csv';
import { fetchFilteredExportRows } from '../utils/exportData';
import { invalidateApiCache, useApi } from '../hooks/useApi';

const PNG_TIME_ZONE = 'Pacific/Port_Moresby';
const MIN_DATE_INPUT = '1900-01-01';
const MAX_DATE_INPUT = '9999-12-31';
const DATE_PLACEHOLDER = 'Select date';

const TABS = [
    { id: 'active', label: 'Issued Out', description: 'Items still with people', status: 'active' },
    { id: 'new', label: 'Give Out', description: 'Assign an item', status: '' },
    { id: 'returned', label: 'Returned', description: 'Items back in stock', status: 'returned' },
    { id: 'receivers', label: 'People', description: 'Who has what', status: '' },
    { id: 'stock', label: 'Stock Check', description: 'Available vs issued', status: '' },
    { id: 'history', label: 'History', description: 'Full audit trail', status: '' },
];
const PERIOD_OPTIONS = [
    { id: 'all', label: 'All time' },
    { id: 'today', label: 'Today' },
    { id: 'month', label: 'This month' },
    { id: 'year', label: 'This year' },
    { id: 'custom', label: 'Choose dates' },
];

function defaultForm() {
    return {
        item_id: '',
        receiver_id: '',
        receiver_name: '',
        department_id: '',
        quantity: '1',
    };
}

function isItemAssignable(item) {
    const quantity = Number(item?.quantity || 0);
    const status = String(item?.status || '').toLowerCase();

    return quantity > 0 && !['maintenance', 'lost', 'retired'].includes(status);
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

    return parsed.getFullYear() === year && parsed.getMonth() + 1 === month && parsed.getDate() === day;
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
        return {
            date_start: isValidDateTextInput(customStart) ? customStart : '',
            date_end: isValidDateTextInput(customEnd) ? customEnd : '',
        };
    }

    return { date_start: '', date_end: '' };
}

function exportAssignmentRows(rows) {
    return rows.map((assignment) => ({
        Asset: assignment.item?.name || '',
        'Asset Tag': assignment.item?.asset_tag || '',
        SKU: assignment.item?.sku || '',
        'Given To': assignment.receiver_name || assignment.user?.name || '',
        Department: assignment.assigned_department?.name || '',
        Quantity: `${assignment.quantity || 0} ${assignment.item?.unit_of_measurement || 'unit'}`,
        'Date Given': formatDateTime(assignment.assigned_at),
        Status: assignment.returned_at ? 'Returned' : 'Issued out',
        'Date Returned': assignment.returned_at ? formatDateTime(assignment.returned_at) : '',
    }));
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getPeriodLabel(period, customStart = '', customEnd = '') {
    if (period === 'custom') {
        if (customStart && customEnd) {
            return `${customStart} to ${customEnd}`;
        }

        return 'Choose dates';
    }

    return PERIOD_OPTIONS.find((option) => option.id === period)?.label || 'All time';
}

function extractErrorMessage(error) {
    const response = error?.response?.data;

    if (response?.errors && typeof response.errors === 'object') {
        const firstKey = Object.keys(response.errors)[0];

        if (firstKey && Array.isArray(response.errors[firstKey]) && response.errors[firstKey][0]) {
            return response.errors[firstKey][0];
        }
    }

    return response?.message || error?.message || 'Action Failed. Please try again.';
}

function statusBadge(returnedAt) {
    return returnedAt
        ? 'border-slate-200 bg-slate-50 text-slate-700'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function stockBadge(state) {
    if (state === 'Out of Stock') {
        return 'border-red-200 bg-red-50 text-red-700';
    }

    if (state === 'Low Stock') {
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }

    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function Pager({ page, lastPage, total, onPageChange }) {
    if (total <= 0 || lastPage <= 1) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 pt-4 text-sm border-t border-slate-100 text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
                Page {page} of {lastPage} | {total} record(s)
            </span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="btn-secondary !px-3 !py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    type="button"
                    disabled={page >= lastPage}
                    onClick={() => onPageChange(page + 1)}
                    className="btn-secondary !px-3 !py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

function DateInput({ id, value, onChange }) {
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

function AssignmentCard({ assignment, onOpen, onReturn }) {
    const receiver = assignment.receiver_name || assignment.user?.name || '-';
    const returned = Boolean(assignment.returned_at);

    return (
        <div className="p-4 bg-white border shadow-sm rounded-xl border-slate-200">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-950">{assignment.item?.name || '-'}</h3>
                    <p className="mt-1 text-sm text-slate-500">{assignment.item?.asset_tag || assignment.item?.sku || 'No tag'}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadge(assignment.returned_at)}`}>
                    {returned ? 'Returned' : 'Issued out'}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                <div className="px-3 py-2 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">Given To</p>
                    <p className="font-semibold text-slate-900">{receiver}</p>
                </div>
                <div className="px-3 py-2 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">Quantity</p>
                    <p className="font-semibold text-slate-900">{assignment.quantity || 0} {assignment.item?.unit_of_measurement || 'unit'}</p>
                </div>
                <div className="px-3 py-2 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">Department</p>
                    <p className="font-semibold text-slate-900">{assignment.assigned_department?.name || '-'}</p>
                </div>
                <div className="px-3 py-2 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">Date Given</p>
                    <p className="font-semibold text-slate-900">{formatDateTime(assignment.assigned_at)}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
                <button type="button" onClick={() => onOpen(assignment)} className="btn-secondary !px-3 !py-2">
                    View
                </button>
                {!returned ? (
                    <button type="button" onClick={() => onReturn(assignment)} className="btn-primary !px-3 !py-2">
                        Return Asset
                    </button>
                ) : null}
            </div>
        </div>
    );
}

function AssignmentDetail({ assignment, onClose, onReturn }) {
    if (!assignment) {
        return null;
    }

    const returned = Boolean(assignment.returned_at);
    const receiver = assignment.receiver_name || assignment.user?.name || '-';

    return (
        <div className="p-4 border border-blue-200 shadow-sm rounded-xl bg-blue-50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-bold tracking-wide text-blue-700 uppercase">Selected Record</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-950">{assignment.item?.name || '-'}</h2>
                    <p className="mt-1 text-sm text-slate-600">Given to {receiver}</p>
                </div>
                <button type="button" onClick={onClose} className="btn-secondary !px-3 !py-2">
                    Close
                </button>
            </div>

            <div className="grid gap-3 mt-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="px-4 py-3 bg-white rounded-lg">
                    <p className="text-xs text-slate-500">Asset Tag / SKU</p>
                    <p className="font-semibold text-slate-950">{assignment.item?.asset_tag || assignment.item?.sku || '-'}</p>
                </div>
                <div className="px-4 py-3 bg-white rounded-lg">
                    <p className="text-xs text-slate-500">Department</p>
                    <p className="font-semibold text-slate-950">{assignment.assigned_department?.name || '-'}</p>
                </div>
                <div className="px-4 py-3 bg-white rounded-lg">
                    <p className="text-xs text-slate-500">Quantity</p>
                    <p className="font-semibold text-slate-950">{assignment.quantity || 0} {assignment.item?.unit_of_measurement || 'unit'}</p>
                </div>
                <div className="px-4 py-3 bg-white rounded-lg">
                    <p className="text-xs text-slate-500">Status</p>
                    <p className="font-semibold text-slate-950">{returned ? 'Returned' : 'Issued out'}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
                {!returned ? (
                    <button type="button" onClick={() => onReturn(assignment)} className="btn-primary">
                        Return Asset
                    </button>
                ) : null}
            </div>
        </div>
    );
}

export default function AssignmentsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || (searchParams.get('create') === '1' ? 'new' : 'active');
    const [activeTab, setActiveTab] = useState(TABS.some((tab) => tab.id === initialTab) ? initialTab : 'active');
    const [reportPeriod, setReportPeriod] = useState('all');
    const [customDateStart, setCustomDateStart] = useState('');
    const [customDateEnd, setCustomDateEnd] = useState('');
    const reportDateRange = useMemo(
        () => getPeriodRange(reportPeriod, customDateStart, customDateEnd),
        [reportPeriod, customDateStart, customDateEnd]
    );

    const filters = useMemo(
        () => ({
            search: searchParams.get('search') ?? '',
            status: searchParams.get('status') ?? (activeTab === 'active' ? 'active' : activeTab === 'returned' ? 'returned' : ''),
            date_start: reportDateRange.date_start,
            date_end: reportDateRange.date_end,
            page: Number.parseInt(searchParams.get('page') ?? '1', 10),
            per_page: 10,
        }),
        [searchParams, activeTab, reportDateRange]
    );

    const { data, loading, error, refetch } = useApi('/assignments', { params: filters }, { ttl: 60000 });
    const assignments = data?.data || [];
    const meta = {
        current_page: data?.current_page || 1,
        last_page: data?.last_page || 1,
        total: data?.total || 0,
    };

    const [notice, setNotice] = useState('');
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [searchInput, setSearchInput] = useState(filters.search);
    const [form, setForm] = useState(defaultForm());
    const [itemsList, setItemsList] = useState([]);
    const [receiversList, setReceiversList] = useState([]);
    const [report, setReport] = useState({ items: [], receivers: [], history: [] });
    const [reportLoading, setReportLoading] = useState(false);
    const [selectedReceiver, setSelectedReceiver] = useState('');
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [returnTarget, setReturnTarget] = useState(null);
    const [returningId, setReturningId] = useState(null);
    const [stockPage, setStockPage] = useState(1);
    const [receiverPage, setReceiverPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);

    const reportPageSize = 8;
    const receiverPageSize = 6;

    useEffect(() => {
        setSearchInput(filters.search);
    }, [filters.search]);

    useEffect(() => {
        void fetchItemsOptions();
        void fetchReceiversOptions();
    }, []);

    useEffect(() => {
        void fetchAssignmentReport();
    }, [filters.search, reportDateRange.date_start, reportDateRange.date_end]);

    const assignableItems = useMemo(
        () => [...itemsList].filter(isItemAssignable).sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))),
        [itemsList]
    );

    const selectedItem = useMemo(
        () => assignableItems.find((item) => String(item.id) === String(form.item_id)) || null,
        [assignableItems, form.item_id]
    );

    const requestedQuantity = Number(form.quantity);
    const maxQuantity = Number(selectedItem?.quantity || 0);
    const remainingQuantity = selectedItem && Number.isInteger(requestedQuantity) && requestedQuantity > 0
        ? Math.max(maxQuantity - requestedQuantity, 0)
        : maxQuantity;
    const quantityErrorMessage = selectedItem && form.quantity !== '' && !Number.isInteger(requestedQuantity)
        ? 'Quantity must be a whole number.'
        : selectedItem && requestedQuantity <= 0
          ? 'Quantity must be greater than 0.'
          : selectedItem && requestedQuantity > maxQuantity
            ? `Only ${maxQuantity} ${selectedItem.unit_of_measurement || 'unit'} available for assignment.`
            : '';

    const canSubmit =
        !submitting &&
        Boolean(selectedItem) &&
        Boolean(form.receiver_name.trim()) &&
        Boolean(form.department_id) &&
        Number.isInteger(requestedQuantity) &&
        requestedQuantity >= 1 &&
        requestedQuantity <= maxQuantity;

    const selectedReceiverDetail = useMemo(
        () => report.receivers.find((receiver) => (receiver.key || receiver.receiver) === selectedReceiver) || report.receivers[0] || null,
        [report.receivers, selectedReceiver]
    );

    const receiverDepartmentOptions = useMemo(
        () =>
            receiversList
                .filter((receiver) => receiver.department)
                .map((receiver) => ({
                    id: receiver.id,
                    receiver: receiver.name,
                    department_id: String(receiver.department_id),
                    department_name: receiver.department.name,
                    display_label: receiver.display_label || `${receiver.name} - ${receiver.department.name}`,
                }))
                .sort((a, b) => a.display_label.localeCompare(b.display_label)),
        [receiversList]
    );

    const receiverOptionsByDepartment = useMemo(() => {
        const groups = new Map();

        receiverDepartmentOptions.forEach((option) => {
            const department = option.department_name || 'No department';

            if (!groups.has(department)) {
                groups.set(department, []);
            }

            groups.get(department).push(option);
        });

        return Array.from(groups.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([department, options]) => ({
                department,
                options: options.sort((a, b) => a.receiver.localeCompare(b.receiver)),
            }));
    }, [receiverDepartmentOptions]);

    const receiverDepartmentLookup = useMemo(() => {
        const lookup = new Map();

        receiverDepartmentOptions.forEach((option) => {
            if (option.id) {
                lookup.set(String(option.id), option);
            }

            lookup.set(option.receiver.toLowerCase(), option);
            lookup.set(option.display_label.toLowerCase(), option);
        });

        return lookup;
    }, [receiverDepartmentOptions]);

    const selectedDepartmentOption = useMemo(
        () =>
            receiverDepartmentOptions.find(
                (option) =>
                    String(option.id || '') === String(form.receiver_id || '') ||
                    (
                        option.receiver.toLowerCase() === form.receiver_name.trim().toLowerCase() &&
                        String(option.department_id) === String(form.department_id)
                    )
            ) || null,
        [receiverDepartmentOptions, form.receiver_id, form.receiver_name, form.department_id]
    );


    const reportTotals = useMemo(
        () => ({
            available: report.items.reduce((sum, item) => sum + Number(item.available_quantity || 0), 0),
            assigned: report.items.reduce((sum, item) => sum + Number(item.active_assigned_quantity || 0), 0),
            managed: report.items.reduce((sum, item) => sum + Number(item.managed_quantity || 0), 0),
            active: report.history.filter((entry) => entry.status === 'Active').length,
            returned: report.history.filter((entry) => entry.status === 'Returned').length,
        }),
        [report]
    );

    const pagedStockItems = useMemo(
        () => report.items.slice((stockPage - 1) * reportPageSize, stockPage * reportPageSize),
        [report.items, stockPage]
    );
    const pagedReceiverItems = useMemo(
        () => (selectedReceiverDetail?.items || []).slice((receiverPage - 1) * receiverPageSize, receiverPage * receiverPageSize),
        [selectedReceiverDetail, receiverPage]
    );
    const pagedHistoryItems = useMemo(
        () => report.history.slice((historyPage - 1) * reportPageSize, historyPage * reportPageSize),
        [report.history, historyPage]
    );

    const stockLastPage = Math.max(1, Math.ceil(report.items.length / reportPageSize));
    const receiverLastPage = Math.max(1, Math.ceil((selectedReceiverDetail?.items?.length || 0) / receiverPageSize));
    const historyLastPage = Math.max(1, Math.ceil(report.history.length / reportPageSize));

    async function fetchAssignmentReport() {
        setReportLoading(true);

        try {
            const response = await apiClient.get('/assignments/report', {
                params: {
                    search: filters.search,
                    date_start: reportDateRange.date_start,
                    date_end: reportDateRange.date_end,
                },
            });

            const nextReport = {
                items: response.data?.items || [],
                receivers: response.data?.receivers || [],
                history: response.data?.history || [],
            };

            setReport(nextReport);

            if (nextReport.receivers.length > 0 && (!selectedReceiver || !nextReport.receivers.some((receiver) => (receiver.key || receiver.receiver) === selectedReceiver))) {
                setSelectedReceiver(nextReport.receivers[0].key || nextReport.receivers[0].receiver);
            }
        } catch (err) {
            console.error('Failed to load assignment report', err);
        } finally {
            setReportLoading(false);
        }
    }

    async function fetchItemsOptions() {
        try {
            const response = await apiClient.get('/items', { params: { per_page: 100 } });
            setItemsList(response.data.data || response.data || []);
        } catch (err) {
            console.error('Failed to load items for assignment', err);
        }
    }

    async function fetchReceiversOptions() {
        try {
            const response = await apiClient.get('/receivers', { params: { per_page: 100, active_only: 1 } });
            setReceiversList(response.data.data || response.data || []);
        } catch (err) {
            console.error('Failed to load receivers for assignment', err);
        }
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

    function changeTab(tabId) {
        const tab = TABS.find((item) => item.id === tabId) || TABS[0];
        setActiveTab(tab.id);
        setNotice('');
        setFormError('');
        setSelectedAssignment(null);
        updateQuery({ tab: tab.id, status: tab.status, page: 1 });
    }

    function handleSearchSubmit(event) {
        event.preventDefault();
        updateQuery({ search: searchInput.trim(), page: 1 });
    }

    function clearSearch() {
        setSearchInput('');
        updateQuery({ search: '', page: 1 });
    }

    function changeReportPeriod(period) {
        setReportPeriod(period);
        updateQuery({ page: 1 });
    }

    function changeCustomDate(key, value) {
        if (key === 'start') {
            setCustomDateStart(value);
        } else {
            setCustomDateEnd(value);
        }

        updateQuery({ page: 1 });
    }

    function handleReceiverChange(value) {
        const selectedValue = String(value || '').trim();
        const knownReceiver = receiverDepartmentLookup.get(selectedValue) || receiverDepartmentLookup.get(selectedValue.toLowerCase());

        if (!selectedValue) {
            setForm((prev) => ({
                ...prev,
                receiver_id: '',
                receiver_name: '',
                department_id: '',
            }));
            return;
        }

        setForm((prev) => ({
            ...prev,
            receiver_id: knownReceiver?.id ? String(knownReceiver.id) : '',
            receiver_name: knownReceiver?.receiver || '',
            department_id: knownReceiver?.department_id || '',
        }));
    }

    async function refreshAssignmentsPage() {
        setRefreshing(true);

        try {
            invalidateApiCache('/assignments');
            invalidateApiCache('/items');
            await Promise.all([refetch(), fetchItemsOptions(), fetchReceiversOptions(), fetchAssignmentReport()]);
        } finally {
            setRefreshing(false);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!canSubmit) {
            setFormError(quantityErrorMessage || 'Please complete all required fields before creating the assignment.');
            return;
        }

        try {
            setSubmitting(true);
            setNotice('');
            setFormError('');

            await apiClient.post('/assignments', {
                item_id: Number(form.item_id),
                receiver_id: form.receiver_id ? Number(form.receiver_id) : null,
                receiver_name: form.receiver_name.trim(),
                department_id: Number(form.department_id),
                quantity: Number.parseInt(String(form.quantity), 10),
            });

            setNotice('Assignment created successfully.');
            setForm(defaultForm());
            changeTab('active');
            await refreshAssignmentsPage();
        } catch (err) {
            setFormError(extractErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    function requestReturnAsset(assignment) {
        setNotice('');
        setFormError('');
        setReturnTarget(assignment);
    }

    async function confirmReturnAsset() {
        if (!returnTarget) {
            return;
        }

        try {
            setReturningId(returnTarget.id);
            setNotice('');
            setFormError('');
            await apiClient.put(`/assignments/${returnTarget.id}/return`);
            setNotice('Asset returned successfully.');
            setSelectedAssignment(null);
            setReturnTarget(null);
            await refreshAssignmentsPage();
        } catch (err) {
            setFormError(extractErrorMessage(err));
        } finally {
            setReturningId(null);
        }
    }

    async function getFilteredAssignmentsForExport() {
        return fetchFilteredExportRows('/assignments', filters);
    }

    async function exportFilteredAssignmentsCsv() {
        try {
            setExporting(true);
            setFormError('');

            const rows = exportAssignmentRows(await getFilteredAssignmentsForExport());
            downloadCsv('assignments-filtered.csv', rows);
        } catch (err) {
            setFormError(extractErrorMessage(err));
        } finally {
            setExporting(false);
        }
    }

    async function exportFilteredAssignmentsPdf() {
        try {
            setExporting(true);
            setFormError('');

            const rows = exportAssignmentRows(await getFilteredAssignmentsForExport());
            const currentTab = TABS.find((tab) => tab.id === activeTab)?.label || 'Assignments';
            const filterSummary = [
                `View: ${currentTab}`,
                filters.search ? `Search: ${filters.search}` : 'Search: All',
                `Period: ${getPeriodLabel(reportPeriod, customDateStart, customDateEnd)}`,
            ].join(' | ');
            const rowsHtml = rows.length
                ? rows.map((row) => `
                    <tr>
                        <td>${escapeHtml(row.Asset)}</td>
                        <td>${escapeHtml(row['Asset Tag'] || row.SKU)}</td>
                        <td>${escapeHtml(row['Given To'])}</td>
                        <td>${escapeHtml(row.Department)}</td>
                        <td>${escapeHtml(row.Quantity)}</td>
                        <td>${escapeHtml(row['Date Given'])}</td>
                        <td>${escapeHtml(row.Status)}</td>
                    </tr>
                `).join('')
                : '<tr><td colspan="7">No assignments found.</td></tr>';

            const printWindow = window.open('', '_blank');

            if (!printWindow) {
                setFormError('Allow pop-ups to export the PDF.');
                return;
            }

            printWindow.document.write(`
                <!doctype html>
                <html>
                    <head>
                        <title>Assignments</title>
                        <style>
                            body { font-family: Arial, sans-serif; color: #0f172a; margin: 28px; }
                            h1 { margin: 0 0 6px; font-size: 24px; }
                            p { margin: 0 0 18px; color: #475569; font-size: 12px; }
                            table { border-collapse: collapse; width: 100%; font-size: 11px; }
                            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; }
                            th { background: #f1f5f9; font-weight: 700; }
                        </style>
                    </head>
                    <body>
                        <h1>Assignments</h1>
                        <p>${escapeHtml(filterSummary)}</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Asset</th>
                                    <th>Tag / SKU</th>
                                    <th>Given To</th>
                                    <th>Department</th>
                                    <th>Qty</th>
                                    <th>Date Given</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>${rowsHtml}</tbody>
                        </table>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        } catch (err) {
            setFormError(extractErrorMessage(err));
        } finally {
            setExporting(false);
        }
    }

    function exportReceiverCsv() {
        if (!selectedReceiverDetail) {
            return;
        }

        downloadCsv(
            `${selectedReceiverDetail.receiver}-asset-statement.csv`,
            selectedReceiverDetail.items.map((item) => ({
                Receiver: selectedReceiverDetail.receiver,
                Item: item.item_name,
                'Asset Tag': item.asset_tag || '',
                SKU: item.sku || '',
                'Date / Time (PNG Time)': formatDateTime(item.last_assigned_at),
                Department: item.department || '',
                'Qty Assigned': `${item.quantity_assigned} ${item.unit_of_measurement || 'unit'}`,
                'Qty Returned': `${item.quantity_returned} ${item.unit_of_measurement || 'unit'}`,
                'Qty Remaining': `${item.quantity_remaining} ${item.unit_of_measurement || 'unit'}`,
            }))
        );
    }

    function exportStockCsv() {
        downloadCsv(
            'stock-position.csv',
            report.items.map((item) => ({
                Item: item.name,
                'Asset Tag': item.asset_tag || '',
                SKU: item.sku || '',
                Available: `${item.available_quantity} ${item.unit_of_measurement || 'unit'}`,
                Assigned: `${item.active_assigned_quantity} ${item.unit_of_measurement || 'unit'}`,
                'Total Managed': `${item.managed_quantity} ${item.unit_of_measurement || 'unit'}`,
                State: item.stock_state,
            }))
        );
    }

    function exportHistoryCsv() {
        downloadCsv(
            'assignment-history.csv',
            report.history.map((entry) => ({
                Item: entry.item_name,
                'Asset Tag': entry.asset_tag || '',
                SKU: entry.sku || '',
                Receiver: entry.receiver,
                'Date / Time (PNG Time)': formatDateTime(entry.assigned_at),
                Quantity: `${entry.quantity} ${entry.unit_of_measurement || 'unit'}`,
                Status: entry.status,
                Department: entry.department || '',
            }))
        );
    }

    if (loading && !data) {
        return <div className="text-slate-500">Loading assignments...</div>;
    }

    return (
        <div className="space-y-5">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Assignments</h1>
                    <p className="page-subtitle">Issue assets, confirm returns, check who holds items, and review assignment history.</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <button type="button" onClick={() => void refreshAssignmentsPage()} className="btn-secondary">
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button type="button" onClick={() => changeTab('new')} className="btn-primary">
                        Give Out
                    </button>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="metric-card">
                    <p className="text-xs font-semibold tracking-wide uppercase text-slate-500">Issued Out Now</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-700">{reportTotals.active}</p>
                </div>
                <div className="metric-card">
                    <p className="text-xs font-semibold tracking-wide uppercase text-slate-500">Returned</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">{reportTotals.returned}</p>
                </div>
                <div className="metric-card">
                    <p className="text-xs font-semibold tracking-wide uppercase text-slate-500">People Holding Assets</p>
                    <p className="mt-2 text-2xl font-bold text-blue-700">{report.receivers.length}</p>
                </div>
                <div className="metric-card">
                    <p className="text-xs font-semibold tracking-wide uppercase text-slate-500">Total Issued Qty</p>
                    <p className="mt-2 text-2xl font-bold text-amber-700">{reportTotals.assigned}</p>
                </div>
            </div>

            {notice ? <div className="px-4 py-3 text-sm border rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700">{notice}</div> : null}
            {formError || error ? (
                <div className="px-4 py-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
                    {formError || error}
                </div>
            ) : null}

            <div className="panel">
                <div className="space-y-4 panel-body">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="section-title">Assignment Work Area</h2>
                            <p className="section-subtitle">Current view: {TABS.find((tab) => tab.id === activeTab)?.label || 'Issued Out'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => changeTab(tab.id)}
                                className={[
                                    'min-h-16 rounded-lg border px-4 py-3 text-left transition',
                                    activeTab === tab.id
                                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                                ].join(' ')}
                            >
                                <span className="block text-sm font-bold">{tab.label}</span>
                                <span className={`mt-1 block text-xs ${activeTab === tab.id ? 'text-blue-100' : 'text-slate-500'}`}>
                                    {tab.description}
                                </span>
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSearchSubmit} className="grid gap-4 xl:grid-cols-[minmax(280px,1fr)_auto] xl:items-end">
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                                type="search"
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Find person, asset, tag, SKU, or department"
                                className="w-full input-shell sm:w-96"
                            />
                            <button type="submit" className="btn-secondary">
                                Find
                            </button>
                            <button type="button" onClick={clearSearch} className="btn-secondary">
                                Clear
                            </button>
                        </div>

                        <div className="p-3 border rounded-xl border-slate-200 bg-slate-50">
                            <div className="flex flex-col gap-1 mb-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs font-bold tracking-wide uppercase text-slate-500">Report period</p>
                                <p className="text-xs font-semibold text-slate-600">{getPeriodLabel(reportPeriod, customDateStart, customDateEnd)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                {PERIOD_OPTIONS.map((period) => (
                                    <button
                                        key={period.id}
                                        type="button"
                                        onClick={() => changeReportPeriod(period.id)}
                                        className={[
                                            'rounded-lg border px-3 py-2 text-sm font-semibold transition',
                                            reportPeriod === period.id
                                                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100',
                                        ].join(' ')}
                                    >
                                        {period.label}
                                    </button>
                                ))}
                            </div>

                            {reportPeriod === 'custom' ? (
                                <div className="grid gap-2 mt-3 sm:grid-cols-2">
                                    <label className="text-xs font-semibold tracking-wide uppercase text-slate-500">
                                        From
                                        <div className="mt-1">
                                            <DateInput id="assignment-date-start" value={customDateStart} onChange={(value) => changeCustomDate('start', value)} />
                                        </div>
                                    </label>
                                    <label className="text-xs font-semibold tracking-wide uppercase text-slate-500">
                                        To
                                        <div className="mt-1">
                                            <DateInput id="assignment-date-end" value={customDateEnd} onChange={(value) => changeCustomDate('end', value)} />
                                        </div>
                                    </label>
                                </div>
                            ) : null}

                            <div className="grid grid-cols-2 gap-2 mt-3">
                                <button
                                    type="button"
                                    onClick={exportFilteredAssignmentsCsv}
                                    disabled={exporting}
                                    className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {exporting ? 'Exporting...' : 'Export CSV'}
                                </button>
                                <button
                                    type="button"
                                    onClick={exportFilteredAssignmentsPdf}
                                    disabled={exporting}
                                    className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Export PDF
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {(activeTab === 'active' || activeTab === 'returned') ? (
                <section className="space-y-4">
                    <AssignmentDetail assignment={selectedAssignment} onClose={() => setSelectedAssignment(null)} onReturn={requestReturnAsset} />

                    <div className="mobile-card-list">
                        {assignments.length > 0 ? (
                            assignments.map((assignment) => (
                                <AssignmentCard key={assignment.id} assignment={assignment} onOpen={setSelectedAssignment} onReturn={requestReturnAsset} />
                            ))
                        ) : (
                            <div className="px-6 py-10 text-center bg-white border shadow-sm rounded-xl border-slate-200 text-slate-500">
                                No assignments found.
                            </div>
                        )}
                    </div>

                    <div className="desktop-table table-shell">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="table-head">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-left">Asset</th>
                                        <th className="px-6 py-4 font-semibold text-left">Given To</th>
                                        <th className="px-6 py-4 font-semibold text-left">Department</th>
                                        <th className="px-6 py-4 font-semibold text-left">Qty</th>
                                        <th className="px-6 py-4 font-semibold text-left">Date Given</th>
                                        <th className="px-6 py-4 font-semibold text-left">Status</th>
                                        <th className="px-6 py-4 font-semibold text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {assignments.length > 0 ? (
                                        assignments.map((assignment) => (
                                            <tr key={assignment.id} className="table-row">
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-slate-950">{assignment.item?.name || '-'}</p>
                                                    <p className="text-xs text-slate-500">{assignment.item?.asset_tag || assignment.item?.sku || 'No tag'}</p>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-800">{assignment.receiver_name || assignment.user?.name || '-'}</td>
                                                <td className="px-6 py-4 text-slate-700">{assignment.assigned_department?.name || '-'}</td>
                                                <td className="px-6 py-4 text-slate-700">{assignment.quantity || 0} {assignment.item?.unit_of_measurement || 'unit'}</td>
                                                <td className="px-6 py-4 text-slate-700">{formatDateTime(assignment.assigned_at)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadge(assignment.returned_at)}`}>
                                                        {assignment.returned_at ? 'Returned' : 'Issued out'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        <button type="button" onClick={() => setSelectedAssignment(assignment)} className="btn-secondary !px-3 !py-2">
                                                            View
                                                        </button>
                                                        {!assignment.returned_at ? (
                                                            <button type="button" onClick={() => requestReturnAsset(assignment)} className="btn-primary !px-3 !py-2">
                                                                Return Asset
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-10 text-center text-slate-500">
                                                No assignments found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <Pager page={meta.current_page} lastPage={meta.last_page} total={meta.total} onPageChange={(page) => updateQuery({ page })} />
                </section>
            ) : null}

            {activeTab === 'new' ? (
                <section className="panel">
                    <div className="panel-body">
                        <div className="mb-5">
                            <h2 className="section-title">Give Out Asset</h2>
                            <p className="section-subtitle">Choose the item, the person receiving it, their department, and the quantity.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                    <label className="field-label">Item to Give Out</label>
                                <select
                                    value={form.item_id}
                                    onChange={(event) => setForm((prev) => ({ ...prev, item_id: event.target.value }))}
                                    className="w-full input-shell"
                                    required
                                >
                                    <option value="">Choose an available item</option>
                                    {assignableItems.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} | {item.asset_tag || item.sku || 'No tag'} | Available: {item.quantity} {item.unit_of_measurement || 'unit'}
                                        </option>
                                    ))}
                                </select>
                                {assignableItems.length === 0 ? <p className="mt-2 text-xs text-amber-600">No assignable items are currently available.</p> : null}
                            </div>

                            {selectedItem ? (
                                <div className="grid gap-3 p-4 text-sm text-blue-800 border border-blue-200 rounded-xl bg-blue-50 sm:grid-cols-4">
                                    <div>
                                        <p className="text-xs font-semibold text-blue-500 uppercase">Available Now</p>
                                        <p className="text-xl font-bold">{selectedItem.quantity} {selectedItem.unit_of_measurement || 'unit'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-blue-500 uppercase">Giving Out</p>
                                        <p className="text-xl font-bold">{Number.isInteger(requestedQuantity) && requestedQuantity > 0 ? requestedQuantity : 0} {selectedItem.unit_of_measurement || 'unit'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-blue-500 uppercase">Left After Save</p>
                                        <p className="text-xl font-bold">{remainingQuantity} {selectedItem.unit_of_measurement || 'unit'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-blue-500 uppercase">Identifier</p>
                                        <p className="text-xl font-bold">{selectedItem.asset_tag || selectedItem.sku || '-'}</p>
                                    </div>
                                </div>
                            ) : null}

                            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                                <div>
                                    <label className="field-label">Department / Person Receiving</label>
                                    <select
                                        value={form.receiver_id || ''}
                                        onChange={(event) => handleReceiverChange(event.target.value)}
                                        className="w-full input-shell"
                                        required
                                    >
                                        <option value="">Choose department, then person</option>
                                        {receiverOptionsByDepartment.map((group) => (
                                            <optgroup key={group.department} label={group.department}>
                                                {group.options.map((option) => (
                                                    <option key={`${option.id || option.receiver}-${option.department_id}`} value={String(option.id || '')}>
                                                        {option.receiver}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>

                                    {selectedDepartmentOption ? (
                                        <p className="mt-2 text-xs text-slate-500">
                                            Department connected: {selectedDepartmentOption.department_name}
                                        </p>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="field-label">Quantity to Give</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={selectedItem ? maxQuantity : undefined}
                                        step="1"
                                        value={form.quantity}
                                        onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
                                        className="w-full input-shell"
                                        disabled={!selectedItem}
                                        required
                                    />
                                    {quantityErrorMessage ? <p className="mt-2 text-xs text-red-600">{quantityErrorMessage}</p> : null}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <button type="submit" disabled={!canSubmit} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
                                    {submitting ? 'Saving...' : 'Save Assignment'}
                                </button>
                                <button type="button" onClick={() => setForm(defaultForm())} className="btn-secondary">
                                    Clear Form
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            ) : null}

            {activeTab === 'receivers' ? (
                <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
                    <div className="panel">
                        <div className="panel-body">
                            <h2 className="section-title">Departments and Receivers</h2>
                            <p className="section-subtitle">Click a receiver under their department to open the statement.</p>
                            <div className="mt-4 space-y-2">
                                {report.receivers.map((receiver) => (
                                    <button
                                        key={receiver.key || receiver.receiver}
                                        type="button"
                                        onClick={() => {
                                            setSelectedReceiver(receiver.key || receiver.receiver);
                                            setReceiverPage(1);
                                        }}
                                        className={[
                                            'w-full rounded-lg border px-4 py-3 text-left transition',
                                            (selectedReceiverDetail?.key || selectedReceiverDetail?.receiver) === (receiver.key || receiver.receiver)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 bg-white hover:bg-slate-50',
                                        ].join(' ')}
                                    >
                                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{receiver.department || 'No department'}</p>
                                        <p className="font-semibold text-slate-950">{receiver.receiver}</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {receiver.active_quantity} active | {receiver.returned_quantity} returned
                                        </p>
                                    </button>
                                ))}
                                {!reportLoading && report.receivers.length === 0 ? (
                                    <p className="px-4 py-6 text-sm text-center rounded-lg bg-slate-50 text-slate-500">No receivers found.</p>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="panel">
                        <div className="space-y-4 panel-body">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="section-title">{selectedReceiverDetail?.receiver || 'Receiver Statement'}</h2>
                                    <p className="section-subtitle">
                                        {selectedReceiverDetail?.department ? `${selectedReceiverDetail.department} department | ` : ''}
                                        Assigned, returned, and remaining stock for this receiver.
                                    </p>
                                </div>
                                <button type="button" onClick={exportReceiverCsv} disabled={!selectedReceiverDetail} className="btn-secondary disabled:opacity-50">
                                    Export CSV
                                </button>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="metric-card">
                                    <p className="text-xs font-semibold uppercase text-slate-500">Active Qty</p>
                                    <p className="mt-1 text-2xl font-bold text-emerald-700">{selectedReceiverDetail?.active_quantity || 0}</p>
                                </div>
                                <div className="metric-card">
                                    <p className="text-xs font-semibold uppercase text-slate-500">Returned Qty</p>
                                    <p className="mt-1 text-2xl font-bold text-slate-950">{selectedReceiverDetail?.returned_quantity || 0}</p>
                                </div>
                                <div className="metric-card">
                                    <p className="text-xs font-semibold uppercase text-slate-500">Total Qty</p>
                                    <p className="mt-1 text-2xl font-bold text-blue-700">{selectedReceiverDetail?.total_quantity || 0}</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="table-head">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-left">Item</th>
                                            <th className="px-4 py-3 font-semibold text-left">Department</th>
                                            <th className="px-4 py-3 font-semibold text-left">Assigned</th>
                                            <th className="px-4 py-3 font-semibold text-left">Returned</th>
                                            <th className="px-4 py-3 font-semibold text-left">Remaining</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {pagedReceiverItems.map((item) => (
                                            <tr key={`${item.item_id}-${item.department}`} className="table-row">
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-slate-950">{item.item_name}</p>
                                                    <p className="text-xs text-slate-500">{item.asset_tag || item.sku || '-'}</p>
                                                </td>
                                                <td className="px-4 py-3 text-slate-700">{item.department || '-'}</td>
                                                <td className="px-4 py-3 text-slate-700">{item.quantity_assigned} {item.unit_of_measurement || 'unit'}</td>
                                                <td className="px-4 py-3 text-slate-700">{item.quantity_returned} {item.unit_of_measurement || 'unit'}</td>
                                                <td className="px-4 py-3 font-semibold text-slate-950">{item.quantity_remaining} {item.unit_of_measurement || 'unit'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <Pager page={receiverPage} lastPage={receiverLastPage} total={selectedReceiverDetail?.items?.length || 0} onPageChange={setReceiverPage} />
                        </div>
                    </div>
                </section>
            ) : null}

            {activeTab === 'stock' ? (
                <section className="panel">
                    <div className="space-y-4 panel-body">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="section-title">Stock Position</h2>
                                <p className="section-subtitle">Live quantity split between store stock and assigned stock.</p>
                            </div>
                            <button type="button" onClick={exportStockCsv} className="btn-secondary">
                                Export CSV
                            </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="metric-card">
                                <p className="text-xs font-semibold uppercase text-slate-500">Available</p>
                                <p className="mt-1 text-2xl font-bold text-emerald-700">{reportTotals.available}</p>
                            </div>
                            <div className="metric-card">
                                <p className="text-xs font-semibold uppercase text-slate-500">Assigned</p>
                                <p className="mt-1 text-2xl font-bold text-blue-700">{reportTotals.assigned}</p>
                            </div>
                            <div className="metric-card">
                                <p className="text-xs font-semibold uppercase text-slate-500">Managed</p>
                                <p className="mt-1 text-2xl font-bold text-slate-950">{reportTotals.managed}</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="table-head">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-left">Item</th>
                                        <th className="px-4 py-3 font-semibold text-left">Available</th>
                                        <th className="px-4 py-3 font-semibold text-left">Assigned</th>
                                        <th className="px-4 py-3 font-semibold text-left">Managed</th>
                                        <th className="px-4 py-3 font-semibold text-left">State</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pagedStockItems.map((item) => (
                                        <tr key={item.id} className="table-row">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-slate-950">{item.name}</p>
                                                <p className="text-xs text-slate-500">{item.asset_tag || item.sku || '-'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">{item.available_quantity} {item.unit_of_measurement || 'unit'}</td>
                                            <td className="px-4 py-3 text-slate-700">{item.active_assigned_quantity} {item.unit_of_measurement || 'unit'}</td>
                                            <td className="px-4 py-3 text-slate-700">{item.managed_quantity} {item.unit_of_measurement || 'unit'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${stockBadge(item.stock_state)}`}>
                                                    {item.stock_state}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Pager page={stockPage} lastPage={stockLastPage} total={report.items.length} onPageChange={setStockPage} />
                    </div>
                </section>
            ) : null}

            {activeTab === 'history' ? (
                <section className="panel">
                    <div className="space-y-4 panel-body">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="section-title">Assignment History</h2>
                                <p className="section-subtitle">Audit-friendly movement history with receiver, quantity, department, and status.</p>
                            </div>
                            <button type="button" onClick={exportHistoryCsv} className="btn-secondary">
                                Export CSV
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="table-head">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-left">Item</th>
                                        <th className="px-4 py-3 font-semibold text-left">Receiver</th>
                                        <th className="px-4 py-3 font-semibold text-left">Date / Time</th>
                                        <th className="px-4 py-3 font-semibold text-left">Qty</th>
                                        <th className="px-4 py-3 font-semibold text-left">Status</th>
                                        <th className="px-4 py-3 font-semibold text-left">Department</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pagedHistoryItems.map((entry) => (
                                        <tr key={entry.id} className="table-row">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-slate-950">{entry.item_name}</p>
                                                <p className="text-xs text-slate-500">{entry.asset_tag || entry.sku || '-'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">{entry.receiver}</td>
                                            <td className="px-4 py-3 text-slate-700">{formatDateTime(entry.assigned_at)}</td>
                                            <td className="px-4 py-3 text-slate-700">{entry.quantity} {entry.unit_of_measurement || 'unit'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${entry.status === 'Returned' ? statusBadge(true) : statusBadge(false)}`}>
                                                    {entry.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">{entry.department || '-'}</td>
                                        </tr>
                                    ))}
                                    {!reportLoading && report.history.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                                                No assignment history found.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>

                        <Pager page={historyPage} lastPage={historyLastPage} total={report.history.length} onPageChange={setHistoryPage} />
                    </div>
                </section>
            ) : null}

            {returnTarget ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/45">
                    <div className="w-full max-w-lg p-6 bg-white border shadow-2xl rounded-2xl border-slate-200">
                        <div className="flex flex-col gap-1">
                            <p className="text-xs font-bold tracking-wide text-blue-600 uppercase">Confirm Return</p>
                            <h2 className="text-xl font-bold text-slate-950">Return this asset to stock?</h2>
                            <p className="text-sm text-slate-500">
                                This will close the assignment and add the quantity back to available stock.
                            </p>
                        </div>

                        <div className="grid gap-3 p-4 mt-5 text-sm border rounded-xl border-slate-200 bg-slate-50 sm:grid-cols-2">
                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-500">Asset</p>
                                <p className="mt-1 font-semibold text-slate-950">{returnTarget.item?.name || '-'}</p>
                                <p className="text-xs text-slate-500">{returnTarget.item?.asset_tag || returnTarget.item?.sku || 'No tag'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-500">Receiver</p>
                                <p className="mt-1 font-semibold text-slate-950">{returnTarget.receiver_name || returnTarget.user?.name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-500">Quantity</p>
                                <p className="mt-1 font-semibold text-slate-950">{returnTarget.quantity || 0} {returnTarget.item?.unit_of_measurement || 'unit'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-500">Date Given</p>
                                <p className="mt-1 font-semibold text-slate-950">{formatDateTime(returnTarget.assigned_at)}</p>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-2 mt-6 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setReturnTarget(null)}
                                disabled={Boolean(returningId)}
                                className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmReturnAsset}
                                disabled={Boolean(returningId)}
                                className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {returningId ? 'Returning...' : 'Confirm Return'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
