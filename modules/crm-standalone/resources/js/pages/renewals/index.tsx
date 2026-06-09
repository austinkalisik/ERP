import { Head, router, useForm } from '@inertiajs/react';
import { CalendarClock, CheckSquare, RefreshCcw, Search } from 'lucide-react';
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
    const [pageSize, setPageSize] = useState(25);
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
    const visibleRows = rows.slice(0, pageSize);
    const selectedCount = form.data.renewals.filter(
        (renewal) => renewal.selected,
    ).length;
    const hostingCount = renewals.filter(
        (renewal) => renewal.record_type === 'hosting_request',
    ).length;
    const subscriptionCount = renewals.filter(
        (renewal) => renewal.record_type === 'subscription',
    ).length;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/renewals/update', { preserveScroll: true });
    };

    const setMonth = (value: string) => {
        router.get('/renewals', { month: value }, { preserveState: false });
    };

    const setAllVisible = (selected: boolean) => {
        const visibleIds = new Set(visibleRows.map((renewal) => renewal.id));

        form.setData(
            'renewals',
            form.data.renewals.map((renewal) =>
                visibleIds.has(renewal.id)
                    ? {
                          ...renewal,
                          selected,
                      }
                    : renewal,
            ),
        );
    };

    return (
        <>
            <Head title="Customer Renewals" />
            <section className="legacy-renewal-summary">
                <article>
                    <CalendarClock size={22} />
                    <span>Total Renewals</span>
                    <strong>{renewals.length}</strong>
                </article>
                <article>
                    <RefreshCcw size={22} />
                    <span>Hosting / Domain</span>
                    <strong>{hostingCount}</strong>
                </article>
                <article>
                    <CheckSquare size={22} />
                    <span>Subscriptions</span>
                    <strong>{subscriptionCount}</strong>
                </article>
                <article>
                    <CheckSquare size={22} />
                    <span>Selected Updates</span>
                    <strong>{selectedCount}</strong>
                </article>
            </section>
            <form onSubmit={submit} className="legacy-panel">
                <div className="legacy-panel-title">
                    <span>Customer Renewal Search - {monthLabel}</span>
                    <div className="legacy-panel-tools">
                        <button
                            type="button"
                            className="minimize"
                            aria-expanded={!collapsed}
                            aria-label={
                                collapsed
                                    ? 'Expand renewals'
                                    : 'Collapse renewals'
                            }
                            title={
                                collapsed
                                    ? 'Expand renewals'
                                    : 'Collapse renewals'
                            }
                            onClick={() => setCollapsed((value) => !value)}
                        >
                            {collapsed ? '+' : '-'}
                        </button>
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
                        <label>
                            <span>Month / Year</span>
                            <input
                                type="month"
                                value={month}
                                onChange={(event) =>
                                    setMonth(event.target.value)
                                }
                            />
                        </label>
                        <button
                            type="button"
                            className="legacy-action-button"
                            onClick={() => setMonth(month)}
                        >
                            <Search size={15} />
                            Search
                        </button>
                        <button
                            type="submit"
                            className="legacy-action-button blue"
                            disabled={form.processing}
                        >
                            <CheckSquare size={15} />
                            Update Selected Customers
                        </button>
                        <p>
                            Search renewals by month, review the next renewal
                            date, select the rows to update, then save the
                            selected customers.
                        </p>
                    </div>
                    <h2 className="legacy-centered-heading">
                        Showing Customer Renewals for {monthLabel}
                    </h2>
                    <div className="legacy-table-toolbar">
                        <label>
                            Show{' '}
                            <select
                                value={pageSize}
                                onChange={(event) =>
                                    setPageSize(Number(event.target.value))
                                }
                            >
                                <option>10</option>
                                <option>25</option>
                                <option>50</option>
                                <option>100</option>
                            </select>{' '}
                            entries
                        </label>
                        <div className="legacy-bulk-actions">
                            <button
                                type="button"
                                onClick={() => setAllVisible(true)}
                            >
                                Select visible
                            </button>
                            <button
                                type="button"
                                onClick={() => setAllVisible(false)}
                            >
                                Clear visible
                            </button>
                        </div>
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
                        Showing {visibleRows.length === 0 ? 0 : 1} to{' '}
                        {visibleRows.length} of {rows.length} matching renewal
                        records. {selectedCount} selected.
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
                                visibleRows.map((renewal) => {
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
