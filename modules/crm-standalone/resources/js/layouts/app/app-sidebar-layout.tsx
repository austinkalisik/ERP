import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    ChevronDown,
    ChevronsLeft,
    ChevronsRight,
    Circle,
    CircleHelp,
    Layers,
    Mail,
    RefreshCw,
    Settings,
    UserPlus,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import LegacyLogo from '@/components/legacy-logo';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth, legacy } = usePage().props;
    const brand = usePage().props.brand;
    const currentPath = window.location.pathname;
    const title = breadcrumbs.at(-1)?.title ?? 'Administration Dashboard';
    const [collapsed, setCollapsed] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [supportOpen, setSupportOpen] = useState(
        currentPath.startsWith('/support-requests') ||
            currentPath.startsWith('/domain-registrations'),
    );
    const legacyStats = legacy as
        | {
              customers: number;
              openSupportRequests: number;
              openDomainRegistrations: number;
              notifications: number;
              latestNotifications: {
                  id: number;
                  title: string;
                  customer: string;
                  status: string;
                  href: string;
              }[];
          }
        | undefined;

    return (
        <div className={collapsed ? 'legacy-app collapsed' : 'legacy-app'}>
            <aside className="legacy-sidebar">
                <Link href="/dashboard" className="legacy-sidebar-logo">
                    <LegacyLogo name={brand.name} logoUrl={brand.logo_url} />
                </Link>

                <div className="legacy-user">
                    <div className="legacy-avatar" />
                    <div>
                        <strong>{brand.name}</strong>
                        <span>Support</span>
                    </div>
                </div>

                <div className="legacy-nav-caption">Navigation</div>
                <nav className="legacy-nav">
                    <NavLink
                        href="/dashboard"
                        label="Customers"
                        icon={Users}
                        active={
                            currentPath === '/dashboard' ||
                            currentPath === '/customers'
                        }
                    />
                    <NavLink
                        href="/renewals"
                        label="Renewals"
                        icon={RefreshCw}
                        active={currentPath === '/renewals'}
                    />
                    <NavLink
                        href="/subscriptions"
                        label="Subscriptions"
                        icon={Layers}
                        active={currentPath.startsWith('/subscriptions')}
                    />
                    <NavLink
                        href="/add-customer"
                        label="Add Customer"
                        icon={UserPlus}
                        active={currentPath === '/add-customer'}
                    />
                    <div
                        className={
                            supportOpen ||
                            currentPath.startsWith('/support-requests') ||
                            currentPath.startsWith('/domain-registrations')
                                ? 'legacy-nav-parent active open'
                                : 'legacy-nav-parent'
                        }
                    >
                        <button
                            type="button"
                            className="legacy-nav-link"
                            aria-expanded={supportOpen}
                            onClick={() => setSupportOpen((value) => !value)}
                        >
                            <CircleHelp size={18} />
                            <span>Support</span>
                            <small>NEW</small>
                            <ChevronDown className="ml-auto" size={14} />
                        </button>
                        <div className="legacy-subnav">
                            <SubLink
                                href="/support-requests"
                                label="Support Requests"
                                count={String(
                                    legacyStats?.openSupportRequests ?? 0,
                                )}
                                active={currentPath === '/support-requests'}
                            />
                            <SubLink
                                href="/domain-registrations"
                                label="Registrations"
                                count={String(
                                    legacyStats?.openDomainRegistrations ?? 0,
                                )}
                                active={currentPath === '/domain-registrations'}
                            />
                        </div>
                    </div>
                    <NavLink
                        href="/bulk-email-validator"
                        label="Bulk Email Validator"
                        icon={Mail}
                        active={currentPath === '/bulk-email-validator'}
                    />
                    <NavLink
                        href="/admin-settings"
                        label="Admin Settings"
                        icon={Settings}
                        active={currentPath === '/admin-settings'}
                    />
                </nav>
                <button
                    type="button"
                    className="legacy-collapse"
                    aria-label="Collapse sidebar"
                    onClick={() => setCollapsed((value) => !value)}
                >
                    {collapsed ? (
                        <ChevronsRight size={20} />
                    ) : (
                        <ChevronsLeft size={20} />
                    )}
                </button>
            </aside>

            <div className="legacy-main">
                <header className="legacy-topbar">
                    <div />
                    <div className="legacy-top-actions">
                        <button
                            type="button"
                            className="legacy-bell"
                            onClick={() =>
                                setNotificationsOpen((value) => !value)
                            }
                        >
                            <Bell size={22} />
                            <span>{legacyStats?.notifications ?? 0}</span>
                        </button>
                        {notificationsOpen && (
                            <div className="legacy-notifications">
                                {(legacyStats?.latestNotifications ?? [])
                                    .length === 0 ? (
                                    <span className="legacy-notification-empty">
                                        No open notifications
                                    </span>
                                ) : (
                                    legacyStats?.latestNotifications.map(
                                        (item) => (
                                            <Link
                                                key={item.id}
                                                href={item.href}
                                                onClick={() =>
                                                    setNotificationsOpen(false)
                                                }
                                            >
                                                <strong>{item.title}</strong>
                                                <small>
                                                    {item.customer} -{' '}
                                                    {item.status}
                                                </small>
                                            </Link>
                                        ),
                                    )
                                )}
                            </div>
                        )}
                        <div className="legacy-account">
                            <div className="legacy-avatar small" />
                            <span>{auth.user?.name ?? 'Nextgen Support'}</span>
                            <ChevronDown size={14} />
                            <div className="legacy-account-menu">
                                <Link href="/settings/profile">
                                    Edit Profile
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => router.post('/logout')}
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="legacy-page">
                    <div className="legacy-page-title">
                        <h1>
                            {brand.name} <span>{title}</span>
                        </h1>
                        {breadcrumbs.length > 0 && (
                            <div className="legacy-breadcrumb">
                                <Link href="/dashboard">Home</Link>
                                <span>/</span>
                                <span>{title}</span>
                            </div>
                        )}
                    </div>
                    {children}
                </main>
            </div>
        </div>
    );
}

function NavLink({
    href,
    label,
    icon: Icon,
    active,
}: {
    href: string;
    label: string;
    icon: React.ElementType;
    active: boolean;
}) {
    return (
        <Link
            href={href}
            className={active ? 'legacy-nav-link active' : 'legacy-nav-link'}
        >
            <Icon size={19} />
            <span>{label}</span>
        </Link>
    );
}

function SubLink({
    href,
    label,
    count,
    active,
}: {
    href: string;
    label: string;
    count: string;
    active: boolean;
}) {
    return (
        <Link
            href={href}
            className={active ? 'legacy-sub-link active' : 'legacy-sub-link'}
        >
            <Circle size={8} />
            <span>{label}</span>
            <b>{count}</b>
        </Link>
    );
}
