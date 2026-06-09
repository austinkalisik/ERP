import { useState } from 'react';
import { api } from '../support';
import Badge from '../components/Badge';

const blank = { name: '', category: '', owner_team: 'Service Desk', default_sla_minutes: 1440, status: 'operational', description: '' };

export default function Services({ reload, services, setError }) {
    const [form, setForm] = useState(blank);
    const [editingId, setEditingId] = useState(null);

    async function submit(event) {
        event.preventDefault();
        try {
            if (editingId) {
                await api(`/services/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
            } else {
                await api('/services', { method: 'POST', body: JSON.stringify(form) });
            }
            setEditingId(null);
            setForm(blank);
            await reload();
        } catch (exception) {
            setError(exception.message);
        }
    }

    return (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                {services.map((service) => (
                    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" key={service.id}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="font-semibold">{service.name}</h2>
                                <p className="mt-1 text-sm text-slate-500">{service.owner_team}</p>
                            </div>
                            <Badge value={service.status} />
                        </div>
                        <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{service.description}</p>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                            <Metric label="Tickets" value={service.tickets_count ?? 0} />
                            <Metric label="Open" value={service.open_tickets_count ?? 0} />
                            <Metric label="SLA Risk" value={service.sla_risk_count ?? 0} tone="text-rose-600" />
                        </div>
                        <button className="mt-4 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={() => { setEditingId(service.id); setForm(service); }} type="button">Edit Service</button>
                    </article>
                ))}
            </section>
            <ServiceForm editingId={editingId} form={form} setEditingId={setEditingId} setForm={setForm} submit={submit} />
        </div>
    );
}

function Metric({ label, tone = 'text-slate-950', value }) {
    return <div className="rounded-md bg-slate-50 p-2"><div className={`font-semibold ${tone}`}>{value}</div><div className="text-xs text-slate-500">{label}</div></div>;
}

function ServiceForm({ editingId, form, setEditingId, setForm, submit }) {
    return (
        <form className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" onSubmit={submit}>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold">{editingId ? 'Edit Service' : 'New Service'}</h2>
                {editingId && <button className="text-sm font-semibold text-blue-700" onClick={() => { setEditingId(null); setForm(blank); }} type="button">Reset</button>}
            </div>
            <div className="grid gap-3">
                <Field form={form} label="Service Name" name="name" setForm={setForm} />
                <Field form={form} label="Category" name="category" setForm={setForm} />
                <Field form={form} label="Owner Team" name="owner_team" setForm={setForm} />
                <Field form={form} label="Default SLA Minutes" name="default_sla_minutes" setForm={setForm} type="number" />
                <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => setForm({ ...form, status: event.target.value })} value={form.status}>
                    <option value="operational">Operational</option>
                    <option value="degraded">Degraded</option>
                    <option value="outage">Outage</option>
                    <option value="maintenance">Maintenance</option>
                </select>
                <textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm" onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Service description" value={form.description ?? ''} />
                <button className="rounded-md bg-[#06162a] px-4 py-2.5 text-sm font-semibold text-white" type="submit">Save Service</button>
            </div>
        </form>
    );
}

function Field({ form, label, name, setForm, type = 'text' }) {
    return <label className="grid gap-1 text-sm font-semibold text-slate-700">{label}<input className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal" onChange={(event) => setForm({ ...form, [name]: event.target.value })} required type={type} value={form[name] ?? ''} /></label>;
}
