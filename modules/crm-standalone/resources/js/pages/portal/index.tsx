import { Head, useForm } from '@inertiajs/react';
import { Send } from 'lucide-react';
import type { FormEvent } from 'react';
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
    customer: Customer | null;
    requests: DomainHostingRequest[];
};

export default function CustomerPortal({ customer, requests }: Props) {
    const form = useForm({
        customer_id: customer ? String(customer.id) : '',
        domain_name: '',
        service_type: 'domain_hosting',
        plan: 'value',
        status: 'new',
        requested_start_date: '',
        renewal_date: '',
        assigned_to: '',
        quoted_amount: '',
        requirements: '',
        internal_notes: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/hosting-requests', {
            preserveScroll: true,
            onSuccess: () =>
                form.reset(
                    'domain_name',
                    'requirements',
                    'requested_start_date',
                    'renewal_date',
                ),
        });
    };

    return (
        <>
            <Head title="Customer Portal" />
            <div className="grid gap-4 p-4 xl:grid-cols-[1fr_420px]">
                <Card>
                    <CardHeader>
                        <CardTitle>My Services</CardTitle>
                        <CardDescription>
                            {customer
                                ? `${customer.company_name} domain and hosting requests.`
                                : 'Your login is not linked to a customer record yet.'}
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
                                            Service
                                        </th>
                                        <th className="py-2 font-medium">
                                            Plan
                                        </th>
                                        <th className="py-2 font-medium">
                                            Status
                                        </th>
                                        <th className="py-2 font-medium">
                                            Renewal
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((request) => (
                                        <tr
                                            key={request.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="py-3 font-medium">
                                                {request.domain_name}
                                            </td>
                                            <td className="py-3">
                                                {request.service_type.replaceAll(
                                                    '_',
                                                    ' ',
                                                )}
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
                                                {request.renewal_date ??
                                                    'Pending'}
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
                        <CardTitle>Request Domain Hosting</CardTitle>
                        <CardDescription>
                            Send a new service request to NextGen support.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="flex flex-col gap-4">
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
                                    disabled={!customer}
                                    required
                                />
                            </Field>
                            <Field
                                label="Service"
                                error={form.errors.service_type}
                            >
                                <Select
                                    value={form.data.service_type}
                                    onValueChange={(value) =>
                                        form.setData('service_type', value)
                                    }
                                    disabled={!customer}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {[
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
                                            ].map((item) => (
                                                <SelectItem
                                                    key={item}
                                                    value={item}
                                                >
                                                    {item.replaceAll('_', ' ')}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Plan" error={form.errors.plan}>
                                <Select
                                    value={form.data.plan}
                                    onValueChange={(value) =>
                                        form.setData('plan', value)
                                    }
                                    disabled={!customer}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {[
                                                'basic',
                                                'standard',
                                                'value',
                                                'premium',
                                                'starter',
                                                'business',
                                                'enterprise',
                                                'custom',
                                            ].map((item) => (
                                                <SelectItem
                                                    key={item}
                                                    value={item}
                                                >
                                                    {item}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field
                                label="Preferred Start"
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
                                    disabled={!customer}
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
                                    disabled={!customer}
                                />
                            </Field>
                            <Button
                                type="submit"
                                disabled={!customer || form.processing}
                            >
                                <Send data-icon="inline-start" />
                                Submit Request
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
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
        <div className="flex flex-col gap-2">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

CustomerPortal.layout = {
    breadcrumbs: [{ title: 'Customer Portal', href: '/dashboard' }],
};
