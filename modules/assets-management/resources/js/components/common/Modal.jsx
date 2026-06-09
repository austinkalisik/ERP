import React from 'react';
import { Button } from './Button';

export function Modal({ isOpen, title, children, onClose, footer, size = 'md' }) {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'w-full max-w-md',
        md: 'w-full max-w-lg',
        lg: 'w-full max-w-2xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 transition"
                onClick={onClose}
                role="button"
                tabIndex={0}
            />

            {/* Modal */}
            <div className={`relative z-10 rounded-lg bg-white shadow-lg ${sizeClasses[size]}`}>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4">{children}</div>

                {/* Footer */}
                {footer && <div className="border-t border-slate-200 px-6 py-4">{footer}</div>}
            </div>
        </div>
    );
}

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, isDanger = false }) {
    return (
        <Modal isOpen={isOpen} title={title} onClose={onCancel} size="sm">
            <p className="text-slate-600">{message}</p>
            <div className="mt-6 flex gap-3">
                <Button variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant={isDanger ? 'danger' : 'primary'} onClick={onConfirm}>
                    Confirm
                </Button>
            </div>
        </Modal>
    );
}
