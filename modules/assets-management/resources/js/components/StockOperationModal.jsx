import React, { useState } from 'react';
import Modal from './common/Modal';
import { Button } from './common';
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setForm({
            quantity: '',
            reference_no: '',
            supplier_id: '',
            notes: '',
        });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            let endpoint = '';
            const payload = {
                quantity: parseInt(form.quantity),
                reference_no: form.reference_no || undefined,
                supplier_id: form.supplier_id || undefined,
                notes: form.notes || undefined,
            };

            switch (activeTab) {
                case 'in':
                    endpoint = `/items/${item.id}/stock-in`;
                    break;
                case 'out':
                    endpoint = `/items/${item.id}/stock-out`;
                    break;
                case 'adjustment':
                    endpoint = `/items/${item.id}/stock-adjustment`;
                    break;
                default:
                    throw new Error('Invalid operation');
            }

            await apiClient.post(endpoint, payload);

            setSuccess(`Stock ${activeTab === 'in' ? 'received' : activeTab === 'out' ? 'issued' : 'adjusted'} successfully!`);
            resetForm();
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1500);
        } catch (err) {
            setError(err?.response?.data?.message || `Failed to perform stock ${activeTab}`);
        } finally {
            setLoading(false);
        }
    };

    if (!item) return null;

    const operationLabels = {
        in: 'Stock In (Receipt)',
        out: 'Stock Out (Issue)',
        adjustment: 'Stock Adjustment',
    };

    const operationDescriptions = {
        in: 'Record new stock received from supplier',
        out: 'Record stock issued to department',
        adjustment: 'Adjust stock for counts/corrections',
    };

    const currentQuantity = item.quantity || 0;
    const reorderLevel = item.reorder_level || 5;
    const isLowStock = currentQuantity <= reorderLevel;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Stock Operations - ${item.name}`} maxWidth="md">
            <div className="p-6">
                {/* Item Info */}
                <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-medium text-slate-500">SKU</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{item.sku}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500">Current Qty</p>
                            <p className={`mt-1 text-sm font-semibold ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                                {currentQuantity} {isLowStock && <span className="text-xs">⚠️ Low Stock</span>}
                            </p>
                        </div>
                        {item.brand && (
                            <div>
                                <p className="text-xs font-medium text-slate-500">Brand</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{item.brand}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-medium text-slate-500">Unit Cost</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">${item.unit_cost || '0.00'}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-2 border-b border-slate-200">
                    {['in', 'out', 'adjustment'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                resetForm();
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

                {/* Operation Description */}
                <div className="mb-6">
                    <p className="text-sm text-slate-600">{operationDescriptions[activeTab]}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Quantity *
                        </label>
                        <input
                            type="number"
                            name="quantity"
                            value={form.quantity}
                            onChange={handleChange}
                            min="1"
                            required
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0"
                        />
                        {activeTab === 'adjustment' && (
                            <p className="mt-1 text-xs text-slate-500">
                                Enter the adjustment quantity (can be positive or negative)
                            </p>
                        )}
                    </div>

                    {/* Reference No */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Reference No
                        </label>
                        <input
                            type="text"
                            name="reference_no"
                            value={form.reference_no}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g. PO-2024-001 or DO-2024-001"
                        />
                    </div>

                    {/* Supplier (only for Stock In) */}
                    {activeTab === 'in' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Supplier
                            </label>
                            <input
                                type="text"
                                name="supplier_id"
                                value={form.supplier_id}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Supplier ID or name"
                            />
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Notes {activeTab === 'adjustment' && '*'}
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

                    {/* Error Message */}
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                            <p className="text-sm text-green-700">{success}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-6 flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-400"
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
