import React from 'react';

export function Button({
    type = 'button',
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    isLoading = false,
    children,
    ...props
}) {
    const baseClasses =
        'font-medium rounded-lg transition inline-flex items-center justify-center gap-2 focus:outline-none';

    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400',
        secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 disabled:bg-slate-100',
        danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400',
        ghost: 'text-slate-600 hover:bg-slate-100 disabled:text-slate-400',
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            type={type}
            disabled={disabled || isLoading}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            {...props}
        >
            {isLoading && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
}

export function IconButton({ icon, label, ...props }) {
    return (
        <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            title={label}
            {...props}
        >
            {icon}
        </button>
    );
}
