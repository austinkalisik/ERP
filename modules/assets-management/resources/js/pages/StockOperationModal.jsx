// file: resources/js/components/StockOperationModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Modal from './common/Modal';
import apiClient from '../api/client';

export default function StockOperationModal({ isOpen, onClose, item, onSuccess }) {
    const [activeTab, setActiveTab] = useState('in');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState({
        quantity: '',
        reference_no: '',
        supplier_id: '',
        notes: '',
    });

    useEffect(() => {
        if (!isOpen) {
            setActiveTab('in');
            setForm({
                quantity: '',
                reference_no: '',
                supplier_id: '',
                notes: '',
            });
            setError('');
            setSuccess('');
            setLoading(false);
            return;
        }

        setError('');
        setSuccess('');
        setLoading(false);
        setForm({
            quantity: '',
            reference_no: '',
            supplier_id: item?.supplier_id ? String(item.supplier_id) : '',
            notes: '',
        });
    }, [isOpen, item]);

    const currentQuantity = Number(item?.quantity || 0);
    const reorderLevel = Number(item?.reorder_level || 5);
    const isLowStock = currentQuantity > 0 && currentQuantity <= reorderLevel;

    const operationLabels = useMemo(
        () => ({
            in: 'Stock In (Receipt)',
            out: 'Stock Out (Issue)',
            adjustment: 'Stock Adjustment',
        }),
        []
    );

    const operationDescriptions = useMemo(
        () => ({
            in: 'Record new stock received from supplier.',
            out: 'Record stock issued or removed from available inventory.',
            adjustment: 'Adjust stock up or down after a count or correction.',
        }),
        []
    );

    const quantityPlaceholder = activeTab === 'adjustment' ? 'Use negative value to reduce stock' : '0';

    const canSubmit =
        !loading &&
        item &&
        form.quantity !== '' &&
        Number.isInteger(Number(form.quantity)) &&
        Number(form.quantity) !== 0 &&
        (activeTab !== 'out' || Number(form.quantity) <= currentQuantity) &&
        (activeTab !== 'adjustment' || form.notes.trim().length > 0);

    function resetMessages() {
        setError('');
        setSuccess('');
    }

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        resetMessages();
        setLoading(true);

        try {
            let endpoint = '';

            if (!item?.id) {
                throw new Error('No item selected.');
            }

            if (activeTab === 'in') {
                endpoint = `/items/${item.id}/stock-in`;
            } else if (activeTab === 'out') {
                endpoint = `/items/${item.id}/stock-out`;
            } else if (activeTab === 'adjustment') {
                endpoint = `/items/${item.id}/stock-adjustment`;
            } else {
                throw new Error('Invalid stock operation.');
            }

            const parsedQuantity = Number.parseInt(form.quantity, 10);

            if (!Number.isInteger(parsedQuantity) || parsedQuantity === 0) {
                throw new Error('Enter a valid quantity.');
            }

            if (activeTab === 'out' && parsedQuantity > currentQuantity) {
                throw new Error('Stock out quantity cannot be more than available stock.');
            }

            const payload = {
                quantity: parsedQuantity,
                reference_no: form.reference_no.trim() || undefined,
                notes: form.notes.trim() || undefined,
            };

            if (activeTab === 'in') {
                const supplierId = Number.parseInt(form.supplier_id, 10);

                if (Number.isInteger(supplierId) && supplierId > 0) {
                    payload.supplier_id = supplierId;
                } else if (item?.supplier_id) {
                    payload.supplier_id = item.supplier_id;
                }
            }

            await apiClient.post(endpoint, payload);

            setSuccess(
                activeTab === 'in'
                    ? 'Stock received successfully.'
                    : activeTab === 'out'
                      ? 'Stock issued successfully.'
                      : 'Stock adjusted successfully.'
            );

            await onSuccess?.();

            setTimeout(() => {
                onClose?.();
            }, 700);
        } catch (err) {
            setError(err?.response?.data?.message || err.message || `Failed to perform stock ${activeTab}.`);
        } finally {
            setLoading(false);
        }
    }

    if (!item) {
        return null;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Stock Operations - ${item.name}`} maxWidth="md">
            <div className="p-6">
                <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-medium text-slate-500">SKU</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{item.sku || '-'}</p>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-500">Current Qty</p>
                            <p className={`mt-1 text-sm font-semibold ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                                {currentQuantity} {item.unit_of_measurement || 'unit'} {isLowStock ? <span className="text-xs">Low Stock</span> : null}
                            </p>
                        </div>

                        {item.brand ? (
                            <div>
                                <p className="text-xs font-medium text-slate-500">Brand</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{item.brand}</p>
                            </div>
                        ) : null}

                        <div>
                            <p className="text-xs font-medium text-slate-500">Unit Cost</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                {new Intl.NumberFormat('en-PG', {
                                    style: 'currency',
                                    currency: 'PGK',
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                }).format(Number(item.unit_cost || 0))}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mb-6 flex gap-2 border-b border-slate-200">
                    {['in', 'out', 'adjustment'].map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => {
                                setActiveTab(tab);
                                setForm((prev) => ({
                                    ...prev,
                                    quantity: '',
                                    reference_no: '',
                                    notes: '',
                                }));
                                resetMessages();
                            }}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                                activeTab === tab
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {tab === 'in' ? 'Receive' : tab === 'out' ? 'Issue' : 'Adjust'}
                        </button>
                    ))}
                </div>

                <div className="mb-6">
                    <p className="text-sm text-slate-600">{operationDescriptions[activeTab]}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Quantity ({item.unit_of_measurement || 'unit'}) *</label>
                        <input
                            type="number"
                            name="quantity"
                            value={form.quantity}
                            onChange={handleChange}
                            min={activeTab === 'adjustment' ? undefined : '1'}
                            required
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={quantityPlaceholder}
                        />
                        {activeTab === 'adjustment' ? (
                            <p className="mt-1 text-xs text-slate-500">
                                Use a positive number to increase stock or a negative number to reduce stock.
                            </p>
                        ) : null}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Reference No</label>
                        <input
                            type="text"
                            name="reference_no"
                            value={form.reference_no}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g. PO-2024-001 or DO-2024-001"
                        />
                    </div>

                    {activeTab === 'in' ? (
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Supplier ID</label>
                            <input
                                type="number"
                                name="supplier_id"
                                value={form.supplier_id}
                                onChange={handleChange}
                                min="1"
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Optional supplier ID"
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Leave blank to use the current asset supplier.
                            </p>
                        </div>
                    ) : null}

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Notes {activeTab === 'adjustment' ? '*' : ''}
                        </label>
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            rows="3"
                            required={activeTab === 'adjustment'}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={
                                activeTab === 'adjustment'
                                    ? 'Reason for adjustment (required)'
                                    : 'Additional notes...'
                            }
                        />
                    </div>

                    {error ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    ) : null}

                    {success ? (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                            <p className="text-sm text-green-700">{success}</p>
                        </div>
                    ) : null}

                    <div className="mt-6 flex gap-3">
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            {loading ? 'Processing...' : operationLabels[activeTab]}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
