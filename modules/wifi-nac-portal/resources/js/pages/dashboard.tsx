import { Head, Link } from '@inertiajs/react';
import { FileText, Globe2, HelpCircle, Users, UserX } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Customer } from '@/types';

type Props = {
    metrics: {
        customers: number;
        domains: number;
        suspendedCustomers: number;
        supportRequests: number;
        domainRegistrations: number;
    };
    customers: Customer[];
};

export default function Dashboard({ metrics, customers }: Props) {
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState(25);
    const [collapsed, setCollapsed] = useState(false);

    const rows = useMemo(
        () =>
            customers
                .filter((customer) =>
                    [
                        customer.company_name,
                        customer.contact_name,
                        customer.email,
                        customer.phone ?? '',
                        customer.status,
                    ]
                        .join(' ')
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                )
                .slice(0, pageSize),
        [customers, pageSize, search],
    );

    return (
        <>
            <Head title="Administration Dashboard" />
            <div className="legacy-stat-grid five">
                <Stat
                    color="teal"
                    title="Total Customers"
                    value={metrics.customers}
                    icon={Users}
                    href="/customers"
                />
                <Stat
                    color="sky"
                    title="Total Domains"
                    value={metrics.domains}
                    icon={Globe2}
                    href="/domains"
                />
                <Stat
                    color="red"
                    title="Total Suspended Customers"
                    value={metrics.suspendedCustomers}
                    icon={UserX}
                    href="/customers"
                />
                <Stat
                    color="blue"
                    title="New Support Requests"
                    value={metrics.supportRequests}
                    icon={HelpCircle}
                    href="/support-requests"
                />
                <Stat
                    color="cyan"
                    title="New Domain Registrations"
                    value={metrics.domainRegistrations}
                    icon={FileText}
                    href="/domain-registrations"
                />
            </div>

            <section className="legacy-panel">
                <div className="legacy-panel-title">
                    <span>Customer Listing</span>
                    <div className="legacy-panel-tools">
                        <button
                            type="button"
                            className="minimize"
                            aria-label="Collapse customer listing"
                            onClick={() => setCollapsed((value) => !value)}
                        />
                        <Link href="/customers" aria-label="Open customers" />
                    </div>
                </div>
                <div
                    className={
                        collapsed
                            ? 'legacy-panel-body hidden'
                            : 'legacy-panel-body'
                    }
                >
                    <div className="legacy-table-toolbar">
                        <label>
                            Show{' '}
                            <select
                                value={pageSize}
                                onChange={(event) =>
                                    setPageSize(Number(event.target.value))
                                }
                            >
                                <option>25</option>
                                <option>50</option>
                            </select>{' '}
                            entries
                        </label>
                        <label>
                            Search:{' '}
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                            />
                        </label>
                    </div>
                    {rows.length === 0 && (
                        <p className="legacy-empty-line">No Customers Found!</p>
                    )}
                    <table className="legacy-table">
                        <thead>
                            <tr>
                                <th>Customer Name</th>
                                <th>Customer Contact</th>
                                <th>Domains</th>
                                <th>Host Location</th>
                                <th>Plan</th>
                                <th>Account Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="legacy-loading">
                                        No data available in table
                                    </td>
                                </tr>
                            ) : (
                                rows.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>
                                            <Link href="/customers">
                                                {customer.company_name}
                                            </Link>
                                        </td>
                                        <td>{customer.contact_name}</td>
                                        <td>
                                            {customer.website ??
                                                customer.email.split('@')[1] ??
                                                '-'}
                                        </td>
                                        <td>
                                            {customer.address ?? 'Port Moresby'}
                                        </td>
                                        <td>
                                            {customer.industry ?? 'Hosting'}
                                        </td>
                                        <td>{customer.status}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}

function Stat({
    title,
    value,
    icon: Icon,
    color,
    href,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    href: string;
}) {
    return (
        <div className={`legacy-stat ${color}`}>
            <div>
                <span>{title}</span>
                <strong>{value}</strong>
            </div>
            <Icon />
            <Link href={href}>
                View Detail <small>⊙</small>
            </Link>
        </div>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Administration Dashboard', href: '/dashboard' }],
};
