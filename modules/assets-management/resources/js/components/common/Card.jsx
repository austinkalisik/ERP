import React from 'react';

export function Card({ title, subtitle, children, className = '' }) {
    return (
        <div className={`rounded-lg border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
            {(title || subtitle) && (
                <div className="mb-4">
                    {title && <h3 className="font-semibold text-slate-900">{title}</h3>}
                    {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
                </div>
            )}
            {children}
        </div>
    );
}

export function DashboardCard({ label, value, icon, gradient = 'from-blue-500 to-blue-600' }) {
    return (
        <div className={`rounded-lg bg-gradient-to-br ${gradient} p-6 text-white shadow-sm`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium opacity-90">{label}</p>
                    <p className="mt-2 text-3xl font-bold">{value}</p>
                </div>
                {icon && <div className="text-white/20">{icon}</div>}
            </div>
        </div>
    );
}

export function Badge({ label, variant = 'default', size = 'md' }) {
    const variantClasses = {
        default: 'bg-slate-100 text-slate-800',
        primary: 'bg-blue-100 text-blue-800',
        success: 'bg-emerald-100 text-emerald-800',
        warning: 'bg-amber-100 text-amber-800',
        error: 'bg-red-100 text-red-800',
    };

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base',
    };

    return (
        <span className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}>
            {label}
        </span>
    );
}

export function Alert({ title, message, variant = 'info', onClose }) {
    const variantClasses = {
        info: 'border-blue-200 bg-blue-50 text-blue-800',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        warning: 'border-amber-200 bg-amber-50 text-amber-800',
        error: 'border-red-200 bg-red-50 text-red-800',
    };

    return (
        <div className={`rounded-lg border px-4 py-3 ${variantClasses[variant]}`}>
            <div className="flex items-start justify-between">
                <div>
                    {title && <p className="font-semibold">{title}</p>}
                    {message && <p className="mt-1 text-sm">{message}</p>}
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-current opacity-50 hover:opacity-75"
                    >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

export function PageHeader({ title, subtitle, action }) {
    return (
        <div className="mb-6 flex items-end justify-between">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
                {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

export function SearchBar({ value, onChange, placeholder = 'Search...', onSubmit }) {
    return (
        <form
            className="flex gap-2"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit?.();
            }}
        >
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
                Search
            </button>
        </form>
    );
}

export function EmptyState({ title, description, action }) {
    return (
        <div className="rounded-lg border-2 border-dashed border-slate-200 p-12 text-center">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description && <p className="mt-1 text-slate-600">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center py-12">
            <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                <p className="mt-4 text-slate-600">Loading...</p>
            </div>
        </div>
    );
}
