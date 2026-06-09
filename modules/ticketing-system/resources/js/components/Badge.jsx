export default function Badge({ value, labels = {} }) {
    const classes = {
        open: 'bg-blue-50 text-blue-700 ring-blue-200',
        in_progress: 'bg-sky-50 text-sky-700 ring-sky-200',
        waiting_client: 'bg-violet-50 text-violet-700 ring-violet-200',
        resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        closed: 'bg-slate-100 text-slate-700 ring-slate-200',
        low: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        medium: 'bg-amber-50 text-amber-700 ring-amber-200',
        high: 'bg-orange-50 text-orange-700 ring-orange-200',
        critical: 'bg-rose-50 text-rose-700 ring-rose-200',
        operational: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        degraded: 'bg-amber-50 text-amber-700 ring-amber-200',
        outage: 'bg-rose-50 text-rose-700 ring-rose-200',
        maintenance: 'bg-blue-50 text-blue-700 ring-blue-200',
    };

    return (
        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${classes[value] ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
            {labels[value] ?? value}
        </span>
    );
}
