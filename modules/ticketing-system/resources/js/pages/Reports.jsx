import { AlertTriangle, BarChart3, CheckCircle2, Clock3 } from 'lucide-react';
import StatCard from '../components/StatCard';

export default function Reports({ dashboard, reports, slaMode = false }) {
    const cards = [
        { label: 'SLA Compliance', value: `${dashboard?.sla_compliance ?? 0}%`, icon: CheckCircle2, tone: 'text-emerald-600' },
        { label: 'Resolved Tickets', value: reports?.resolved ?? 0, icon: CheckCircle2, tone: 'text-blue-600' },
        { label: 'Overdue Tickets', value: reports?.overdue ?? 0, icon: AlertTriangle, tone: 'text-rose-600' },
        { label: 'Monthly Trend', value: reports?.monthly_trends?.at(-1)?.total ?? 0, icon: BarChart3, tone: 'text-violet-600' },
    ];

    return (
        <div className="space-y-5">
            <section className="grid gap-4 md:grid-cols-4">
                {cards.map((card) => <StatCard key={card.label} {...card} />)}
            </section>
            <section className="grid gap-5 lg:grid-cols-3">
                <ReportPanel title="Tickets by Status" rows={reports?.by_status ?? []} />
                <ReportPanel title="Tickets by Priority" rows={reports?.by_priority ?? []} />
                <ReportPanel title="Tickets by Service" rows={reports?.by_service ?? []} />
            </section>
            <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                    <Clock3 className="text-blue-700" size={18} />
                    <h2 className="text-base font-semibold">{slaMode ? 'SLA & Contracts Overview' : 'Monthly Ticket Trends'}</h2>
                </div>
                <div className="grid h-64 grid-cols-12 items-end gap-2 border-b border-l border-slate-200 p-4">
                    {(reports?.monthly_trends ?? []).map((item) => (
                        <div className="flex h-full flex-col justify-end gap-2" key={item.label}>
                            <div className="rounded-t bg-blue-600" style={{ height: `${Math.max(12, item.total * 16)}px` }} />
                            <span className="-rotate-45 text-[10px] text-slate-500">{item.label}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function ReportPanel({ rows, title }) {
    const total = Math.max(rows.reduce((sum, item) => sum + Number(item.total), 0), 1);

    return (
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold">{title}</h2>
            <div className="mt-4 space-y-3">
                {rows.map((row) => (
                    <div key={row.label}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="font-medium capitalize">{String(row.label).replace('_', ' ')}</span>
                            <span className="font-semibold">{row.total}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${(row.total / total) * 100}%` }} /></div>
                    </div>
                ))}
            </div>
        </section>
    );
}
