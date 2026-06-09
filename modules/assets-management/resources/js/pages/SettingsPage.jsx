import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../api/client';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

const SETTING_GROUPS = [
    {
        title: 'Organization',
        description: 'Names and contact details officers see across the system.',
        keys: ['system_name', 'system_tagline', 'company_name', 'company_website', 'support_email'],
    },
    {
        title: 'Operations',
        description: 'Default limits used by inventory, assignments, and lists.',
        keys: ['low_stock_threshold', 'assignment_overdue_days', 'items_per_page'],
    },
    {
        title: 'Feature Controls',
        description: 'Turn common workflow features on or off.',
        keys: ['email_notifications_enabled', 'maintenance_alerts_enabled', 'allow_user_impersonation'],
    },
];

const LABELS = {
    system_name: 'System Name',
    system_tagline: 'System Tagline',
    company_name: 'Company Name',
    company_website: 'Company Website',
    support_email: 'Support Email',
    low_stock_threshold: 'Low Stock Threshold',
    assignment_overdue_days: 'Assignment Overdue Days',
    items_per_page: 'Items Per Page',
    email_notifications_enabled: 'Email Notifications',
    maintenance_alerts_enabled: 'Maintenance Alerts',
    allow_user_impersonation: 'Switch User Access',
};

const HELP_TEXT = {
    low_stock_threshold: 'Items at or below this quantity appear as low stock.',
    assignment_overdue_days: 'Assignments older than this number of days are treated as overdue.',
    items_per_page: 'Default number of records shown in paginated office lists.',
    email_notifications_enabled: 'Sends email copies of system notifications to users when mail is configured.',
    maintenance_alerts_enabled: 'Creates maintenance-related alerts when assets are moved into maintenance.',
    allow_user_impersonation: 'Allows admins to switch into another user account for support.',
};

function isToggle(key) {
    return ['email_notifications_enabled', 'maintenance_alerts_enabled', 'allow_user_impersonation'].includes(key);
}

function isNumberSetting(key) {
    return ['low_stock_threshold', 'assignment_overdue_days', 'items_per_page'].includes(key);
}

