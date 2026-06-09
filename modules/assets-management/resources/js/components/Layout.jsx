import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { navigationSections } from '../config/navigation';
import useNotifications from '../hooks/useNotifications';

const USER_ROLE_LABELS = {
    admin: 'System Administrator',
    manager: 'Manager',
    asset_officer: 'Asset Officer',
    procurement_officer: 'Procurement Officer',
    auditor: 'Auditor',
    staff: 'Staff',
};

function SearchIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </svg>
    );
}

function MenuIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}

function ChevronIcon({ open = false }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
            aria-hidden="true"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}

function BellIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M15 17H5a2 2 0 0 1-2-2c0-1.2.5-2.3 1.4-3.1L6 10.5V8a6 6 0 1 1 12 0v2.5l1.6 1.4A4.2 4.2 0 0 1 21 15a2 2 0 0 1-2 2h-4" />
            <path d="M9 17a3 3 0 0 0 6 0" />
        </svg>
    );
}

function DashboardIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 13h8V3H3zM13 21h8v-6h-8zM13 11h8V3h-8zM3 21h8v-6H3z" />
        </svg>
    );
}

function BoxIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m3 7 9-4 9 4-9 4-9-4Z" />
            <path d="m3 7 9 4 9-4" />
            <path d="M12 11v10" />
            <path d="M3 7v10l9 4 9-4V7" />
        </svg>
    );
}

function ClipboardIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 5h6" />
            <path d="M8 3h8v4H8z" />
            <path d="M6 7h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
        </svg>
    );
}

function LayersIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m12 3 9 4.5-9 4.5L3 7.5 12 3Z" />
            <path d="m3 12.5 9 4.5 9-4.5" />
            <path d="m3 17 9 4 9-4" />
        </svg>
    );
}

function TruckIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M10 17h4V5H2v12h3" />
            <path d="M14 8h4l4 4v5h-3" />
            <circle cx="7.5" cy="17.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
    );
}

function TagIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M20 10 10 20l-7-7L13 3h7v7Z" />
            <circle cx="17" cy="7" r="1" />
        </svg>
    );
}

function BuildingIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 21h18" />
            <path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M6 20a6 6 0 0 1 12 0" />
        </svg>
    );
}

function SettingsIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 3v2.2M12 18.8V21M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M3 12h2.2M18.8 12H21M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
            <circle cx="12" cy="12" r="4" />
        </svg>
    );
}

function FolderIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        </svg>
    );
}

function ActivityIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 12h4l2-5 4 10 2-5h6" />
        </svg>
    );
}

function BookOpenIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 7v14" />
            <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v18H5.5A2.5 2.5 0 0 1 3 18.5z" />
            <path d="M12 3h6.5A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5H12z" />
        </svg>
    );
}

function LogoutIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
        </svg>
    );
}

const ICONS = {
    dashboard: DashboardIcon,
    items: BoxIcon,
    assignments: ClipboardIcon,
    inventory: LayersIcon,
    suppliers: TruckIcon,
    categories: TagIcon,
    departments: BuildingIcon,
    receivers: UserIcon,
    users: UserIcon,
    settings: SettingsIcon,
    profile: UserIcon,
    notifications: BellIcon,
    activityLogs: ActivityIcon,
    userguide: BookOpenIcon,
    default: FolderIcon,
};

function getIcon(name) {
    return ICONS[name] || ICONS.default;
}

function notificationPriorityClass(priority) {
    return {
        high: 'bg-red-100 text-red-700',
        medium: 'bg-amber-100 text-amber-700',
        normal: 'bg-blue-100 text-blue-700',
        low: 'bg-slate-100 text-slate-600',
    }[priority || 'normal'] || 'bg-blue-100 text-blue-700';
}

function notificationLabel(value) {
    return (value || 'general').replace(/_/g, ' ');
}

