import React from 'react';
import { Button } from './Button';

export function Table({ columns, data, loading = false, onEdit, onDelete }) {
    if (loading) {
        return (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
                <div className="inline-flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></div>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
                <p className="text-slate-500">No records found</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
                            >
                                {col.label}
                            </th>
                        ))}
                        {(onEdit || onDelete) && <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-slate-100 hover:bg-slate-50">
                            {columns.map((col) => (
                                <td
                                    key={col.key}
                                    className="px-4 py-3 text-sm"
                                >
                                    {col.render ? col.render(row) : String(row[col.key] ?? '-')}
                                </td>
                            ))}
                            {(onEdit || onDelete) && (
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {onEdit && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEdit(row)}
                                            >
                                                Edit
                                            </Button>
                                        )}
                                        {onDelete && (
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => onDelete(row)}
                                            >
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function Pagination({ currentPage, lastPage, onPageChange }) {
    return (
        <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
                Page {currentPage} of {lastPage}
            </p>
            <div className="flex gap-2">
                <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    Previous
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === lastPage}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
