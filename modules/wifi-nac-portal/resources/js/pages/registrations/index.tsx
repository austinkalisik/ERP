import { Head, Link, router } from '@inertiajs/react';
import { Ban, CheckCircle2, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';

type Row = {
    id: number;
    domain_name: string;
    company_name: string;
    contact_name: string;
    status: string;
    read: string;
    href: string;
};

export default function RegistrationsIndex({
    registrations,
}: {
    registrations: Row[];
}) {
    const [search, setSearch] = useState('Open');
    const [pageSize, setPageSize] = useState(25);
    const [collapsed, setCollapsed] = useState(false);
    const counts = {
        open: registrations.filter((row) => row.status === 'Open').length,
        closed: registrations.filter((row) => row.status === 'Closed').length,
        cancelled: registrations.filter((row) => row.status === 'Cancelled')
            .length,
    };

    const rows = useMemo(
        () =>
            registrations
                .filter((row) =>
                    Object.values(row)
                        .join(' ')
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                )
                .slice(0, pageSize),
        [pageSize, registrations, search],
    );

    return (
        <>
            <Head title="Domain Registrations" />
            <section className="legacy-panel">
                <div className="legacy-panel-title">
                    <span>Domain Registration Listing</span>
                    <div className="legacy-panel-tools">
                        <button
                            type="button"
                            className="minimize"
                            aria-label="Collapse domain registrations"
                            onClick={() => setCollapsed((value) => !value)}
                        />
                        <button
                            type="button"
                            className="refresh"
                            aria-label="Refresh domain registrations"
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
                            title="Open Registrations"
                            value={counts.open}
                            icon={FileText}
                            onClick={() => setSearch('Open')}
                        />
                        <MiniStat
                            color="teal"
                            title="Closed Registrations"
                            value={counts.closed}
                            icon={CheckCircle2}
                            onClick={() => setSearch('Closed')}
                        />
                        <MiniStat
                            color="red"
                            title="Cancelled Registrations"
                            value={counts.cancelled}
                            icon={Ban}
                            onClick={() => setSearch('Cancelled')}
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
                        {registrations.length} Domain Registrations
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
                                <th>Domain Name Requested</th>
                                <th>Company/Organisation Name</th>
                                <th>Contact Name</th>
                                <th>Registration Status</th>
                                <th>Read</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="legacy-loading">
                                        No domain registrations found
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <tr key={row.id}>
                                        <td>
                                            <span className="legacy-plus">
                                                +
                                            </span>
                                            <Link href={row.href}>
                                                {row.domain_name}
                                            </Link>
                                        </td>
                                        <td>{row.company_name}</td>
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

RegistrationsIndex.layout = {
    breadcrumbs: [
        { title: 'Domain Registrations', href: '/domain-registrations' },
    ],
};
