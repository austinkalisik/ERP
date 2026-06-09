import { Head, Link, router } from '@inertiajs/react';
import { Check, HelpCircle, X } from 'lucide-react';
import { useMemo, useState } from 'react';

type Row = {
    id: number;
    sr_number: string;
    date_received: string;
    subject: string;
    domain_name: string;
    contact_name: string;
    assignee_name: string;
    status: string;
    read: string;
    href: string;
};

export default function SupportIndex({ requests }: { requests: Row[] }) {
    const [search, setSearch] = useState('Open');
    const [pageSize, setPageSize] = useState(25);
    const [collapsed, setCollapsed] = useState(false);
    const counts = {
        open: requests.filter((row) => row.status === 'Open').length,
        resolved: requests.filter((row) => row.status === 'Resolved').length,
        rejected: requests.filter((row) => row.status === 'Rejected').length,
    };

    const rows = useMemo(
        () =>
            requests
                .filter((row) =>
                    Object.values(row)
                        .join(' ')
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                )
                .slice(0, pageSize),
        [pageSize, requests, search],
    );

    return (
        <>
            <Head title="Support Requests" />
            <section className="legacy-panel">
                <div className="legacy-panel-title">
                    <span>Support Request Listing</span>
                    <div className="legacy-panel-tools">
                        <button
                            type="button"
                            className="minimize"
                            aria-label="Collapse support requests"
                            onClick={() => setCollapsed((value) => !value)}
                        />
                        <button
                            type="button"
                            className="refresh"
                            aria-label="Refresh support requests"
                            onClick={() => router.reload()}
                        />
                    </div>
                </div>
                <div
                    className={
                        collapsed
                            ? 'legacy-panel-body narrow hidden'
                            : 'legacy-panel-body narrow'
                    }
                >
                    <div className="legacy-stat-grid support">
                        <MiniStat
                            color="sky"
                            title="Open Support Requests"
                            value={counts.open}
                            icon={HelpCircle}
                            onClick={() => setSearch('Open')}
                        />
                        <MiniStat
                            color="teal"
                            title="Resolved Support Requests"
                            value={counts.resolved}
                            icon={Check}
                            onClick={() => setSearch('Resolved')}
                        />
                        <MiniStat
                            color="red"
                            title="Rejected Support Requests"
                            value={counts.rejected}
                            icon={X}
                            onClick={() => setSearch('Rejected')}
                        />
                    </div>
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
                    <p>
                        Showing {rows.length === 0 ? 0 : 1} to {rows.length} of{' '}
                        {requests.length} Support Requests
                    </p>
                    <div className="legacy-pagination">
                        <span>First</span>
                        <span>Previous</span>
                        <b>1</b>
                        <span>Next</span>
                        <span>Last</span>
                    </div>
                    <table className="legacy-table">
                        <thead>
                            <tr>
                                <th>SR Number</th>
                                <th>Date Received</th>
                                <th>Subject</th>
                                <th>Contact Name</th>
                                <th>Status</th>
                                <th>Read</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="legacy-loading">
                                        No support requests found
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <tr key={row.id}>
                                        <td>
                                            <Link href={row.href}>
                                                {row.sr_number}
                                            </Link>
                                        </td>
                                        <td>{row.date_received}</td>
                                        <td>
                                            <Link href={row.href}>
                                                {row.subject}
                                            </Link>
                                            <small className="legacy-cell-note">
                                                {row.domain_name}
                                            </small>
                                        </td>
                                        <td>{row.contact_name}</td>
                                        <td>{row.status}</td>
                                        <td>{row.read}</td>
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

function MiniStat({
    title,
    value,
    icon: Icon,
    color,
    onClick,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            className={`legacy-stat ${color}`}
            onClick={onClick}
        >
            <div>
                <span>{title}</span>
                <strong>{value}</strong>
            </div>
            <Icon />
            <span>View Detail</span>
        </button>
    );
}

SupportIndex.layout = {
    breadcrumbs: [{ title: 'Support Requests', href: '/support-requests' }],
};
