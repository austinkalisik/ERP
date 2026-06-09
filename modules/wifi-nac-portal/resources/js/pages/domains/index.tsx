import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type DomainRow = {
    id: string;
    customer_name: string;
    customer_contact: string;
    domain: string;
    host_location: string;
    plan: string;
    status: string;
};

type Props = {
    domains: DomainRow[];
};

export default function DomainsIndex({ domains }: Props) {
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState(25);
    const [page, setPage] = useState(1);
    const [collapsed, setCollapsed] = useState(false);

    const filteredRows = useMemo(
        () =>
            domains.filter((domain) =>
                [
                    domain.customer_name,
                    domain.customer_contact,
                    domain.domain,
                    domain.host_location,
                    domain.plan,
                    domain.status,
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(search.toLowerCase()),
            ),
        [domains, search],
    );

    const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const rows = filteredRows.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    return (
        <>
            <Head title="Domains" />
            <section className="legacy-panel">
                <div className="legacy-panel-title">
                    <span>Customer Listing</span>
                    <div className="legacy-panel-tools">
                        <button
                            type="button"
                            className="minimize"
                            aria-label="Collapse domain listing"
                            onClick={() => setCollapsed((value) => !value)}
                        />
                        <Link
                            href="/hosting-requests"
                            aria-label="Manage domains"
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
                                onChange={(event) => {
                                    setPageSize(Number(event.target.value));
                                    setPage(1);
                                }}
                            >
                                <option>25</option>
                                <option>50</option>
                                <option>100</option>
                            </select>{' '}
                            entries
                        </label>
                        <label>
                            Search:{' '}
                            <input
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                            />
                        </label>
                    </div>

                    <div className="legacy-domain-count">
                        Showing{' '}
                        {filteredRows.length === 0
                            ? 0
                            : (currentPage - 1) * pageSize + 1}{' '}
                        to{' '}
                        {Math.min(currentPage * pageSize, filteredRows.length)}{' '}
                        of {filteredRows.length} Customers
                    </div>

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
                                        No domain records found
                                    </td>
                                </tr>
                            ) : (
                                rows.map((domain) => (
                                    <tr
                                        key={domain.id}
                                        className={
                                            domain.status === 'suspended'
                                                ? 'legacy-domain-suspended'
                                                : undefined
                                        }
                                    >
                                        <td>
                                            <Link href="/customers">
                                                {domain.customer_name}
                                            </Link>
                                        </td>
                                        <td>{domain.customer_contact}</td>
                                        <td>{domain.domain}</td>
                                        <td>{domain.host_location}</td>
                                        <td>{domain.plan}</td>
                                        <td>{formatStatus(domain.status)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {pageCount > 1 && (
                        <div className="legacy-domain-pagination">
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setPage(1)}
                            >
                                First
                            </button>
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() =>
                                    setPage((value) => Math.max(1, value - 1))
                                }
                            >
                                Previous
                            </button>
                            <strong>{currentPage}</strong>
                            <button
                                type="button"
                                disabled={currentPage === pageCount}
                                onClick={() =>
                                    setPage((value) =>
                                        Math.min(pageCount, value + 1),
                                    )
                                }
                            >
                                Next
                            </button>
                            <button
                                type="button"
                                disabled={currentPage === pageCount}
                                onClick={() => setPage(pageCount)}
                            >
                                Last
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

function formatStatus(status: string) {
    return status.replaceAll('_', ' ');
}

DomainsIndex.layout = {
    breadcrumbs: [{ title: 'Domains', href: '/domains' }],
};