function initials(name) {
    if (!name) {
        return 'SA';
    }

    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function Avatar({ user }) {
    const [broken, setBroken] = useState(false);
    const photoUrl = user?.profile_photo_url || '';

    useEffect(() => {
        setBroken(false);
    }, [photoUrl]);

    if (photoUrl && !broken) {
        return (
            <img
                key={photoUrl}
                src={photoUrl}
                alt={user?.name || 'User'}
                className="h-10 w-10 rounded-lg object-cover ring-2 ring-white/10"
                onError={() => setBroken(true)}
            />
        );
    }

    return (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white">
            {initials(user?.name)}
        </div>
    );
}

function BrandMark({ systemName, systemLogoUrl }) {
    const [broken, setBroken] = useState(false);

    useEffect(() => {
        setBroken(false);
    }, [systemLogoUrl]);

    if (systemLogoUrl && !broken) {
        return (
            <img
                key={systemLogoUrl}
                src={systemLogoUrl}
                alt={systemName || 'System Logo'}
                className="h-11 w-11 rounded-lg bg-white object-contain p-1 shadow-lg shadow-blue-700/30"
                onError={() => setBroken(true)}
            />
        );
    }

    return (
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-700/30">
            <BoxIcon />
        </div>
    );
}

function routeMatches(pathname, item) {
    if (!item?.match?.length) {
        return pathname === item.to || pathname.startsWith(`${item.to}/`);
    }

    return item.match.some((match) => pathname === match || pathname.startsWith(`${match}/`));
}

function SidebarItem({ item, pathname, onNavigate, unreadCount }) {
    const Icon = getIcon(item.icon);
    const isActive = routeMatches(pathname, item);
    const preloadTarget = () => window.__nextgenPreloadRoute?.(item.to);

    return (
        <NavLink
            to={item.to}
            onClick={onNavigate}
            onFocus={preloadTarget}
            onMouseEnter={preloadTarget}
            onTouchStart={preloadTarget}
            className={[
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
            ].join(' ')}
        >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/5">
                <Icon />
            </span>
            <span className="truncate">{item.label}</span>

            {item.to === '/notifications' && unreadCount > 0 ? (
                <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount}
                </span>
            ) : null}

            {isActive ? <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-white/80" /> : null}
        </NavLink>
    );
}

function SidebarSection({ section, pathname, onNavigate, unreadCount, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);

    useEffect(() => {
        const hasActiveChild = section.items.some((item) => routeMatches(pathname, item));
        if (hasActiveChild) {
            setOpen(true);
        }
    }, [pathname, section.items]);

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-300"
            >
                <span>{section.label}</span>
                <ChevronIcon open={open} />
            </button>

            {open ? (
                <div className="space-y-1.5">
                    {section.items.map((item) => (
                        <SidebarItem
                            key={item.to}
                            item={item}
                            pathname={pathname}
                            onNavigate={onNavigate}
                            unreadCount={unreadCount}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function SidebarContent({
    pathname,
    systemName,
    systemTagline,
    displayName,
    companyWebsite,
    systemLogoUrl,
    user,
    onLogout,
    onNavigate,
    unreadCount,
}) {
    return (
        <div className="flex h-full flex-col bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_24%),linear-gradient(180deg,#06101f_0%,#09162d_48%,#081121_100%)] text-white">
            <div className="border-b border-white/10 px-4 py-4">
                <div className="flex items-center gap-3">
                    <BrandMark systemName={systemName} systemLogoUrl={systemLogoUrl} />

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold leading-tight text-white">{systemName}</p>
                        <p className="pt-0.5 text-[11px] leading-tight text-blue-100/75">{systemTagline}</p>
                    </div>
                </div>

                <div className="mt-3 truncate rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] text-blue-100/70 shadow-inner shadow-white/5">
                    {companyWebsite?.replace(/^https?:\/\//, '') || 'nextgenpng.net'}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
                <div className="space-y-6">
                    {navigationSections.map((section, index) => (
                        <SidebarSection
                            key={section.label}
                            section={section}
                            pathname={pathname}
                            onNavigate={onNavigate}
                            unreadCount={unreadCount}
                            defaultOpen={index === 0}
                        />
                    ))}
                </div>
            </div>

            <div className="border-t border-white/10 px-4 py-4">
                <Link to="/profile" onClick={onNavigate} className="block rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[0_10px_30px_rgba(2,6,23,0.25)] transition hover:bg-white/10">
                    <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-blue-100/55">Signed in as</p>
                            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                        </div>
                    </div>
                </Link>

                <button
                    type="button"
                    onClick={onLogout}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/8 hover:text-white"
                >
                    <LogoutIcon />
                    Sign Out
                </button>
            </div>
        </div>
    );
}

function NotificationDropdown({ notifications, unreadCount, onOpen, onMarkAllRead, onClose, loading }) {
    return (
        <div className="fixed inset-x-3 top-20 z-50 max-h-[calc(100vh-6rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:inset-auto sm:right-0 sm:top-14 sm:w-[380px]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                    <p className="text-xs text-slate-500">{unreadCount} unread</p>
                </div>

                <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                    Mark all read
                </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto sm:max-h-96">
                {loading ? (
                    <div className="px-4 py-6 text-sm text-slate-500">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-slate-500">No notifications available.</div>
                ) : (
                    notifications.map((notification) => (
                        <button
                            key={notification.id}
                            type="button"
                            onClick={() => onOpen(notification)}
                            className={[
                                'block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50',
                                notification.is_read ? 'bg-white' : 'bg-blue-50/50',
                            ].join(' ')}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${notificationPriorityClass(notification.priority)}`}>
                                            {notificationLabel(notification.priority)}
                                        </span>
                                    </div>
                                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">{notification.message}</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                        <span className="capitalize">{notificationLabel(notification.type)}</span>
                                        <span>|</span>
                                        <span>{new Date(notification.created_at).toLocaleString()}</span>
                                    </div>
                                </div>

                                {!notification.is_read ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" /> : null}
                            </div>
                        </button>
                    ))
                )}
            </div>

            <div className="border-t border-slate-200 px-4 py-3">
                <NavLink to="/notifications" onClick={onClose} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    View all notifications
                </NavLink>
            </div>
        </div>
    );
}

function AccountDropdown({ user, displayName, displayRole, onLogout, onStopImpersonation, onClose }) {
    return (
        <div className="fixed inset-x-3 top-20 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:inset-auto sm:right-0 sm:top-14 sm:w-[340px]">
            <div className="border-b border-slate-200 px-4 py-4">
                <div className="flex items-center gap-3">
                    <Avatar user={user} />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{displayName}</p>
                        <p className="truncate text-xs text-slate-500">{user?.email || 'Signed in user'}</p>
                    </div>
                </div>
                <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                    Current role: {displayRole}
                </div>
                {user?.is_impersonating ? (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                        You are switched into this user account.
                    </div>
                ) : null}
            </div>

            <div className="p-2">
                <Link to="/profile" onClick={onClose} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    View My Profile
                </Link>
                {user?.role === 'admin' && !user?.is_impersonating ? (
                    <Link to="/users" onClick={onClose} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Manage and Switch Users
                    </Link>
                ) : null}
                {user?.is_impersonating ? (
                    <button
                        type="button"
                        onClick={onStopImpersonation}
                        className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
                    >
                        Return to Administrator
                    </button>
                ) : null}
                <button
                    type="button"
                    onClick={onLogout}
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}

export default function Layout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, stopImpersonation } = useAuth();
    const { settings } = useSettings();
    const { notifications, unreadCount, loading: notificationsLoading, markRead, markAllRead } = useNotifications();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [globalSearch, setGlobalSearch] = useState('');
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [impersonationError, setImpersonationError] = useState('');
    const notificationsRef = useRef(null);
    const accountRef = useRef(null);

    useEffect(() => {
        if (location.pathname !== '/search') {
            return;
        }

        const params = new URLSearchParams(location.search);
        setGlobalSearch(params.get('q') ?? '');
    }, [location.pathname, location.search]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (!event.target.closest('[data-notification-root="true"]')) {
                setNotificationsOpen(false);
            }

            if (!event.target.closest('[data-account-root="true"]')) {
                setAccountOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    const displayName = useMemo(() => {
        if (!user) {
            return 'System Administrator';
        }

        return user.name || user.email || 'System Administrator';
    }, [user]);
    const displayRole = USER_ROLE_LABELS[user?.role] || 'Signed In User';

    const systemName = settings.system_name || 'Nextgen Assets Management System';
    const systemTagline = settings.system_tagline || 'Owned by Nextgen Technology';
    const companyWebsite = settings.company_website || 'https://nextgenpng.net/';
    const systemLogoUrl = settings.system_logo_url || '';

    async function handleLogout() {
        try {
            await logout();
        } finally {
            navigate('/login', { replace: true });
        }
    }

    async function handleStopImpersonation() {
        try {
            setImpersonationError('');
            await stopImpersonation();
            setAccountOpen(false);
            navigate('/dashboard', { replace: true });
        } catch (error) {
            console.error('Failed to stop impersonation', error);
            setImpersonationError(error?.response?.data?.message || 'Could not return to admin. Please refresh and try again.');
        }
    }

    function handleGlobalSearchSubmit(event) {
        event.preventDefault();

        const query = globalSearch.trim();

        if (!query) {
            navigate('/search');
            return;
        }

        navigate(`/search?q=${encodeURIComponent(query)}`);
    }

    function closeSidebar() {
        setSidebarOpen(false);
    }

    async function handleOpenNotification(notification) {
        try {
            if (!notification.is_read) {
                await markRead(notification.id);
            }

            setNotificationsOpen(false);
            navigate(notification.url || '/notifications');
        } catch (error) {
            console.error('Failed to open notification', error);
        }
    }

    return (
        <div className="flex min-h-screen bg-transparent">
            <aside className="sticky top-0 z-40 hidden h-screen w-[320px] shrink-0 border-r border-slate-200/40 lg:flex">
                <SidebarContent
                    pathname={location.pathname}
                    systemName={systemName}
                    systemTagline={systemTagline}
                    displayName={displayName}
                    companyWebsite={companyWebsite}
                    systemLogoUrl={systemLogoUrl}
                    user={user}
                    onLogout={handleLogout}
                    onNavigate={closeSidebar}
                    unreadCount={unreadCount}
                />
            </aside>

            {sidebarOpen ? (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={closeSidebar} />
                    <aside className="relative z-10 h-full w-[min(86vw,320px)] border-r border-white/10">
                        <SidebarContent
                            pathname={location.pathname}
                            systemName={systemName}
                            systemTagline={systemTagline}
                            displayName={displayName}
                            companyWebsite={companyWebsite}
                            systemLogoUrl={systemLogoUrl}
                            user={user}
                            onLogout={handleLogout}
                            onNavigate={closeSidebar}
                            unreadCount={unreadCount}
                        />
                    </aside>
                </div>
            ) : null}

            <div className="flex min-w-0 flex-1 flex-col">
                {user?.is_impersonating ? (
                    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-800">You are currently impersonating another user.</p>
                                {impersonationError ? <p className="mt-1 text-xs font-semibold text-red-600">{impersonationError}</p> : null}
                            </div>
                            <button
                                type="button"
                                onClick={handleStopImpersonation}
                                className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
                            >
                                Return to Admin
                            </button>
                        </div>
                    </div>
                ) : null}

                <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                    <div className="grid gap-3 px-4 py-3 sm:px-6 xl:grid-cols-[auto_minmax(360px,680px)_auto] xl:items-center xl:justify-between">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSidebarOpen(true)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 lg:hidden"
                                    aria-label="Open menu"
                                >
                                    <MenuIcon />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 xl:hidden">
                                <div className="relative" ref={notificationsRef} data-notification-root="true">
                                    <button
                                        type="button"
                                        onClick={() => setNotificationsOpen((prev) => !prev)}
                                        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/85 text-slate-600 transition hover:bg-white hover:text-slate-900"
                                        aria-label="Open notifications"
                                    >
                                        <BellIcon />
                                        {unreadCount > 0 ? (
                                            <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                                {unreadCount}
                                            </span>
                                        ) : null}
                                    </button>

                                    {notificationsOpen ? (
                                        <NotificationDropdown
                                            notifications={notifications}
                                            unreadCount={unreadCount}
                                            onOpen={handleOpenNotification}
                                            onMarkAllRead={markAllRead}
                                            onClose={() => setNotificationsOpen(false)}
                                            loading={notificationsLoading}
                                        />
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleGlobalSearchSubmit} className="flex w-full items-center gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={globalSearch}
                                    onChange={(event) => setGlobalSearch(event.target.value)}
                                    placeholder="Search system records..."
                                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                                    <SearchIcon />
                                </span>
                            </div>

                            <button
                                type="submit"
                                className="h-11 rounded-lg bg-gradient-to-r from-blue-600 via-blue-600 to-cyan-500 px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.25)] transition hover:-translate-y-px hover:shadow-[0_16px_36px_rgba(37,99,235,0.34)]"
                            >
                                Search
                            </button>
                        </form>

                        <div className="hidden items-center gap-3 xl:flex">
                            <div className="relative" ref={notificationsRef} data-notification-root="true">
                                <button
                                    type="button"
                                    onClick={() => setNotificationsOpen((prev) => !prev)}
                                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/85 text-slate-600 transition hover:bg-white hover:text-slate-900"
                                >
                                    <BellIcon />
                                    {unreadCount > 0 ? (
                                        <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                            {unreadCount}
                                        </span>
                                    ) : null}
                                </button>

                                {notificationsOpen ? (
                                    <NotificationDropdown
                                        notifications={notifications}
                                        unreadCount={unreadCount}
                                        onOpen={handleOpenNotification}
                                        onMarkAllRead={markAllRead}
                                        onClose={() => setNotificationsOpen(false)}
                                        loading={notificationsLoading}
                                    />
                                ) : null}
                            </div>

                            <div className="relative" ref={accountRef} data-account-root="true">
                                <button
                                    type="button"
                                    onClick={() => setAccountOpen((prev) => !prev)}
                                    className="hidden min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/85 px-3 py-2.5 text-left shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:bg-white sm:flex"
                                    aria-label="Open account menu"
                                >
                                    <Avatar user={user} />
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-medium text-slate-500">{displayRole}</p>
                                        <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                                    </div>
                                </button>

                                {accountOpen ? (
                                    <AccountDropdown
                                        user={user}
                                        displayName={displayName}
                                        displayRole={displayRole}
                                        onLogout={handleLogout}
                                        onStopImpersonation={handleStopImpersonation}
                                        onClose={() => setAccountOpen(false)}
                                    />
                                ) : null}
                            </div>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto">
                    <div className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 xl:px-8 2xl:px-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
