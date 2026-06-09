import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

type Renewal = {
    id: string;
    record_type: 'hosting_request' | 'subscription';
    customer_name: string;
    current_renewal_date: string;
    next_renewal_date: string;
    renewal_cycle: string;
    renewal_item: string;
};

export default function RenewalsIndex({
    renewals,
    month,
    monthLabel,
}: {
    renewals: Renewal[];
    month: string;
    monthLabel: string;
}) {
    const [search, setSearch] = useState('');
    const [collapsed, setCollapsed] = useState(false);
    const form = useForm({
        renewals: renewals.map((renewal) => ({
            id: renewal.id,
            selected: false,
            next_renewal_date: renewal.next_renewal_date,
        })),
    });

    const rows = useMemo(
        () =>
            renewals.filter((renewal) =>
                [
                    renewal.customer_name,
                    renewal.current_renewal_date,
                    renewal.next_renewal_date,
                    renewal.renewal_cycle,
                    renewal.renewal_item,
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(search.toLowerCase()),
            ),
        [renewals, search],
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/renewals/update', { preserveScroll: true });
    };

    const setMonth = (value: string) => {
        router.get('/renewals', { month: value }, { preserveState: false });
    };

    return (
        <>
            <Head title="Customer Renewals" />
            <form onSubmit={submit} className="legacy-panel">
                <div className="legacy-panel-title">
                    <span>Customer Renewal Search</span>
                    <div className="legacy-panel-tools">
                        <button
                            type="button"
                            className="minimize"
                            aria-label="Collapse renewals"
                            onClick={() => setCollapsed((value) => !value)}
                        />
                        <button
                            type="button"
                            className="refresh"
                            aria-label="Refresh renewals"
                            onClick={() => router.reload()}
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
                    <div className="legacy-renewal-search">
                        <input
                            type="month"
                            value={month}
                            onChange={(event) => setMonth(event.target.value)}
                        />
                        <button type="button" onClick={() => setMonth(month)}>
                            Search
                        </button>
                        <button
                            type="submit"
                            className="blue"
                            disabled={form.processing}
                        >
                            Update Selected Customers
                        </button>
                        <p>Click to search for invoices by Month/Year</p>
                    </div>
                    <h2 className="legacy-centered-heading">
                        Showing Customer Renewals for {monthLabel}
                    </h2>
                    <div className="legacy-table-toolbar">
                        <label>
                            Show{' '}
                            <select defaultValue="25">
                                <option>25</option>
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
                        {renewals.length} Customers
                    </p>
                    <table className="legacy-table">
                        <thead>
                            <tr>
                                <th>Customer Name</th>
                                <th>Current Renewal Date</th>
                                <th>Next Renewal Date</th>
                                <th>Renewal Cycle</th>
                                <th>Renewal Item</th>
                                <th>Select</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="legacy-loading">
                                        No renewal records found for this month
                                    </td>
                                </tr>
                            ) : (
                                rows.map((renewal) => {
                                    const index = form.data.renewals.findIndex(
                                        (item) => item.id === renewal.id,
                                    );

                                    return (
                                        <tr key={renewal.id}>
                                            <td>
                                                <a>{renewal.customer_name}</a>
                                            </td>
                                            <td>
                                                {formatDate(
                                                    renewal.current_renewal_date,
                                                )}
                                            </td>
                                            <td>
                                                <input
                                                    className="date-cell"
                                                    type="date"
                                                    value={
                                                        form.data.renewals[
                                                            index
                                                        ]?.next_renewal_date ??
                                                        renewal.next_renewal_date
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'renewals',
                                                            form.data.renewals.map(
                                                                (item) =>
                                                                    item.id ===
                                                                    renewal.id
                                                                        ? {
                                                                              ...item,
                                                                              next_renewal_date:
                                                                                  event
                                                                                      .target
                                                                                      .value,
                                                                          }
                                                                        : item,
                                                            ),
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td>{renewal.renewal_cycle}</td>
                                            <td>{renewal.renewal_item}</td>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        form.data.renewals[
                                                            index
                                                        ]?.selected ?? false
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'renewals',
                                                            form.data.renewals.map(
                                                                (item) =>
                                                                    item.id ===
                                                                    renewal.id
                                                                        ? {
                                                                              ...item,
                                                                              selected:
                                                                                  event
                                                                                      .target
                                                                                      .checked,
                                                                          }
                                                                        : item,
                                                            ),
                                                        )
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </form>
        </>
    );
}

function formatDate(value: string) {
    if (!value) {
        return '-';
    }

    const [year, month, day] = value.split('-');

    return `${day}/${month}/${year}`;
}

RenewalsIndex.layout = {
    breadcrumbs: [{ title: 'Customer Renewals', href: '/renewals' }],
};
