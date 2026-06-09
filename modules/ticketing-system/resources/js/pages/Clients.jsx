import { useState } from 'react';
import { api } from '../support';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';

const blank = { name: '', contact_person: '', email: '', phone: '', location: '', company_type: '', status: 'active' };

export default function Clients({ clients, reload, setError, setFilters }) {
    const [form, setForm] = useState(blank);
    const [editingId, setEditingId] = useState(null);

    async function submit(event) {
        event.preventDefault();
        try {
            if (editingId) {
                await api(`/clients/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
            } else {
                await api('/clients', { method: 'POST', body: JSON.stringify(form) });
            }
            setEditingId(null);
            setForm(blank);
            await reload();
        } catch (exception) {
            setError(exception.message);
        }
    }

    async function remove(client) {
        if (!confirm(`Delete ${client.name}?`)) return;
        await api(`/clients/${client.id}`, { method: 'DELETE' });
        await reload();
    }

    const columns = [
        { key: 'name', label: 'Client', render: (row) => <><strong className="block">{row.name}</strong><span className="text-xs text-slate-500">{row.company_type}</span></> },
        { key: 'contact_person', label: 'Contact' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'location', label: 'Location' },
        { key: 'tickets', label: 'Tickets', render: (row) => <span className="font-semibold">{row.tickets_count ?? 0} total / {row.open_tickets_count ?? 0} open</span> },
        { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
        { key: 'actions', label: 'Actions', render: (row) => <div className="flex gap-2"><button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold" onClick={() => { setEditingId(row.id); setForm(row); }} type="button">Edit</button><button className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700" onClick={() => setFilters((filters) => ({ ...filters, client_id: row.id }))} type="button">Tickets</button><button className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700" onClick={() => remove(row)} type="button">Delete</button></div> },
    ];

    return (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <DataTable columns={columns} rows={clients} />
            <ClientForm editingId={editingId} form={form} setEditingId={setEditingId} setForm={setForm} submit={submit} />
        </div>
    );
}

function ClientForm({ editingId, form, setEditingId, setForm, submit }) {
    return (
        <form className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" onSubmit={submit}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold">{editingId ? 'Edit Client' : 'New Client'}</h2>
                {editingId && <button className="text-sm font-semibold text-blue-700" onClick={() => { setEditingId(null); setForm(blank); }} type="button">Reset</button>}
            </div>
            <div className="grid gap-3">
                {[
                    ['Client Name', 'name'],
                    ['Contact Person', 'contact_person'],
                    ['Email', 'email', 'email'],
                    ['Phone', 'phone'],
                    ['Address / Location', 'location'],
                    ['Company Type', 'company_type'],
                ].map(([label, name, type = 'text']) => <Field form={form} key={name} label={label} name={name} setForm={setForm} type={type} />)}
                <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => setForm({ ...form, status: event.target.value })} value={form.status}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_hold">On Hold</option>
                </select>
                <button className="rounded-md bg-[#06162a] px-4 py-2.5 text-sm font-semibold text-white" type="submit">Save Client</button>
            </div>
        </form>
    );
}

function Field({ form, label, name, setForm, type = 'text' }) {
    return <label className="grid gap-1 text-sm font-semibold text-slate-700">{label}<input className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal" onChange={(event) => setForm({ ...form, [name]: event.target.value })} required name={name} type={type} value={form[name] ?? ''} /></label>;
}
