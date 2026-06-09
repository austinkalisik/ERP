import { useEffect, useState } from 'react';
import { api, priorityLabels, statusLabels } from '../support';

const blank = {
    client_id: '',
    service_id: '',
    title: '',
    description: '',
    requester_name: '',
    requester_email: '',
    assignee_name: '',
    team: '',
    department: '',
    category: '',
    priority: 'medium',
    status: 'open',
    sla_minutes: 1440,
};

export default function TicketForm({ clients, editingTicket, reload, services, setEditingTicket, setError }) {
    const [form, setForm] = useState(blank);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (editingTicket) {
            setForm({
                ...blank,
                ...editingTicket,
                client_id: editingTicket.client_id ?? '',
                service_id: editingTicket.service_id ?? '',
            });
        }
    }, [editingTicket]);

    function updateClient(clientId) {
        const client = clients.find((item) => item.id === clientId);
        setForm({ ...form, client_id: clientId, requester_name: client?.contact_person ?? '', requester_email: client?.email ?? '', department: client?.name ?? '' });
    }

    function updateService(serviceId) {
        const service = services.find((item) => item.id === serviceId);
        setForm({ ...form, service_id: serviceId, category: service?.category ?? '', assignee_name: service?.owner_team ?? '', team: service?.owner_team ?? '', sla_minutes: service?.default_sla_minutes ?? 1440 });
    }

    async function submit(event) {
        event.preventDefault();
        setSaving(true);
        setError('');

        try {
            const payload = { ...form, client_id: form.client_id || null, service_id: form.service_id || null };
            const saved = editingTicket
                ? await api(`/tickets/${editingTicket.id}`, { method: 'PUT', body: JSON.stringify(payload) })
                : await api('/tickets', { method: 'POST', body: JSON.stringify(payload) });

            setForm(blank);
            setEditingTicket(null);
            await reload(saved.id);
        } catch (exception) {
            setError(exception.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <form className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" onSubmit={submit}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold">{editingTicket ? 'Create / Edit Ticket' : 'Create Ticket'}</h2>
                {editingTicket && <button className="text-sm font-semibold text-blue-700" onClick={() => { setEditingTicket(null); setForm(blank); }} type="button">Reset</button>}
            </div>
            <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <Select label="Client" onChange={updateClient} options={clients.map((item) => [item.id, item.name])} required value={form.client_id} />
                    <Select label="Service" onChange={updateService} options={services.map((item) => [item.id, item.name])} required value={form.service_id} />
                    <Select label="Priority" onChange={(value) => setForm({ ...form, priority: value })} options={Object.entries(priorityLabels)} value={form.priority} />
                    <Select label="Status" onChange={(value) => setForm({ ...form, status: value })} options={Object.entries(statusLabels)} value={form.status} />
                </div>
                <Field label="Subject" name="title" required form={form} setForm={setForm} />
                <textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm" onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the issue in detail..." required value={form.description} />
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Requester" name="requester_name" required form={form} setForm={setForm} />
                    <Field label="Requester Email" name="requester_email" required type="email" form={form} setForm={setForm} />
                    <Field label="Assignee / Team" name="assignee_name" form={form} setForm={setForm} />
                    <Field label="SLA Minutes" name="sla_minutes" type="number" form={form} setForm={setForm} />
                </div>
                <button className="rounded-md bg-[#06162a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">{saving ? 'Saving...' : 'Submit Ticket'}</button>
            </div>
        </form>
    );
}

function Select({ label, onChange, options, required = false, value }) {
    return (
        <label className="grid gap-1 text-sm font-semibold text-slate-700">{label}
            <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal" onChange={(event) => onChange(event.target.value)} required={required} value={value}>
                <option value="">Select {label.toLowerCase()}</option>
                {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
            </select>
        </label>
    );
}

function Field({ form, label, name, required = false, setForm, type = 'text' }) {
    return <label className="grid gap-1 text-sm font-semibold text-slate-700">{label}<input className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal" onChange={(event) => setForm({ ...form, [name]: event.target.value })} required={required} type={type} value={form[name] ?? ''} /></label>;
}
