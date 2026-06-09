import React from 'react';
import CRUDPage from '../components/CRUDPage';

export default function SuppliersPage() {
    const fields = [
        { name: 'name', label: 'Supplier Name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: false },
        { name: 'phone', label: 'Phone', required: false },
        {
            name: 'address',
            label: 'Address',
            type: 'textarea',
            rows: 3,
            required: false,
            fullWidth: true,
        },
    ];

    return (
        <CRUDPage
            title="Suppliers"
            endpoint="suppliers"
            fields={fields}
            searchPlaceholder="Search suppliers by name, email, phone or address..."
            createLabel="Add Supplier"
            csvConfig={{
                filename: 'suppliers.csv',
                mapRow: (item) => ({
                    'Supplier Name': item.name || '',
                    Email: item.email || '',
                    Phone: item.phone || '',
                    Address: item.address || '',
                }),
            }}
        />
    );
}