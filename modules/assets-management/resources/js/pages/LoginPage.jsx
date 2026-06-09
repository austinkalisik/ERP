import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function EyeIcon({ visible }) {
    return visible ? (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7S18 19 12 19 2.5 12 2.5 12Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m3 3 18 18" />
            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7a13 13 0 0 1-2.2 3.4" />
            <path d="M6.1 6.1A12.8 12.8 0 0 0 2.5 12c1 2.5 4.5 7 9.5 7 1.4 0 2.7-.3 3.8-.8" />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
    );
}

function BrandMark({ mobile = false }) {
    return (
        <div className={`inline-flex items-center gap-3 rounded-lg border px-4 py-3 shadow-xl backdrop-blur ${mobile ? 'border-slate-200 bg-white shadow-slate-200/80' : 'border-white/15 bg-white/10 shadow-black/20'}`}>
            <img
                src="/nextgen-logo.png"
                alt="NextGen Technology logo"
                className={`${mobile ? 'h-12 w-auto' : 'h-10 w-auto'} rounded-sm object-contain`}
            />
            <div>
                <p className={`text-sm font-bold ${mobile ? 'text-slate-950' : 'text-white'}`}>Nextgen Assets Management System</p>
                <p className={`text-xs ${mobile ? 'text-slate-500' : 'text-blue-100'}`}>Owned by Nextgen Technology</p>
            </div>
        </div>
    );
}

function MotionOrb({ className, style }) {
    return <div className={`absolute rounded-full blur-3xl ${className}`} style={style} />;
}

function SignalColumn({ delay = '0s', left = '0%', height = '220px' }) {
    return (
        <div
            className="animate-premium-sweep absolute bottom-0 w-px bg-gradient-to-t from-cyan-300/0 via-cyan-200/45 to-cyan-100/0"
            style={{ left, height, animationDelay: delay }}
        />
    );
}

function getRememberedEmail() {
    try {
        return window.localStorage.getItem('nextgen-login-email') || '';
    } catch {
        return '';
    }
}

