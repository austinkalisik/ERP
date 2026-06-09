import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { Customer } from '@/types';

type Props = {
    customers: Customer[];
};

export default function CustomersIndex({ customers }: Props) {
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
                        <Link
                            href="/add-customer"
                            aria-label="Add customer"
                            title="Add customer"
                        />
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
                                            <Link href="/add-customer">
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

CustomersIndex.layout = {
    breadcrumbs: [{ title: 'Administration Dashboard', href: '/customers' }],
};