function initials(name) {
    return (name || 'SA')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function AvatarPreview({ user, previewUrl }) {
    const imageUrl = previewUrl || user?.profile_photo_url || '';

    if (imageUrl) {
        return <img src={imageUrl} alt={user?.name || 'Profile'} className="h-20 w-20 rounded-lg object-cover ring-4 ring-slate-100" />;
    }

    return (
        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-900 text-lg font-bold text-white ring-4 ring-slate-100">
            {initials(user?.name)}
        </div>
    );
}

function LogoPreview({ settings, previewUrl }) {
    const imageUrl = previewUrl || settings?.system_logo_url || '';

    if (imageUrl) {
        return <img src={imageUrl} alt={settings?.system_name || 'System Logo'} className="h-20 w-20 rounded-lg bg-white object-contain p-2 ring-4 ring-slate-100" />;
    }

    return (
        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white ring-4 ring-slate-100">
            LOGO
        </div>
    );
}

function ToggleField({ checked, onChange, label, description }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:bg-white"
        >
            <span>
                <span className="block text-sm font-semibold text-slate-900">{label}</span>
                {description ? <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span> : null}
            </span>
            <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}>
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? 'left-6' : 'left-1'}`} />
            </span>
        </button>
    );
}

function UploadPanel({
    title,
    description,
    preview,
    primaryText,
    secondaryText,
    accept,
    onChange,
    onUpload,
    onRemove,
    disabled,
    canRemove,
    success,
    error,
}) {
    return (
        <div className="panel">
            <div className="panel-body">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h2 className="section-title">{title}</h2>
                        <p className="section-subtitle">{description}</p>
                    </div>
                    {preview}
                </div>

                <div className="mt-5">
                    <label className="field-label">Choose Image</label>
                    <input
                        type="file"
                        accept={accept}
                        onChange={onChange}
                        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
                    />
                    <p className="mt-2 text-xs text-slate-400">Use a clear square image. Maximum file size is 2MB.</p>
                </div>

                {success ? <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
                {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <button type="button" onClick={onUpload} disabled={disabled} className="btn-primary disabled:opacity-60">
                        {primaryText}
                    </button>
                    <button type="button" onClick={onRemove} disabled={disabled || !canRemove} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60">
                        {secondaryText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const { settings, refreshSettings } = useSettings();
    const { user, refreshUser } = useAuth();

    const [form, setForm] = useState(settings);
    const [saving, setSaving] = useState(false);

    const [photoSaving, setPhotoSaving] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [photoError, setPhotoError] = useState('');
    const [photoSuccess, setPhotoSuccess] = useState('');

    const [logoSaving, setLogoSaving] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [logoError, setLogoError] = useState('');
    const [logoSuccess, setLogoSuccess] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        setForm(settings);
    }, [settings]);

    useEffect(() => {
        return () => {
            if (photoPreview) {
                URL.revokeObjectURL(photoPreview);
            }

            if (logoPreview) {
                URL.revokeObjectURL(logoPreview);
            }
        };
    }, [photoPreview, logoPreview]);

    const groups = useMemo(
        () =>
            SETTING_GROUPS.map((group) => ({
                ...group,
                entries: group.keys.map((key) => ({
                    key,
                    label: LABELS[key] || key,
                    value: form[key] ?? '',
                    help: HELP_TEXT[key] || '',
                })),
            })),
        [form]
    );

    function updateSetting(key, value) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function handlePhotoChange(event) {
        const file = event.target.files?.[0] || null;

        if (photoPreview) {
            URL.revokeObjectURL(photoPreview);
        }

        setPhotoFile(file);
        setPhotoError('');
        setPhotoSuccess('');
        setPhotoPreview(file ? URL.createObjectURL(file) : '');
    }

    function handleLogoChange(event) {
        const file = event.target.files?.[0] || null;

        if (logoPreview) {
            URL.revokeObjectURL(logoPreview);
        }

        setLogoFile(file);
        setLogoError('');
        setLogoSuccess('');
        setLogoPreview(file ? URL.createObjectURL(file) : '');
    }

    async function handleSaveAll() {
        try {
            setSaving(true);
            setError('');
            setSuccess('');

            await Promise.all(
                Object.entries(form)
                    .filter(([key]) => key !== 'system_logo' && key !== 'system_logo_url')
                    .map(([key, value]) => apiClient.put(`/settings/${key}`, { value }))
            );

            await refreshSettings();
            setSuccess('Settings saved successfully.');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    }

    async function handleUploadPhoto() {
        if (!photoFile) {
            setPhotoError('Please choose an image first.');
            return;
        }

        try {
            setPhotoSaving(true);
            setPhotoError('');
            setPhotoSuccess('');

            const payload = new FormData();
            payload.append('name', user?.name || '');
            payload.append('email', user?.email || '');
            payload.append('profile_photo', photoFile);
            payload.append('_method', 'PUT');

            await apiClient.post('/profile', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            await refreshUser();

            if (photoPreview) {
                URL.revokeObjectURL(photoPreview);
            }

            setPhotoFile(null);
            setPhotoPreview('');
            setPhotoSuccess('Profile image updated successfully.');
        } catch (err) {
            setPhotoError(err?.response?.data?.message || 'Failed to upload profile image.');
        } finally {
            setPhotoSaving(false);
        }
    }

    async function handleRemovePhoto() {
        try {
            setPhotoSaving(true);
            setPhotoError('');
            setPhotoSuccess('');

            await apiClient.delete('/profile/photo');
            await refreshUser();

            if (photoPreview) {
                URL.revokeObjectURL(photoPreview);
            }

            setPhotoFile(null);
            setPhotoPreview('');
            setPhotoSuccess('Profile image removed successfully.');
        } catch (err) {
            setPhotoError(err?.response?.data?.message || 'Failed to remove profile image.');
        } finally {
            setPhotoSaving(false);
        }
    }

    async function handleUploadLogo() {
        if (!logoFile) {
            setLogoError('Please choose a logo first.');
            return;
        }

        try {
            setLogoSaving(true);
            setLogoError('');
            setLogoSuccess('');

            const payload = new FormData();
            payload.append('system_logo', logoFile);

            await apiClient.post('/settings/branding/logo', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            await refreshSettings();

            if (logoPreview) {
                URL.revokeObjectURL(logoPreview);
            }

            setLogoFile(null);
            setLogoPreview('');
            setLogoSuccess('System logo updated successfully.');
        } catch (err) {
            setLogoError(err?.response?.data?.message || 'Failed to upload system logo.');
        } finally {
            setLogoSaving(false);
        }
    }

    async function handleRemoveLogo() {
        try {
            setLogoSaving(true);
            setLogoError('');
            setLogoSuccess('');

            await apiClient.delete('/settings/branding/logo');
            await refreshSettings();

            if (logoPreview) {
                URL.revokeObjectURL(logoPreview);
            }

            setLogoFile(null);
            setLogoPreview('');
            setLogoSuccess('System logo removed successfully.');
        } catch (err) {
            setLogoError(err?.response?.data?.message || 'Failed to remove system logo.');
        } finally {
            setLogoSaving(false);
        }
    }

    return (
        <div className="space-y-5">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Keep the office workspace branded, predictable, and ready for daily operations.</p>
                </div>

                <button type="button" onClick={handleSaveAll} disabled={saving} className="btn-primary disabled:opacity-60">
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
            {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

            <div className="grid gap-5 xl:grid-cols-2">
                <UploadPanel
                    title="System Logo"
                    description="Shown in the sidebar and app branding areas."
                    preview={<LogoPreview settings={settings} previewUrl={logoPreview} />}
                    primaryText={logoSaving ? 'Updating...' : 'Update Logo'}
                    secondaryText="Remove Logo"
                    accept=".jpg,.jpeg,.png,.webp,.svg"
                    onChange={handleLogoChange}
                    onUpload={handleUploadLogo}
                    onRemove={handleRemoveLogo}
                    disabled={logoSaving}
                    canRemove={Boolean(settings?.system_logo_url)}
                    success={logoSuccess}
                    error={logoError}
                />

                <UploadPanel
                    title="Officer Profile Image"
                    description="Shown in the header and sidebar for the signed-in user."
                    preview={<AvatarPreview user={user} previewUrl={photoPreview} />}
                    primaryText={photoSaving ? 'Updating...' : 'Update Image'}
                    secondaryText="Remove Image"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handlePhotoChange}
                    onUpload={handleUploadPhoto}
                    onRemove={handleRemovePhoto}
                    disabled={photoSaving}
                    canRemove={Boolean(user?.profile_photo_url)}
                    success={photoSuccess}
                    error={photoError}
                />
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
                {groups.map((group) => (
                    <div key={group.title} className="panel">
                        <div className="panel-body">
                            <div>
                                <h2 className="section-title">{group.title}</h2>
                                <p className="section-subtitle">{group.description}</p>
                            </div>

                            <div className="mt-5 space-y-4">
                                {group.entries.map((entry) => (
                                    <div key={entry.key}>
                                        {isToggle(entry.key) ? (
                                            <ToggleField
                                                label={entry.label}
                                                description={entry.help}
                                                checked={String(entry.value) === '1'}
                                                onChange={(checked) => updateSetting(entry.key, checked ? '1' : '0')}
                                            />
                                        ) : (
                                            <>
                                                <label className="field-label">{entry.label}</label>
                                                <input
                                                    type={entry.key.includes('email') ? 'email' : isNumberSetting(entry.key) ? 'number' : 'text'}
                                                    min={isNumberSetting(entry.key) ? '1' : undefined}
                                                    value={entry.value}
                                                    onChange={(event) => updateSetting(entry.key, event.target.value)}
                                                    className="input-shell w-full"
                                                />
                                                {entry.help ? <p className="mt-2 text-xs leading-5 text-slate-500">{entry.help}</p> : null}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm leading-6 text-blue-800">
                Save changes after editing settings. Officers already using the system may need to refresh their browser to see branding updates.
            </div>
        </div>
    );
}
