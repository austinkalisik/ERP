import { Head, Link, useForm } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    FileText,
    Pencil,
    Plus,
    ReceiptText,
    RotateCcw,
} from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Customer, CustomerSubscription } from '@/types';

type DocumentType = CustomerSubscription['payments'][number]['document_type'];

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

const documentTypeLabels: Record<DocumentType, string> = {
    invoice: 'Invoice',
    receipt: 'Receipt',
    contract: 'Contract',
    sla: 'SLA',
    purchase_order: 'Purchase Order',
    payment_proof: 'Payment Proof',
    other: 'Other',
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
    const [formCollapsed, setFormCollapsed] = useState(false);
    const [registerCollapsed, setRegisterCollapsed] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    const subscriptionForm = useForm({ ...emptySubscription });
    const paymentForm = useForm({
        paid_at: '',
        period_start: '',
        period_end: '',
        amount: '',
        payment_reference: '',
        invoice_number: '',
        document_type: 'invoice' as DocumentType,
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
                    document_type: 'invoice',
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

            <section
                className={[
                    'legacy-subscription-layout',
                    formCollapsed ? 'form-collapsed' : '',
                    registerCollapsed ? 'register-collapsed' : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
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
                            <button
                                type="button"
                                className="legacy-tool-button"
                                aria-expanded={!formCollapsed}
                                title={
                                    formCollapsed
                                        ? 'Expand create subscription form'
                                        : 'Collapse create subscription form'
                                }
                                onClick={() =>
                                    setFormCollapsed((value) => !value)
                                }
                            >
                                {formCollapsed ? (
                                    <ChevronsRight size={13} />
                                ) : (
                                    <ChevronsLeft size={13} />
                                )}
                            </button>
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
                    <div
                        className={
                            formCollapsed
                                ? 'legacy-panel-body hidden'
                                : 'legacy-panel-body'
                        }
                    >
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
                            <button
                                type="button"
                                className="legacy-tool-button"
                                aria-expanded={!registerCollapsed}
                                title={
                                    registerCollapsed
                                        ? 'Expand subscription register'
                                        : 'Collapse subscription register'
                                }
                                onClick={() =>
                                    setRegisterCollapsed((value) => !value)
                                }
                            >
                                {registerCollapsed ? '+' : '-'}
                            </button>
                        </div>
                    </div>
                    <div
                        className={
                            registerCollapsed
                                ? 'legacy-panel-body hidden'
                                : 'legacy-panel-body legacy-subscription-table-wrapper'
                        }
                    >
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
                                        (subscription) => {
                                            const isExpanded = expandedIds.has(
                                                subscription.id,
                                            );

                                            return (
                                                <Fragment key={subscription.id}>
                                                    <tr>
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
                                                                        .customer
                                                                        ?.email
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
                                                                /{' '}
                                                                {
                                                                    subscription.status
                                                                }
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
                                                                        .payments
                                                                        .length
                                                                }{' '}
                                                                payment records
                                                            </small>
                                                            {subscription.payments
                                                                .filter(
                                                                    (payment) =>
                                                                        payment.file_url,
                                                                )
                                                                .map(
                                                                    (
                                                                        payment,
                                                                    ) => (
                                                                        <Link
                                                                            key={
                                                                                payment.id
                                                                            }
                                                                            href={
                                                                                payment.file_url ??
                                                                                '#'
                                                                            }
                                                                            className="legacy-file-link"
                                                                        >
                                                                            <FileText
                                                                                size={
                                                                                    13
                                                                                }
                                                                            />
                                                                            {payment.file_name ??
                                                                                'Attachment'}
                                                                        </Link>
                                                                    ),
                                                                )}
                                                        </td>
                                                        <td>
                                                            <strong>
                                                                {subscription.credits.reduce(
                                                                    (
                                                                        total,
                                                                        credit,
                                                                    ) =>
                                                                        total +
                                                                        credit.months,
                                                                    0,
                                                                )}{' '}
                                                                months
                                                            </strong>
                                                            <small>
                                                                {
                                                                    subscription
                                                                        .credits
                                                                        .length
                                                                }{' '}
                                                                credit records
                                                            </small>
                                                        </td>
                                                        <td>
                                                            <div className="legacy-row-actions">
                                                                <button
                                                                    type="button"
                                                                    title={
                                                                        isExpanded
                                                                            ? 'Hide details'
                                                                            : 'Show details'
                                                                    }
                                                                    aria-expanded={
                                                                        isExpanded
                                                                    }
                                                                    onClick={() =>
                                                                        setExpandedIds(
                                                                            (
                                                                                current,
                                                                            ) => {
                                                                                const next =
                                                                                    new Set(
                                                                                        current,
                                                                                    );

                                                                                if (
                                                                                    next.has(
                                                                                        subscription.id,
                                                                                    )
                                                                                ) {
                                                                                    next.delete(
                                                                                        subscription.id,
                                                                                    );
                                                                                } else {
                                                                                    next.add(
                                                                                        subscription.id,
                                                                                    );
                                                                                }

                                                                                return next;
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    {isExpanded ? (
                                                                        <ChevronDown
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <ChevronRight
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    )}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    title="Edit subscription"
                                                                    onClick={() =>
                                                                        editSubscription(
                                                                            subscription,
                                                                        )
                                                                    }
                                                                >
                                                                    <Pencil
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
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
                                                                        size={
                                                                            14
                                                                        }
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
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr className="legacy-subscription-detail-row">
                                                            <td colSpan={7}>
                                                                <SubscriptionDetails
                                                                    subscription={
                                                                        subscription
                                                                    }
                                                                />
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        },
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
                            <span>Attachment Type</span>
                            <select
                                value={paymentForm.data.document_type}
                                onChange={(event) =>
                                    paymentForm.setData(
                                        'document_type',
                                        event.target.value as DocumentType,
                                    )
                                }
                            >
                                {Object.entries(documentTypeLabels).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ),
                                )}
                            </select>
                        </label>
                        <label className="legacy-field">
                            <span>Attachment File</span>
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

function SubscriptionDetails({
    subscription,
}: {
    subscription: CustomerSubscription;
}) {
    return (
        <div className="legacy-subscription-detail">
            <section>
                <h3>Service Details</h3>
                <dl>
                    <DetailItem
                        label="Client"
                        value={subscription.customer?.company_name}
                    />
                    <DetailItem
                        label="Contact"
                        value={subscription.customer?.contact_name}
                    />
                    <DetailItem
                        label="Phone"
                        value={subscription.customer?.phone}
                    />
                    <DetailItem
                        label="Reference"
                        value={subscription.reference}
                    />
                    <DetailItem label="Status" value={subscription.status} />
                    <DetailItem label="Notes" value={subscription.notes} />
                </dl>
            </section>
            <section>
                <h3>Payments And Attachments</h3>
                {subscription.payments.length === 0 ? (
                    <p>No payment or attachment records.</p>
                ) : (
                    <table className="legacy-detail-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Reference</th>
                                <th>Attachment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscription.payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td>{formatDate(payment.paid_at)}</td>
                                    <td>
                                        {
                                            documentTypeLabels[
                                                payment.document_type
                                            ]
                                        }
                                    </td>
                                    <td>{formatMoney(payment.amount)}</td>
                                    <td>
                                        {payment.invoice_number ??
                                            payment.payment_reference ??
                                            '-'}
                                    </td>
                                    <td>
                                        {payment.file_url ? (
                                            <Link
                                                href={payment.file_url}
                                                className="legacy-file-link"
                                            >
                                                <FileText size={13} />
                                                {payment.file_name ??
                                                    'Attachment'}
                                            </Link>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
            <section>
                <h3>Credits</h3>
                {subscription.credits.length === 0 ? (
                    <p>No credit records.</p>
                ) : (
                    <table className="legacy-detail-table">
                        <thead>
                            <tr>
                                <th>Start</th>
                                <th>End</th>
                                <th>Months</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscription.credits.map((credit) => (
                                <tr key={credit.id}>
                                    <td>{formatDate(credit.starts_at)}</td>
                                    <td>{formatDate(credit.ends_at)}</td>
                                    <td>{credit.months}</td>
                                    <td>{credit.reason ?? '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}

function DetailItem({
    label,
    value,
}: {
    label: string;
    value?: string | null;
}) {
    return (
        <>
            <dt>{label}</dt>
            <dd>{value || '-'}</dd>
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
