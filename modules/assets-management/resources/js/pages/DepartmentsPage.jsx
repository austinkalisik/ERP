import React from 'react';
import CRUDPage from '../components/CRUDPage';

function renderCount(value) {
    return value ?? 0;
}

export default function DepartmentsPage() {
    const fields = [
        { name: 'name', label: 'Department Name', required: true },
        {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            rows: 3,
            required: false,
            fullWidth: true,
            render: (value) => value || '-',
        },
        {
            name: 'assignments_count',
            label: 'Total Assignments',
            form: false,
            required: false,
            render: (value) => renderCount(value),
        },
        {
            name: 'active_assignments_count',
            label: 'Active Assignments',
            form: false,
            required: false,
            render: (value) => renderCount(value),
        },
    ];

    return (
        <CRUDPage
            title="Departments"
            endpoint="departments"
            fields={fields}
            searchPlaceholder="Search departments..."
            createLabel="Add Department"
            csvConfig={{
                filename: 'departments.csv',
                mapRow: (item) => ({
                    'Department Name': item.name || '',
                    Description: item.description || '',
                    'Total Assignments': item.assignments_count ?? 0,
                    'Active Assignments': item.active_assignments_count ?? 0,
                }),
            }}
        />
    );
}
