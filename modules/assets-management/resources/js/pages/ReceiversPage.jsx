import React, { useMemo } from 'react';
import CRUDPage from '../components/CRUDPage';
import { useApi } from '../hooks/useApi';

function statusLabel(value) {
    return value ? 'Active' : 'Inactive';
}

export default function ReceiversPage() {
    const { data: departmentsPayload } = useApi('/departments', { params: { per_page: 100 } }, { ttl: 180000 });
    const departments = departmentsPayload?.data || departmentsPayload || [];

    const departmentOptions = useMemo(
        () =>
            departments.map((department) => ({
                value: String(department.id),
                label: department.name,
            })),
        [departments]
    );

    const fields = [
        { name: 'name', label: 'Receiver Name', required: true },
        {
            name: 'department_id',
            label: 'Department',
            type: 'select',
            placeholder: 'Select department',
            required: true,
            options: departmentOptions,
            render: (_value, item) => item.department?.name || '-',
        },
        { name: 'email', label: 'Email', type: 'email', required: false },
        { name: 'phone', label: 'Phone', required: false },
        {
            name: 'is_active',
            label: 'Active',
            type: 'checkbox',
            defaultValue: true,
            required: false,
            render: (value) => statusLabel(value),
        },
        {
            name: 'assignments_count',
            label: 'Assignments',
            form: false,
            required: false,
            render: (value) => value ?? 0,
        },
    ];

    return (
        <CRUDPage
            title="Receivers"
            endpoint="receivers"
            fields={fields}
            searchPlaceholder="Search receivers..."
            createLabel="Add Receiver"
            csvConfig={{
                filename: 'receivers.csv',
                mapRow: (item) => ({
                    'Receiver Name': item.name || '',
                    Department: item.department?.name || '',
                    Email: item.email || '',
                    Phone: item.phone || '',
                    Active: statusLabel(item.is_active),
                    Assignments: item.assignments_count ?? 0,
                }),
            }}
        />
    );
}