function rememberEmail(email, shouldRemember) {
    try {
        if (shouldRemember) {
            window.localStorage.setItem('nextgen-login-email', email);
            return;
        }

        window.localStorage.removeItem('nextgen-login-email');
    } catch {
        return;
    }
}

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const rememberedEmail = useMemo(() => getRememberedEmail(), []);

    const [form, setForm] = useState({
        email: rememberedEmail,
        password: '',
    });
    const [remember, setRemember] = useState(Boolean(rememberedEmail));
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentTime, setCurrentTime] = useState(() => new Date());

    useEffect(() => {
        const intervalId = window.setInterval(() => setCurrentTime(new Date()), 1000);
        return () => window.clearInterval(intervalId);
    }, []);

    const canSubmit = form.email.trim() && form.password;
    const timeLabel = currentTime.toLocaleString('en-PG', {
        timeZone: 'Pacific/Port_Moresby',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    async function handleSubmit(event) {
        event.preventDefault();

        if (!canSubmit) {
            setError('Enter your email and password to continue.');
            return;
        }

        setLoading(true);
        setError('');

        const result = await login(form.email.trim(), form.password);
        setLoading(false);

        if (result.success) {
            rememberEmail(form.email.trim(), remember);
            navigate('/dashboard', { replace: true });
            return;
        }

        setError(result.error || 'Invalid email or password.');
    }

    return (
        <main className="min-h-screen bg-slate-100 text-slate-950">
            <div className="grid min-h-screen lg:grid-cols-[minmax(420px,0.95fr)_minmax(520px,1.05fr)]">
                <section
                    className="relative hidden overflow-hidden px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between"
                    style={{
                        background:
                            'linear-gradient(145deg, #06101f 0%, #0b1b34 48%, #0f2d46 100%)',
                    }}
                >
                    <div className="animate-premium-drift absolute inset-0 opacity-60">
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage:
                                    'linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)',
                                backgroundSize: '80px 80px',
                                maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.85), rgba(0,0,0,0.25))',
                            }}
                        />
                    </div>

                    <div
                        className="animate-premium-grid absolute inset-0 opacity-50"
                        style={{
                            background:
                                'radial-gradient(circle at 18% 18%, rgba(37, 99, 235, 0.55), transparent 30%), radial-gradient(circle at 80% 22%, rgba(20, 184, 166, 0.35), transparent 24%)',
                        }}
                    />

                    <MotionOrb
                        className="animate-premium-float left-[6%] top-[16%] h-48 w-48 bg-blue-500/20"
                        style={{ animationDelay: '0s' }}
                    />
                    <MotionOrb
                        className="animate-premium-float right-[10%] top-[14%] h-40 w-40 bg-cyan-400/20"
                        style={{ animationDelay: '1.2s' }}
                    />
                    <MotionOrb
                        className="animate-premium-float bottom-[20%] left-[28%] h-56 w-56 bg-sky-500/14"
                        style={{ animationDelay: '2.4s' }}
                    />
                    <MotionOrb
                        className="animate-premium-float bottom-[10%] right-[14%] h-44 w-44 bg-emerald-400/12"
                        style={{ animationDelay: '3.1s' }}
                    />

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[32%]">
                        <div className="absolute bottom-0 left-[12%] right-[10%] top-[12%] rounded-[32px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />
                        <div className="absolute bottom-[8%] left-[16%] right-[14%] top-[18%] rounded-[28px] border border-cyan-200/8 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_40%)]" />
                        <SignalColumn left="18%" delay="0s" height="260px" />
                        <SignalColumn left="31%" delay="1.1s" height="300px" />
                        <SignalColumn left="44%" delay="0.6s" height="250px" />
                        <SignalColumn left="57%" delay="1.8s" height="320px" />
                        <SignalColumn left="70%" delay="0.9s" height="280px" />
                        <SignalColumn left="83%" delay="2.2s" height="240px" />
                    </div>

                    <div className="relative z-10">
                        <BrandMark />

                        <div className="mt-20 max-w-2xl">
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">Authorized Office Portal</p>
                            <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight">
                                Control every asset movement with confidence.
                            </h1>
                            <p className="mt-6 max-w-xl text-base leading-7 text-slate-200">
                                A focused workspace for officers to manage inventory, assignments, returns, users, and operational alerts across the office network.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 grid gap-4 xl:grid-cols-3">
                        <div className="rounded-lg border border-white/15 bg-white/10 p-5 backdrop-blur">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">Security</p>
                            <p className="mt-3 text-2xl font-black">Role Based</p>
                            <p className="mt-2 text-sm text-slate-300">Admin, manager, asset officer, procurement, auditor, and staff access.</p>
                        </div>
                        <div className="rounded-lg border border-white/15 bg-white/10 p-5 backdrop-blur">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">Office</p>
                            <p className="mt-3 text-2xl font-black">Shared Link</p>
                            <p className="mt-2 text-sm text-slate-300">Designed for officers using one system together.</p>
                        </div>
                        <div className="rounded-lg border border-white/15 bg-white/10 p-5 backdrop-blur">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">PNG Time</p>
                            <p className="mt-3 text-2xl font-black">{timeLabel}</p>
                            <p className="mt-2 text-sm text-slate-300">Operational timestamps stay familiar.</p>
                        </div>
                    </div>
                </section>

                <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-12">
                    <div className="w-full max-w-[520px]">
                        <div className="mb-8 lg:hidden">
                            <BrandMark mobile />
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
                            <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                                        <LockIcon />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tight text-slate-950">Sign in</h2>
                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                            Enter your officer account to continue to the dashboard.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-6 sm:px-8">
                                {error ? (
                                    <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                        {error}
                                    </div>
                                ) : null}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="field-label">Email Address</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                                            className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                            placeholder="your.email@office.com"
                                            autoComplete="email"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="field-label">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={form.password}
                                                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                                                className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 pr-12 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                placeholder="Enter password"
                                                autoComplete="current-password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-700"
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                <EyeIcon visible={showPassword} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
                                            <input
                                                type="checkbox"
                                                checked={remember}
                                                onChange={(event) => setRemember(event.target.checked)}
                                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            Remember email
                                        </label>
                                        <p className="text-sm font-medium text-slate-500">Need access? Contact admin.</p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !canSubmit}
                                        className="flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 px-5 text-base font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {loading ? 'Signing in...' : 'Sign In'}
                                    </button>
                                </form>
                            </div>

                            <div className="rounded-b-xl border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-8">
                                <p className="text-sm leading-6 text-slate-600">
                                    Use only your assigned account. Always sign out when using a shared office computer.
                                </p>
                            </div>
                        </div>

                        <p className="mt-6 text-center text-sm font-medium text-slate-500">
                            Protected workspace for authorized officers only.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
