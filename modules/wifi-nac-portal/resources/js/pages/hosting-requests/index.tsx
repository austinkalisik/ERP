import { Head, router, useForm } from '@inertiajs/react';
import { Save, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Customer, DomainHostingRequest } from '@/types';

type Props = {
    requests: DomainHostingRequest[];
    customers: Pick<Customer, 'id' | 'company_name'>[];
    staff: { id: number; name: string }[];
};

const emptyRequest = {
    customer_id: '',
    assigned_to: '',
    domain_name: '',
    service_type: 'domain_hosting',
    plan: 'value',
    status: 'new',
    requested_start_date: '',
    renewal_date: '',
    quoted_amount: '',
    requirements: '',
    internal_notes: '',
};

export default function HostingRequestsIndex({
    requests,
    customers,
    staff,
}: Props) {
    const [editing, setEditing] = useState<DomainHostingRequest | null>(null);
    const form = useForm({ ...emptyRequest });

    const edit = (request: DomainHostingRequest) => {
        setEditing(request);
        form.setData({
            customer_id: String(request.customer_id),
            assigned_to: request.assigned_to ? String(request.assigned_to) : '',
            domain_name: request.domain_name,
            service_type: request.service_type,
            plan: request.plan,
            status: request.status,
            requested_start_date: request.requested_start_date ?? '',
            renewal_date: request.renewal_date ?? '',
            quoted_amount: request.quoted_amount
                ? String(request.quoted_amount)
                : '',
            requirements: request.requirements ?? '',
            internal_notes: request.internal_notes ?? '',
        });
    };

    const reset = () => {
        setEditing(null);
        form.setData({ ...emptyRequest });
        form.clearErrors();
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: reset };

        if (editing) {
            form.put(`/hosting-requests/${editing.id}`, options);

            return;
        }

        form.post('/hosting-requests', options);
    };

    return (
        <>
            <Head title="Service Requests" />
            <div className="grid gap-4 p-4 xl:grid-cols-[1fr_420px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Service Requests</CardTitle>
                        <CardDescription>
                            Track hosting, domains, email security, ISP, CCTV,
                            document systems, development, quotes, and renewals.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="py-2 font-medium">
                                            Domain
                                        </th>
                                        <th className="py-2 font-medium">
                                            Customer
                                        </th>
                                        <th className="py-2 font-medium">
                                            Plan
                                        </th>
                                        <th className="py-2 font-medium">
                                            Status
                                        </th>
                                        <th className="py-2 font-medium">
                                            Assignee
                                        </th>
                                        <th className="py-2 text-right font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((request) => (
                                        <tr
                                            key={request.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="py-3">
                                                <div className="font-medium">
                                                    {request.domain_name}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {request.service_type.replaceAll(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                {request.customer?.company_name}
                                            </td>
                                            <td className="py-3">
                                                {request.plan}
                                            </td>
                                            <td className="py-3">
                                                <Badge
                                                    variant={
                                                        request.status ===
                                                        'completed'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {request.status.replaceAll(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </Badge>
                                            </td>
                                            <td className="py-3">
                                                {request.assignee?.name ??
                                                    'Unassigned'}
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            edit(request)
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            router.delete(
                                                                `/hosting-requests/${request.id}`,
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <Trash2 data-icon="inline-start" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {editing ? 'Edit Request' : 'New Request'}
                        </CardTitle>
                        <CardDescription>
                            Use this for NextGen ICT service fulfillment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="flex flex-col gap-4">
                            <Field
                                label="Customer"
                                error={form.errors.customer_id}
                            >
                                <Select
                                    value={form.data.customer_id}
                                    onValueChange={(value) =>
                                        form.setData('customer_id', value)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {customers.map((customer) => (
                                                <SelectItem
                                                    key={customer.id}
                                                    value={String(customer.id)}
                                                >
                                                    {customer.company_name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field
                                label="Domain"
                                error={form.errors.domain_name}
                            >
                                <Input
                                    value={form.data.domain_name}
                                    onChange={(e) =>
                                        form.setData(
                                            'domain_name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="example.com"
                                    required
                                />
                            </Field>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Choice
                                    label="Service"
                                    value={form.data.service_type}
                                    values={[
                                        'domain_registration',
                                        'website_hosting',
                                        'email_hosting',
                                        'email_antispam',
                                        'domain_hosting',
                                        'ssl',
                                        'domain_transfer',
                                        'isp_connectivity',
                                        'network_infrastructure',
                                        'cctv_security',
                                        'document_management',
                                        'vehicle_tracking',
                                        'audio_visual',
                                        'web_app_development',
                                        'support_contract',
                                    ]}
                                    onChange={(value) =>
                                        form.setData('service_type', value)
                                    }
                                    error={form.errors.service_type}
                                />
                                <Choice
                                    label="Plan"
                                    value={form.data.plan}
                                    values={[
                                        'basic',
                                        'standard',
                                        'value',
                                        'premium',
                                        'starter',
                                        'business',
                                        'enterprise',
                                        'custom',
                                    ]}
                                    onChange={(value) =>
                                        form.setData('plan', value)
                                    }
                                    error={form.errors.plan}
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Choice
                                    label="Status"
                                    value={form.data.status}
                                    values={[
                                        'new',
                                        'reviewing',
                                        'quoted',
                                        'approved',
                                        'provisioning',
                                        'completed',
                                        'cancelled',
                                    ]}
                                    onChange={(value) =>
                                        form.setData('status', value)
                                    }
                                    error={form.errors.status}
                                />
                                <Field
                                    label="Assignee"
                                    error={form.errors.assigned_to}
                                >
                                    <Select
                                        value={form.data.assigned_to || 'none'}
                                        onValueChange={(value) =>
                                            form.setData(
                                                'assigned_to',
                                                value === 'none' ? '' : value,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="none">
                                                    Unassigned
                                                </SelectItem>
                                                {staff.map((user) => (
                                                    <SelectItem
                                                        key={user.id}
                                                        value={String(user.id)}
                                                    >
                                                        {user.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    label="Start Date"
                                    error={form.errors.requested_start_date}
                                >
                                    <Input
                                        type="date"
                                        value={form.data.requested_start_date}
                                        onChange={(e) =>
                                            form.setData(
                                                'requested_start_date',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Renewal Date"
                                    error={form.errors.renewal_date}
                                >
                                    <Input
                                        type="date"
                                        value={form.data.renewal_date}
                                        onChange={(e) =>
                                            form.setData(
                                                'renewal_date',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            </div>
                            <Field
                                label="Quoted Amount"
                                error={form.errors.quoted_amount}
                            >
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.quoted_amount}
                                    onChange={(e) =>
                                        form.setData(
                                            'quoted_amount',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Requirements"
                                error={form.errors.requirements}
                            >
                                <Input
                                    value={form.data.requirements}
                                    onChange={(e) =>
                                        form.setData(
                                            'requirements',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Internal Notes"
                                error={form.errors.internal_notes}
                            >
                                <Input
                                    value={form.data.internal_notes}
                                    onChange={(e) =>
                                        form.setData(
                                            'internal_notes',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    <Save data-icon="inline-start" />
                                    {editing ? 'Update' : 'Create'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={reset}
                                >
                                    Clear
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function Choice({
    label,
    value,
    values,
    onChange,
    error,
}: {
    label: string;
    value: string;
    values: string[];
    onChange: (value: string) => void;
    error?: string;
}) {
    return (
        <Field label={label} error={error}>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {values.map((item) => (
                            <SelectItem key={item} value={item}>
                                {item.replaceAll('_', ' ')}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </Field>
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
        <div className="flex flex-col gap-2">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

HostingRequestsIndex.layout = {
    breadcrumbs: [{ title: 'Service Requests', href: '/hosting-requests' }],
};
