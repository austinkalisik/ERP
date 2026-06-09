import { Head, useForm } from '@inertiajs/react';
import { Star } from 'lucide-react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';

const emptyCustomer = {
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    industry: 'Hosting',
    status: 'active',
    website: '',
    address: '',
    notes: '',
    hosting_start_date: '',
    next_follow_up_at: '',
};

const minDate = '2000-01-01';
const maxDate = '2099-12-31';

export default function AddCustomer() {
    const form = useForm({ ...emptyCustomer });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.clearErrors('hosting_start_date', 'next_follow_up_at');

        if (!isValidDateValue(form.data.hosting_start_date)) {
            form.setError(
                'hosting_start_date',
                'Enter a valid start date between 2000 and 2099.',
            );

            return;
        }

        if (!isValidDateValue(form.data.next_follow_up_at)) {
            form.setError(
                'next_follow_up_at',
                'Enter a valid renewal date between 2000 and 2099.',
            );

            return;
        }

        if (
            form.data.hosting_start_date &&
            form.data.next_follow_up_at &&
            form.data.next_follow_up_at < form.data.hosting_start_date
        ) {
            form.setError(
                'next_follow_up_at',
                'Renewal date must be on or after the start date.',
            );

            return;
        }

        form.post('/customers', { preserveScroll: true });
    };

    return (
        <>
            <Head title="Add New Customer" />
            <form onSubmit={submit} className="legacy-panel legacy-form-panel">
                <div className="legacy-panel-title">
                    <span>Customer and Plan Details</span>
                    <button
                        type="submit"
                        className="legacy-save"
                        disabled={form.processing}
                    >
                        <Star size={14} /> Save Customer
                    </button>
                </div>
                <div className="legacy-panel-body">
                    <div className="legacy-form-grid">
                        <section>
                            <h2>Contact &amp; Account Details</h2>
                            <Field label="Customer Name">
                                <input
                                    value={form.data.company_name}
                                    onChange={(e) =>
                                        form.setData(
                                            'company_name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Customer Name"
                                    required
                                />
                            </Field>
                            <Field label="Contact Name">
                                <input
                                    value={form.data.contact_name}
                                    onChange={(e) =>
                                        form.setData(
                                            'contact_name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contact Name"
                                    required
                                />
                            </Field>
                            <Field label="Address">
                                <textarea
                                    value={form.data.address}
                                    onChange={(e) =>
                                        form.setData('address', e.target.value)
                                    }
                                    placeholder=""
                                />
                            </Field>
                            <Field label="Phone">
                                <input
                                    value={form.data.phone}
                                    onChange={(e) =>
                                        form.setData('phone', e.target.value)
                                    }
                                    placeholder="Phone Number"
                                />
                            </Field>
                            <Field label="Email Address">
                                <input
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) =>
                                        form.setData('email', e.target.value)
                                    }
                                    placeholder="Email Address"
                                    required
                                />
                            </Field>
                        </section>

                        <section>
                            <h2>Plan Details</h2>
                            <div className="legacy-customer-type">
                                <OptionGroup
                                    label="Customer Type"
                                    options={[
                                        {
                                            label: 'Current Customer',
                                            type: 'checkbox',
                                            defaultChecked: true,
                                        },
                                        {
                                            label: 'Complimentary',
                                            type: 'checkbox',
                                        },
                                    ]}
                                />
                                <OptionGroup
                                    label="OWA Customer"
                                    options={[
                                        {
                                            label: 'Yes',
                                            type: 'radio',
                                            name: 'owa',
                                        },
                                        {
                                            label: 'No',
                                            type: 'radio',
                                            name: 'owa',
                                            defaultChecked: true,
                                        },
                                    ]}
                                />
                                <OptionGroup
                                    label="OWA-A Customer"
                                    options={[
                                        {
                                            label: 'Yes',
                                            type: 'radio',
                                            name: 'owaa',
                                        },
                                        {
                                            label: 'No',
                                            type: 'radio',
                                            name: 'owaa',
                                            defaultChecked: true,
                                        },
                                    ]}
                                />
                            </div>
                            <Field label="Hosting Plan">
                                <select
                                    value={form.data.industry}
                                    onChange={(e) =>
                                        form.setData('industry', e.target.value)
                                    }
                                >
                                    <option>Mail only</option>
                                    <option>Hosting</option>
                                    <option>Domain</option>
                                    <option>Premium</option>
                                </select>
                            </Field>
                            <Field
                                label="Start Date"
                                error={form.errors.hosting_start_date}
                            >
                                <input
                                    type="date"
                                    min={minDate}
                                    max={maxDate}
                                    value={form.data.hosting_start_date}
                                    onChange={(e) =>
                                        form.setData(
                                            'hosting_start_date',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Hosting Start Date"
                                />
                            </Field>
                            <Field
                                label="Renewal Date"
                                error={form.errors.next_follow_up_at}
                            >
                                <input
                                    type="date"
                                    min={
                                        form.data.hosting_start_date || minDate
                                    }
                                    max={maxDate}
                                    value={form.data.next_follow_up_at}
                                    onChange={(e) =>
                                        form.setData(
                                            'next_follow_up_at',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field label="Invoice Cycle">
                                <select>
                                    <option>Yearly</option>
                                    <option>Monthly</option>
                                </select>
                            </Field>
                            <Field label="Spam Filter Blocks">
                                <input placeholder="Spam Filter Blocks" />
                            </Field>
                            <Field label="Spam Filter Emails">
                                <input placeholder="Spam Filter Mailboxes" />
                            </Field>
                        </section>
                    </div>

                    <section className="legacy-host-row">
                        <h2>Host Location Details</h2>
                        <div>
                            <Field label="Host Location">
                                <input placeholder="Host Location" />
                            </Field>
                            <Field label="CP Username">
                                <input placeholder="CP Username" />
                            </Field>
                            <Field label="CP Password">
                                <input placeholder="CP Password" />
                            </Field>
                        </div>
                    </section>
                </div>
            </form>
        </>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="legacy-field">
            <span>{label}</span>
            {children}
            <InputError message={error} />
        </label>
    );
}

function isValidDateValue(value: string) {
    if (!value) {
        return true;
    }

    return value >= minDate && value <= maxDate;
}

function OptionGroup({
    label,
    options,
}: {
    label: string;
    options: {
        label: string;
        type: 'checkbox' | 'radio';
        name?: string;
        defaultChecked?: boolean;
    }[];
}) {
    return (
        <fieldset className="legacy-option-group">
            <legend>{label}</legend>
            <div>
                {options.map((option) => (
                    <label key={`${option.name ?? label}-${option.label}`}>
                        <input
                            type={option.type}
                            name={option.name}
                            defaultChecked={option.defaultChecked}
                        />
                        <span>{option.label}</span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

AddCustomer.layout = {
    breadcrumbs: [{ title: 'Add New Customer', href: '/add-customer' }],
};
