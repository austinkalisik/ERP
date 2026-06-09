export default function StatCard({ icon: Icon, label, value, delta, tone = 'text-blue-700' }) {
    return (
        <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
                {Icon && <Icon className={tone} size={18} />}
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
            {delta && <p className="mt-2 text-xs font-medium text-emerald-600">{delta}</p>}
        </article>
    );
}
