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
import { Checkbox } from '@/components/ui/checkbox';
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
import type { Customer, User } from '@/types';

type UserRow = User & {
    customer?: Pick<Customer, 'id' | 'company_name'> | null;
};

type Props = {
    users: UserRow[];
    customers: Pick<Customer, 'id' | 'company_name'>[];
};

const emptyUser = {
    name: '',
    email: '',
    phone: '',
    role: 'customer',
    customer_id: '',
    is_active: true,
    password: '',
};

export default function UsersIndex({ users, customers }: Props) {
    const [editing, setEditing] = useState<UserRow | null>(null);
    const form = useForm({ ...emptyUser });

    const edit = (user: UserRow) => {
        setEditing(user);
        form.setData({
            name: user.name,
            email: user.email,
            phone: user.phone ?? '',
            role: user.role,
            customer_id: user.customer_id ? String(user.customer_id) : '',
            is_active: Boolean(user.is_active),
            password: '',
        });
    };

    const reset = () => {
        setEditing(null);
        form.setData({ ...emptyUser });
        form.clearErrors();
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: reset };

        if (editing) {
            form.put(`/users/${editing.id}`, options);

            return;
        }

        form.post('/users', options);
    };

    return (
        <>
            <Head title="Users & Roles" />
            <div className="grid gap-4 p-4 xl:grid-cols-[1fr_420px]">
                <Card>
                    <CardHeader>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>
                            Assign admin, staff, and customer login access.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="py-2 font-medium">
                                            User
                                        </th>
                                        <th className="py-2 font-medium">
                                            Role
                                        </th>
                                        <th className="py-2 font-medium">
                                            Customer
                                        </th>
                                        <th className="py-2 font-medium">
                                            Status
                                        </th>
                                        <th className="py-2 text-right font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="py-3">
                                                <div className="font-medium">
                                                    {user.name}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <Badge
                                                    variant={
                                                        user.role === 'admin'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="py-3">
                                                {user.customer?.company_name ??
                                                    'Internal'}
                                            </td>
                                            <td className="py-3">
                                                {user.is_active
                                                    ? 'Active'
                                                    : 'Disabled'}
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            edit(user)
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            router.delete(
                                                                `/users/${user.id}`,
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
                            {editing ? 'Edit User' : 'New User'}
                        </CardTitle>
                        <CardDescription>
                            Customer users require a linked customer record.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="flex flex-col gap-4">
                            <Field label="Name" error={form.errors.name}>
                                <Input
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    required
                                />
                            </Field>
                            <Field label="Email" error={form.errors.email}>
                                <Input
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) =>
                                        form.setData('email', e.target.value)
                                    }
                                    required
                                />
                            </Field>
                            <Field label="Phone" error={form.errors.phone}>
                                <Input
                                    value={form.data.phone}
                                    onChange={(e) =>
                                        form.setData('phone', e.target.value)
                                    }
                                />
                            </Field>
                            <Field label="Role" error={form.errors.role}>
                                <Select
                                    value={form.data.role}
                                    onValueChange={(value) =>
                                        form.setData('role', value)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {['admin', 'staff', 'customer'].map(
                                                (role) => (
                                                    <SelectItem
                                                        key={role}
                                                        value={role}
                                                    >
                                                        {role}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field
                                label="Linked Customer"
                                error={form.errors.customer_id}
                            >
                                <Select
                                    value={form.data.customer_id || 'none'}
                                    onValueChange={(value) =>
                                        form.setData(
                                            'customer_id',
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
                                                No customer
                                            </SelectItem>
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
                                label={editing ? 'New Password' : 'Password'}
                                error={form.errors.password}
                            >
                                <Input
                                    type="password"
                                    value={form.data.password}
                                    onChange={(e) =>
                                        form.setData('password', e.target.value)
                                    }
                                    required={!editing}
                                />
                            </Field>
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={form.data.is_active}
                                    onCheckedChange={(checked) =>
                                        form.setData(
                                            'is_active',
                                            checked === true,
                                        )
                                    }
                                />
                                Active account
                            </label>
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

UsersIndex.layout = {
    breadcrumbs: [{ title: 'Users & Roles', href: '/users' }],
};
