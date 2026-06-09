import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../api/client';
import { downloadCsv } from '../utils/csv';
import { fetchFilteredExportRows } from '../utils/exportData';

function formatDateTime(value) {
    if (!value) {
        return 'N/A';
    }

    return new Date(value).toLocaleString();
}

function actionLabel(value) {
    return value ? value.replace('_', ' ') : '';
}

function getLogRows(logs) {
    return logs.map((log) => ({
        Date: formatDateTime(log.created_at),
        Action: actionLabel(log.action),
        Item: log.item?.name || 'N/A',
        User: log.user?.name || 'System',
        Notes: log.notes || '',
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

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [action, setAction] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const actionOptions = useMemo(
        () => ['created', 'updated', 'deleted', 'assigned', 'returned', 'stock_in', 'stock_out'],
        []
    );

    const filterParams = useMemo(
        () => ({
            search: search || undefined,
            action: action || undefined,
        }),
        [action, search]
    );

    async function loadLogs(nextPage = page) {
        try {
            setLoading(true);
            setError('');

            const response = await apiClient.get('/activity-logs', {
                params: {
                    per_page: 20,
                    page: nextPage,
                    ...filterParams,
                },
            });

            setLogs(response.data.data || []);
            setPage(response.data.current_page || 1);
            setLastPage(response.data.last_page || 1);
        } catch (error) {
            console.error('Failed to load activity logs', error);
            setError('Failed to load activity logs.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadLogs(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, action]);

    async function getFilteredLogsForExport() {
        return fetchFilteredExportRows('/activity-logs', filterParams);
    }

    async function handleExportCsv() {
        try {
            setExporting(true);
            setError('');

            const exportRows = await getFilteredLogsForExport();
            downloadCsv('activity-logs.csv', getLogRows(exportRows));
        } catch (error) {
            console.error('Failed to export activity logs', error);
            setError('Failed to export activity logs.');
        } finally {
            setExporting(false);
        }
    }

    async function handleExportPdf() {
        try {
            setExporting(true);
            setError('');

            const exportRows = getLogRows(await getFilteredLogsForExport());
            const filterSummary = [
                search ? `Search: ${search}` : 'Search: All',
                action ? `Action: ${actionLabel(action)}` : 'Action: All',
            ].join(' | ');

            const rowsHtml = exportRows.length
                ? exportRows.map((row) => `
                    <tr>
                        <td>${escapeHtml(row.Date)}</td>
                        <td>${escapeHtml(row.Action)}</td>
                        <td>${escapeHtml(row.Item)}</td>
                        <td>${escapeHtml(row.User)}</td>
                        <td>${escapeHtml(row.Notes)}</td>
                    </tr>
                `).join('')
                : '<tr><td colspan="5">No activity logs found.</td></tr>';

            const printWindow = window.open('', '_blank');

            if (!printWindow) {
                setError('Allow pop-ups to export the PDF.');
                return;
            }

            printWindow.document.write(`
                <!doctype html>
                <html>
                    <head>
                        <title>Activity Logs</title>
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
                        <h1>Activity Logs</h1>
                        <p>${escapeHtml(filterSummary)}</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Action</th>
                                    <th>Item</th>
                                    <th>User</th>
                                    <th>Notes</th>
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
        } catch (error) {
            console.error('Failed to export activity logs PDF', error);
            setError('Failed to export activity logs PDF.');
        } finally {
            setExporting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Activity Logs</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Audit trail of asset actions, stock operations, and assignment changes.
                    </p>
                </div>
            </div>

            {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            ) : null}

            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by action, item, user, or notes"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 transition focus:ring"
                />

                <select
                    value={action}
                    onChange={(event) => setAction(event.target.value)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 transition focus:ring"
                >
                    <option value="">All actions</option>
                    {actionOptions.map((option) => (
                        <option key={option} value={option}>
                            {actionLabel(option)}
                        </option>
                    ))}
                </select>

                <button type="button" onClick={() => void loadLogs(1)} className="btn-secondary">
                    Refresh
                </button>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        disabled={exporting}
                        className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {exporting ? 'Exporting...' : 'CSV'}
                    </button>
                    <button
                        type="button"
                        onClick={handleExportPdf}
                        disabled={exporting}
                        className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        PDF
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                    <div className="px-6 py-10 text-center text-slate-500">Loading activity logs...</div>
                ) : logs.length === 0 ? (
                    <div className="px-6 py-10 text-center text-slate-500">No activity logs found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Item</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-700">User</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/70">
                                        <td className="px-4 py-3 text-slate-600">{formatDateTime(log.created_at)}</td>
                                        <td className="px-4 py-3 font-medium text-slate-900">{log.action}</td>
                                        <td className="px-4 py-3 text-slate-700">{log.item?.name || 'N/A'}</td>
                                        <td className="px-4 py-3 text-slate-700">{log.user?.name || 'System'}</td>
                                        <td className="px-4 py-3 text-slate-600">{log.notes || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => void loadLogs(page - 1)}
                    className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Previous
                </button>

                <span className="text-sm text-slate-600">
                    Page {page} of {lastPage}
                </span>

                <button
                    type="button"
                    disabled={page >= lastPage || loading}
                    onClick={() => void loadLogs(page + 1)}
                    className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
