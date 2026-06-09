import React from 'react';

export function Input({ label, error, required = false, ...props }) {
    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-slate-700">
                    {label}
                    {required && <span className="text-red-600">*</span>}
                </label>
            )}
            <input
                className={`w-full rounded-lg border px-3 py-2 text-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
                }`}
                {...props}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

export function Select({ label, options, error, required = false, ...props }) {
    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-slate-700">
                    {label}
                    {required && <span className="text-red-600">*</span>}
                </label>
            )}
            <select
                className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
                }`}
                {...props}
            >
                <option value="">Select an option</option>
                {options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

export function Textarea({ label, error, required = false, ...props }) {
    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-slate-700">
                    {label}
                    {required && <span className="text-red-600">*</span>}
                </label>
            )}
            <textarea
                className={`w-full rounded-lg border px-3 py-2 text-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
                }`}
                {...props}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

export function Checkbox({ label, error, ...props }) {
    return (
        <div className="space-y-1">
            <label className="flex items-center gap-2">
                <input
                    type="checkbox"
                    className={`rounded border-slate-200 text-blue-600 transition focus:ring-2 focus:ring-blue-500 ${
                        error ? 'border-red-300' : 'border-slate-300'
                    }`}
                    {...props}
                />
                <span className="text-sm text-slate-700">{label}</span>
            </label>
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

export function FormGroup({ children, columns = 1 }) {
    return (
        <div
            className="grid gap-4"
            style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
        >
            {children}
        </div>
    );
}
