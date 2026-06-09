import { useState } from 'react';
import { api, priorityLabels, statusLabels } from '../support';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import TicketDetail from './TicketDetail';
import TicketForm from './TicketForm';

export default function Tickets({ clients, filters, loading, reload, selectedTicket, services, setError, setFilters, setSelectedTicket, tickets }) {
    const [editingTicket, setEditingTicket] = useState(null);

    async function removeTicket(ticket) {
        if (!confirm(`Delete ${ticket.ticket_number}?`)) return;
        await api(`/tickets/${ticket.id}`, { method: 'DELETE' });
        await reload(null);
    }

    const columns = [
        { key: 'ticket', label: 'Ticket', render: (row) => <button className="text-left" onClick={async () => setSelectedTicket(await api(`/tickets/${row.id}`))} type="button"><strong>{row.ticket_number}</strong><span className="block max-w-[320px] truncate text-slate-600">{row.title}</span></button> },
        { key: 'client', label: 'Client', render: (row) => <><strong className="block">{row.client?.name ?? row.department}</strong><span className="text-xs text-slate-500">{row.requester_name}</span></> },
        { key: 'service', label: 'Service', render: (row) => row.service?.name ?? row.category },
        { key: 'priority', label: 'Priority', render: (row) => <Badge labels={priorityLabels} value={row.priority} /> },
        { key: 'status', label: 'Status', render: (row) => <Badge labels={statusLabels} value={row.status} /> },
        { key: 'due_at', label: 'SLA Due', render: (row) => row.due_at ? new Date(row.due_at).toLocaleString() : 'Not set' },
        { key: 'actions', label: 'Actions', render: (row) => <div className="flex gap-2"><button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold" onClick={() => setEditingTicket(row)} type="button">Edit</button><button className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700" onClick={() => removeTicket(row)} type="button">Delete</button></div> },
    ];

    return (
        <div className="grid gap-5 2xl:grid-cols-[1fr_410px]">
            <section className="space-y-4">
                <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-4">
                        <Select label="status" options={statusLabels} value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })} />
                        <Select label="priority" options={priorityLabels} value={filters.priority} onChange={(value) => setFilters({ ...filters, priority: value })} />
                        <Select label="client_id" options={Object.fromEntries(clients.map((item) => [item.id, item.name]))} value={filters.client_id} onChange={(value) => setFilters({ ...filters, client_id: value })} />
                        <Select label="service_id" options={Object.fromEntries(services.map((item) => [item.id, item.name]))} value={filters.service_id} onChange={(value) => setFilters({ ...filters, service_id: value })} />
                    </div>
                </div>
                {loading ? <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-slate-500">Loading tickets...</div> : <DataTable columns={columns} rows={tickets} />}
            </section>
            <aside className="space-y-5">
                <TicketDetail reload={reload} selectedTicket={selectedTicket} setError={setError} setSelectedTicket={setSelectedTicket} />
                <TicketForm clients={clients} editingTicket={editingTicket} reload={reload} services={services} setEditingTicket={setEditingTicket} setError={setError} />
            </aside>
        </div>
    );
}

function Select({ label, onChange, options, value }) {
    return (
        <select aria-label={label} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => onChange(event.target.value)} value={value}>
            <option value="all">All {label.replace('_id', '').replace('_', ' ')}</option>
            {Object.entries(options).map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
        </select>
    );
}
