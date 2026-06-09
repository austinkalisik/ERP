import { Head, Link, useForm } from '@inertiajs/react';
import { FileText, Pencil, Plus, ReceiptText, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Customer, CustomerSubscription } from '@/types';

type Props = {
    customers: Pick<
        Customer,
        'id' | 'company_name' | 'contact_name' | 'email'
    >[];
    serviceTypes: Record<string, string>;
    subscriptions: CustomerSubscription[];
};

const emptySubscription = {
    customer_id: '',
    service_type: 'domain_hosting',
    service_name: '',
    reference: '',
    status: 'active',
    starts_at: '',
    expires_at: '',
    renewal_cycle: 'yearly',
    amount: '',
    notes: '',
};

export default function SubscriptionsIndex({
    customers,
    serviceTypes,
    subscriptions,
}: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [paymentTarget, setPaymentTarget] =
        useState<CustomerSubscription | null>(null);
    const [creditTarget, setCreditTarget] =
        useState<CustomerSubscription | null>(null);
    const [search, setSearch] = useState('');

    const subscriptionForm = useForm({ ...emptySubscription });
    const paymentForm = useForm({
        paid_at: '',
        period_start: '',
        period_end: '',
        amount: '',
        payment_reference: '',
        invoice_number: '',
        attachment: null as File | null,
        notes: '',
    });
    const creditForm = useForm({
        starts_at: '',
        ends_at: '',
        amount: '',
        reason: '',
    });

    const filteredSubscriptions = useMemo(
        () =>
            subscriptions.filter((subscription) =>
                [
                    subscription.customer?.company_name ?? '',
                    subscription.service_label,
                    subscription.service_name ?? '',
                    subscription.reference ?? '',
                    subscription.status,
                    subscription.renewal_cycle,
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(search.toLowerCase()),
            ),
        [search, subscriptions],
    );

    const groupedCounts = useMemo(
        () =>
            Object.entries(serviceTypes).map(([key, label]) => ({
                key,
                label,
                count: subscriptions.filter(
                    (subscription) => subscription.service_type === key,
                ).length,
            })),
        [serviceTypes, subscriptions],
    );

    const saveSubscription = (event: FormEvent) => {
        event.preventDefault();

        if (editingId) {
            subscriptionForm.put(`/subscriptions/${editingId}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingId(null);
                    subscriptionForm.setData({ ...emptySubscription });
                },
            });

            return;
        }

        subscriptionForm.post('/subscriptions', {
            preserveScroll: true,
            onSuccess: () => subscriptionForm.setData({ ...emptySubscription }),
        });
    };

    const editSubscription = (subscription: CustomerSubscription) => {
        setEditingId(subscription.id);
        subscriptionForm.setData({
            customer_id: String(subscription.customer_id),
            service_type: subscription.service_type,
            service_name: subscription.service_name ?? '',
            reference: subscription.reference ?? '',
            status: subscription.status,
            starts_at: subscription.starts_at ?? '',
            expires_at: subscription.expires_at ?? '',
            renewal_cycle: subscription.renewal_cycle,
            amount: subscription.amount ? String(subscription.amount) : '',
            notes: subscription.notes ?? '',
        });
    };

    const savePayment = (event: FormEvent) => {
        event.preventDefault();

        if (!paymentTarget) {
            return;
        }

        paymentForm.post(`/subscriptions/${paymentTarget.id}/payments`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                paymentForm.setData({
                    paid_at: '',
                    period_start: '',
                    period_end: '',
                    amount: '',
                    payment_reference: '',
                    invoice_number: '',
                    attachment: null,
                    notes: '',
                });
                setPaymentTarget(null);
            },
        });
    };

    const saveCredit = (event: FormEvent) => {
        event.preventDefault();

        if (!creditTarget) {
            return;
        }

        creditForm.post(`/subscriptions/${creditTarget.id}/credits`, {
            preserveScroll: true,
            onSuccess: () => {
                creditForm.setData({
                    starts_at: '',
                    ends_at: '',
                    amount: '',
                    reason: '',
                });
                setCreditTarget(null);
            },
        });
    };

    return (
        <>
            <Head title="Subscriptions" />

            <section className="legacy-subscription-summary">
                {groupedCounts.map((item) => (
                    <article key={item.key}>
                        <span>{item.label}</span>
                        <strong>{item.count}</strong>
                    </article>
                ))}
            </section>

            <section className="legacy-subscription-layout">
                <form
                    onSubmit={saveSubscription}
                    className="legacy-panel legacy-subscription-form"
                >
                    <div className="legacy-panel-title">
                        <span>
                            {editingId
                                ? 'Edit Subscription'
                                : 'Create Subscription'}
                        </span>
                        <div className="legacy-panel-tools">
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(null);
                                        subscriptionForm.setData({
                                            ...emptySubscription,
                                        });
                                    }}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="legacy-panel-body">
                        <label className="legacy-field">
                            <span>Client</span>
                            <select
                                value={subscriptionForm.data.customer_id}
                                onChange={(event) =>
                                    subscriptionForm.setData(
                                        'customer_id',
                                        event.target.value,
                                    )
                                }
                            >
                                <option value="">Select client</option>
                                {customers.map((customer) => (
                                    <option
                                        key={customer.id}
                                        value={customer.id}
                                    >
                                        {customer.company_name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="legacy-field">
                            <span>Service Category</span>
                            <select
                                value={subscriptionForm.data.service_type}
                                onChange={(event) =>
                                    subscriptionForm.setData(
                                        'service_type',
                                        event.target.value,
                                    )
                                }
                            >
                                {Object.entries(serviceTypes).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ),
                                )}
                            </select>
                        </label>

                        <div className="legacy-two-col">
                            <label className="legacy-field">
                                <span>Service Name</span>
                                <input
                                    value={subscriptionForm.data.service_name}
                                    onChange={(event) =>
                                        subscriptionForm.setData(
                                            'service_name',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Business Fibre, GPS Fleet, Domain"
                                />
                            </label>
                            <label className="legacy-field">
                                <span>Reference</span>
                                <input
                                    value={subscriptionForm.data.reference}
                                    onChange={(event) =>
                                        subscriptionForm.setData(
                                            'reference',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Domain, account, circuit, asset"
                                />
                            </label>
                        </div>

                        <div className="legacy-two-col">
                            <label className="legacy-field">
                                <span>Start Date</span>
                                <input
                                    type="date"
                                    value={subscriptionForm.data.starts_at}
                                    onChange={(event) =>
                                        subscriptionForm.setData(
                                            'starts_at',
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>
                            <label className="legacy-field">
                                <span>Expiry / Renewal Date</span>
                                <input
                                    type="date"
                                    value={subscriptionForm.data.expires_at}
                                    onChange={(event) =>
                                        subscriptionForm.setData(
                                            'expires_at',
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>
                        </div>

                        <div className="legacy-three-col">
                            <label className="legacy-field">
                                <span>Cycle</span>
                                <select
                                    value={subscriptionForm.data.renewal_cycle}
                                    onChange={(event) =>
                                        subscriptionForm.setData(
                                            'renewal_cycle',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </label>
                            <label className="legacy-field">
                                <span>Status</span>
                                <select
                                    value={subscriptionForm.data.status}
                                    onChange={(event) =>
                                        subscriptionForm.setData(
                                            'status',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </label>
                            <label className="legacy-field">
                                <span>Amount</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={subscriptionForm.data.amount}
                                    onChange={(event) =>
                                        subscriptionForm.setData(
                                            'amount',
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>
                        </div>

                        <label className="legacy-field">
                            <span>Notes</span>
                            <textarea
                                value={subscriptionForm.data.notes}
                                onChange={(event) =>
                                    subscriptionForm.setData(
                                        'notes',
                                        event.target.value,
                                    )
                                }
                            />
                        </label>

                        <button
                            type="submit"
                            className="legacy-action-button"
                            disabled={subscriptionForm.processing}
                        >
                            <Plus size={15} />
                            {editingId
                                ? 'Update Subscription'
                                : 'Save Subscription'}
                        </button>
                    </div>
                </form>

                <section className="legacy-panel">
                    <div className="legacy-panel-title">
                        <span>Client Subscription Register</span>
                        <div className="legacy-panel-tools">
                            <input
                                aria-label="Search subscriptions"
                                placeholder="Search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                            />
                        </div>
                    </div>
                    <div className="legacy-panel-body">
                        <table className="legacy-table legacy-subscription-table">
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Service</th>
                                    <th>Start</th>
                                    <th>Expiry</th>
                                    <th>Payment / Files</th>
                                    <th>Credits</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSubscriptions.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="legacy-loading"
                                        >
                                            No subscriptions found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubscriptions.map(
                                        (subscription) => (
                                            <tr key={subscription.id}>
                                                <td>
                                                    <strong>
                                                        {
                                                            subscription
                                                                .customer
                                                                ?.company_name
                                                        }
                                                    </strong>
                                                    <small>
                                                        {
                                                            subscription
                                                                .customer?.email
                                                        }
                                                    </small>
                                                </td>
                                                <td>
                                                    <strong>
                                                        {
                                                            subscription.service_label
                                                        }
                                                    </strong>
                                                    <small>
                                                        {subscription.service_name ??
                                                            subscription.reference ??
                                                            '-'}{' '}
                                                        / {subscription.status}
                                                    </small>
                                                </td>
                                                <td>
                                                    {formatDate(
                                                        subscription.starts_at,
                                                    )}
                                                </td>
                                                <td>
                                                    <strong>
                                                        {formatDate(
                                                            subscription.expires_at,
                                                        )}
                                                    </strong>
                                                    <small>
                                                        {
                                                            subscription.renewal_cycle
                                                        }
                                                    </small>
                                                </td>
                                                <td>
                                                    <strong>
                                                        {formatMoney(
                                                            subscription.payments.reduce(
                                                                (
                                                                    total,
                                                                    payment,
                                                                ) =>
                                                                    total +
                                                                    Number(
                                                                        payment.amount,
                                                                    ),
                                                                0,
                                                            ),
                                                        )}
                                                    </strong>
                                                    <small>
                                                        {
                                                            subscription
                                                                .payments.length
                                                        }{' '}
                                                        payment records
                                                    </small>
                                                    {subscription.payments
                                                        .filter(
                                                            (payment) =>
                                                                payment.file_url,
                                                        )
                                                        .map((payment) => (
                                                            <Link
                                                                key={payment.id}
                                                                href={
                                                                    payment.file_url ??
                                                                    '#'
                                                                }
                                                                className="legacy-file-link"
                                                            >
                                                                <FileText
                                                                    size={13}
                                                                />
                                                                {payment.file_name ??
                                                                    'Attachment'}
                                                            </Link>
                                                        ))}
                                                </td>
                                                <td>
                                                    <strong>
                                                        {subscription.credits.reduce(
                                                            (total, credit) =>
                                                                total +
                                                                credit.months,
                                                            0,
                                                        )}{' '}
                                                        months
                                                    </strong>
                                                    <small>
                                                        {
                                                            subscription.credits
                                                                .length
                                                        }{' '}
                                                        credit records
                                                    </small>
                                                </td>
                                                <td>
                                                    <div className="legacy-row-actions">
                                                        <button
                                                            type="button"
                                                            title="Edit subscription"
                                                            onClick={() =>
                                                                editSubscription(
                                                                    subscription,
                                                                )
                                                            }
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="Add payment or invoice"
                                                            onClick={() =>
                                                                setPaymentTarget(
                                                                    subscription,
                                                                )
                                                            }
                                                        >
                                                            <ReceiptText
                                                                size={14}
                                                            />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="Add service credit"
                                                            onClick={() =>
                                                                setCreditTarget(
                                                                    subscription,
                                                                )
                                                            }
                                                        >
                                                            <RotateCcw
                                                                size={14}
                                                            />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ),
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </section>

            {paymentTarget && (
                <Modal title={`Payment - ${paymentTarget.service_label}`}>
                    <form onSubmit={savePayment} className="legacy-modal-form">
                        <div className="legacy-three-col">
                            <label className="legacy-field">
                                <span>Paid Date</span>
                                <input
                                    type="date"
                                    value={paymentForm.data.paid_at}
                                    onChange={(event) =>
                                        paymentForm.setData(
                                            'paid_at',
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>
                            <label className="legacy-field">
                                <span>Period Start</span>
                                <input
                                    type="date"
                                    value={paymentForm.data.period_start}
                                    onChange={(event) =>
                                        paymentForm.setData(
                                            'period_start',
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>
                            <label className="legacy-field">
                                <span>Period End</span>
                                <input
                                    type="date"
                                    value={paymentForm.data.period_end}
                                    onChange={(event) =>
                                        paymentForm.setData(
                                            'period_end',
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>
                        </div>
                        <div className="legacy-three-col">
                            <label className="legacy-field">
                                <span>Amount</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={paymentForm.data.amount}
                                    onChange={(event) =>
                                        paymentForm.setData(
                                            'amount',
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>
                            <label className="legacy-field">
                                <span>Invoice No.</span>
                                <input
                                    value={paymentForm.data.invoice_number}
                                    onChange={(event) =>
                                        paymentForm.setData(
                                            'invoice_number',
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>
                            <label className="legacy-field">
                                <span>Reference</span>
                                <input
                                    value={paymentForm.data.payment_reference}
                                    onChange={(event) =>
                                        paymentForm.setData(
                                            'payment_reference',
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>
                        </div>
                        <label className="legacy-field">
                            <span>Payment / Invoice File</span>
                            <input
                                type="file"
                                onChange={(event) =>
                                    paymentForm.setData(
                                        'attachment',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                            />
                        </label>
                        <label className="legacy-field">
                            <span>Notes</span>
                            <textarea
                                value={paymentForm.data.notes}
                                onChange={(event) =>
                                    paymentForm.setData(
                                        'notes',
                                        event.target.value,
                                    )
                                }
                            />
                        </label>
                        <div className="legacy-modal-actions">
                            <button
                                type="button"
                                onClick={() => setPaymentTarget(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="legacy-action-button"
                                disabled={paymentForm.processing}
                            >
                                Save Payment
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {creditTarget && (
                <Modal title={`Service Credit - ${creditTarget.service_label}`}>
                    <form onSubmit={saveCredit} className="legacy-modal-form">
                        <div className="legacy-three-col">
                            <label className="legacy-field">
                                <span>Credit Start</span>
                                <input
                                    type="date"
                                    value={creditForm.data.starts_at}
                                    onChange={(event) =>
                                        creditForm.setData(
                                            'starts_at',
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>
                            <label className="legacy-field">
                                <span>Credit End</span>
                                <input
                                    type="date"
                                    value={creditForm.data.ends_at}
                                    onChange={(event) =>
                                        creditForm.setData(
                                            'ends_at',
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>
                            <label className="legacy-field">
                                <span>Credit Value</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={creditForm.data.amount}
                                    onChange={(event) =>
                                        creditForm.setData(
                                            'amount',
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>
                        </div>
                        <label className="legacy-field">
                            <span>Reason</span>
                            <textarea
                                value={creditForm.data.reason}
                                onChange={(event) =>
                                    creditForm.setData(
                                        'reason',
                                        event.target.value,
                                    )
                                }
                                placeholder="ISP outage from March to April 2026"
                            />
                        </label>
                        <div className="legacy-modal-actions">
                            <button
                                type="button"
                                onClick={() => setCreditTarget(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="legacy-action-button"
                                disabled={creditForm.processing}
                            >
                                Apply Credit
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}

function Modal({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="legacy-modal-backdrop">
            <section className="legacy-modal">
                <h2>{title}</h2>
                {children}
            </section>
        </div>
    );
}

function formatDate(value: string | null) {
    if (!value) {
        return '-';
    }

    const [year, month, day] = value.split('-');

    return `${day}/${month}/${year}`;
}

function formatMoney(value: string | number | null) {
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat('en-PG', {
        style: 'currency',
        currency: 'PGK',
    }).format(amount);
}

SubscriptionsIndex.layout = {
    breadcrumbs: [{ title: 'Subscriptions', href: '/subscriptions' }],
};
