import { AlertTriangle, CheckCircle2, Clock3, Ticket, Users } from 'lucide-react';
import { priorityLabels, statusLabels } from '../support';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';

function slaMinutes(ticket) {
    if (!ticket?.due_at || ['resolved', 'closed'].includes(ticket.status)) {
        return 'Clear';
    }

    const minutes = Math.round((new Date(ticket.due_at).getTime() - Date.now()) / 60000);
    if (minutes < 0) return `${Math.abs(minutes)}m overdue`;
    if (minutes < 60) return `${minutes}m left`;
    return `${Math.round(minutes / 60)}h left`;
}

export default function Dashboard({ dashboard, services, tickets, selectTicket, setActiveView }) {
    const metrics = [
        { label: 'Open Tickets', value: dashboard?.open ?? 0, icon: Ticket, delta: '+12% vs yesterday', tone: 'text-blue-700' },
        { label: 'In Progress', value: dashboard?.in_progress ?? 0, icon: Clock3, delta: '+8% vs yesterday', tone: 'text-orange-600' },
        { label: 'Resolved Today', value: dashboard?.resolved_today ?? 0, icon: CheckCircle2, delta: '+22% vs yesterday', tone: 'text-emerald-600' },
        { label: 'SLA Compliance', value: `${dashboard?.sla_compliance ?? 0}%`, icon: CheckCircle2, delta: '+3.4% vs yesterday', tone: 'text-emerald-700' },
        { label: 'Overdue', value: dashboard?.overdue ?? 0, icon: AlertTriangle, delta: 'Needs attention', tone: 'text-rose-600' },
        { label: 'Customers', value: dashboard?.customers ?? 0, icon: Users, delta: '+15% vs yesterday', tone: 'text-violet-600' },
    ];

    const columns = [
        { key: 'ticket', label: 'ID', render: (row) => <button className="font-semibold text-slate-950" onClick={() => selectTicket(row)} type="button">{row.ticket_number}</button> },
        { key: 'title', label: 'Subject', render: (row) => <span className="font-medium">{row.title}</span> },
        { key: 'client', label: 'Client', render: (row) => row.client?.name ?? row.department },
        { key: 'service', label: 'Service', render: (row) => row.service?.name ?? row.category },
        { key: 'priority', label: 'Priority', render: (row) => <Badge labels={priorityLabels} value={row.priority} /> },
        { key: 'status', label: 'Status', render: (row) => <Badge labels={statusLabels} value={row.status} /> },
        { key: 'sla', label: 'SLA', render: (row) => <span className={slaMinutes(row).includes('overdue') ? 'font-semibold text-rose-600' : 'font-semibold text-emerald-700'}>{slaMinutes(row)}</span> },
    ];

    return (
        <div className="space-y-5">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                {metrics.map((metric) => <StatCard key={metric.label} {...metric} />)}
            </section>

            <section className="grid gap-5 2xl:grid-cols-[1fr_390px]">
                <div className="space-y-5">
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-base font-semibold">Live Ticket Queue</h2>
                            <button className="text-sm font-semibold text-blue-700" onClick={() => setActiveView('tickets')} type="button">View all</button>
                        </div>
                        <DataTable columns={columns} rows={(dashboard?.recent_tickets ?? tickets).slice(0, 8)} />
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
                        <ServiceSummary services={dashboard?.service_summary ?? services} />
                        <SlaOverview dashboard={dashboard} />
                    </div>
                </div>

                <UrgentPanel tickets={tickets} selectTicket={selectTicket} />
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold">System & Network Status</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-7">
                    {(dashboard?.system_statuses ?? []).map((status) => (
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={status.id}>
                            <div className="text-sm font-semibold">{status.name}</div>
                            <div className="mt-2"><Badge value={status.status} /></div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function ServiceSummary({ services }) {
    return (
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold">Service Categories</h2>
            <div className="mt-3 divide-y divide-slate-100">
                {services.map((service) => (
                    <div className="flex items-center justify-between py-2 text-sm" key={service.id}>
                        <span className="font-medium text-slate-700">{service.name}</span>
                        <span className="font-semibold">{service.tickets_count ?? 0}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

function SlaOverview({ dashboard }) {
    const sla = dashboard?.sla ?? { compliant: 0, at_risk: 0, breached: 0 };
    const total = Math.max(sla.compliant + sla.at_risk + sla.breached, 1);
    const compliance = Math.round((sla.compliant / total) * 100);

    return (
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">SLA Overview</h2>
                <span className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold">This Week</span>
            </div>
            <div className="mt-5 grid gap-6 md:grid-cols-[180px_1fr]">
                <div className="grid aspect-square place-items-center rounded-full border-[18px] border-emerald-500 bg-white text-center">
                    <div><div className="text-3xl font-semibold">{compliance}%</div><div className="text-xs text-slate-500">Compliant</div></div>
                </div>
                <div className="space-y-3 text-sm">
                    <MetricLine label="Compliant" value={sla.compliant} color="bg-emerald-500" />
                    <MetricLine label="At Risk" value={sla.at_risk} color="bg-amber-500" />
                    <MetricLine label="Breached" value={sla.breached} color="bg-rose-500" />
                    <div className="mt-5 h-28 rounded-md border border-slate-200 bg-[linear-gradient(to_top,#e2e8f0_1px,transparent_1px)] bg-[length:100%_25%]" />
                </div>
            </div>
        </section>
    );
}

function MetricLine({ color, label, value }) {
    return <div className="flex items-center justify-between"><span className="flex items-center gap-2"><i className={`h-2.5 w-2.5 rounded-full ${color}`} /> {label}</span><strong>{value}</strong></div>;
}

function UrgentPanel({ tickets, selectTicket }) {
    const urgent = tickets.filter((ticket) => ['critical', 'high'].includes(ticket.priority)).slice(0, 5);

    return (
        <aside className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold">Urgent SLA Risk</h2>
            <div className="mt-4 space-y-3">
                {urgent.map((ticket) => (
                    <button className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-left hover:border-blue-300" key={ticket.id} onClick={() => selectTicket(ticket)} type="button">
                        <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold">{ticket.ticket_number}</span>
                            <Badge labels={priorityLabels} value={ticket.priority} />
                        </div>
                        <p className="mt-2 truncate text-sm text-slate-600">{ticket.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{ticket.client?.name ?? ticket.department}</p>
                    </button>
                ))}
            </div>
        </aside>
    );
}
