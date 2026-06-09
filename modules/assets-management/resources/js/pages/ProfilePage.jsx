import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

function initials(name) {
    if (!name) {
        return 'U';
    }

    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();

    const [form, setForm] = useState({
        name: '',
        email: '',
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setForm((prev) => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
            }));
        }
    }, [user]);

    useEffect(() => {
        return () => {
            if (photoPreview) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    const currentPhoto = useMemo(() => photoPreview || user?.profile_photo_url || '', [photoPreview, user]);

    function handlePhotoChange(event) {
        const file = event.target.files?.[0] || null;
        setPhotoFile(file);

        if (photoPreview) {
            URL.revokeObjectURL(photoPreview);
        }

        if (file) {
            setPhotoPreview(URL.createObjectURL(file));
        } else {
            setPhotoPreview('');
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setSuccess('');
        setError('');

        try {
            const payload = new FormData();
            payload.append('name', form.name);
            payload.append('email', form.email);

            if (form.current_password) {
                payload.append('current_password', form.current_password);
            }

            if (form.password) {
                payload.append('password', form.password);
                payload.append('password_confirmation', form.password_confirmation);
            }

            if (photoFile) {
                payload.append('profile_photo', photoFile);
            }

            payload.append('_method', 'PUT');

            await apiClient.post('/profile', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            await refreshUser();

            setSuccess('Profile updated successfully.');
            setForm((prev) => ({
                ...prev,
                current_password: '',
                password: '',
                password_confirmation: '',
            }));
            setPhotoFile(null);

            if (photoPreview) {
                URL.revokeObjectURL(photoPreview);
            }

            setPhotoPreview('');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    }

    async function handleDeletePhoto() {
        try {
            setPhotoLoading(true);
            setSuccess('');
            setError('');

            await apiClient.delete('/profile/photo');
            await refreshUser();

            setPhotoFile(null);

            if (photoPreview) {
                URL.revokeObjectURL(photoPreview);
            }

            setPhotoPreview('');
            setSuccess('Profile image removed successfully.');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to remove profile image');
        } finally {
            setPhotoLoading(false);
        }
    }

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="panel">
                <div className="panel-body">
                    <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
                    <p className="mt-1 text-sm text-slate-500">Update your account details, password, and profile image.</p>

                    {success ? (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {success}
                        </div>
                    ) : null}

                    {error ? (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    ) : null}

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="input-shell w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="input-shell w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Current Password</label>
                                <input
                                    type="password"
                                    value={form.current_password}
                                    onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                                    className="input-shell w-full"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="input-shell w-full"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</label>
                                <input
                                    type="password"
                                    value={form.password_confirmation}
                                    onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                                    className="input-shell w-full"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Profile Image</label>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={handlePhotoChange}
                                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>

                            <button
                                type="button"
                                onClick={handleDeletePhoto}
                                disabled={photoLoading || (!user?.profile_photo_url && !photoPreview)}
                                className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {photoLoading ? 'Removing...' : 'Remove Image'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="space-y-6">
                <div className="panel">
                    <div className="panel-body">
                        <div className="flex flex-col items-center text-center">
                            {currentPhoto ? (
                                <img
                                    src={currentPhoto}
                                    alt={user?.name || 'User'}
                                    className="h-28 w-28 rounded-2xl object-cover ring-4 ring-slate-100"
                                />
                            ) : (
                                <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-bold text-white ring-4 ring-slate-100">
                                    {initials(user?.name)}
                                </div>
                            )}

                            <h2 className="mt-4 text-lg font-semibold text-slate-900">{user?.name || 'User'}</h2>
                            <p className="text-sm text-slate-500">{user?.email || 'No email available'}</p>
                        </div>
                    </div>
                </div>

                <div className="panel">
                    <div className="panel-body">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900">Account Details</h2>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between gap-3">
                                <span className="text-slate-600">Role:</span>
                                <span className="font-medium text-slate-900">{user?.role || 'N/A'}</span>
                            </div>

                            <div className="flex justify-between gap-3">
                                <span className="text-slate-600">Email Verified:</span>
                                <span className="font-medium text-slate-900">{user?.email_verified_at ? 'Yes' : 'No'}</span>
                            </div>

                            <div className="flex justify-between gap-3">
                                <span className="text-slate-600">Impersonating:</span>
                                <span className="font-medium text-slate-900">{user?.is_impersonating ? 'Yes' : 'No'}</span>
                            </div>

                            <div className="flex justify-between gap-3">
                                <span className="text-slate-600">Member Since:</span>
                                <span className="font-medium text-slate-900">
                                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}