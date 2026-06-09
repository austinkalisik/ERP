import { BarChart3, BookOpen, BriefcaseBusiness, Building2, CircleDollarSign, FileClock, LayoutDashboard, LifeBuoy, MonitorCog, Server, Settings, Ticket, Wrench } from 'lucide-react';

const nav = [
    ['dashboard', 'Dashboard', LayoutDashboard],
    ['tickets', 'Tickets', Ticket],
    ['clients', 'Clients', Building2],
    ['services', 'Services', Server],
    ['assets', 'Assets', MonitorCog],
    ['knowledge', 'Knowledge Base', BookOpen],
    ['reports', 'Reports', BarChart3],
    ['sla', 'SLA & Contracts', FileClock],
    ['finance', 'Finance', CircleDollarSign],
    ['settings', 'Settings', Settings],
];

const quickLinks = ['Domain & Hosting', 'Email Support', 'ISP / Network', 'AI CCTV / Security', 'Document Management', 'Software Engineering'];

export default function Sidebar({ activeView, dashboard, setActiveView, settings }) {
    return (
        <aside className="hidden min-h-screen bg-[#06162a] text-white xl:block">
            <div className="flex h-full flex-col">
                <div className="border-b border-white/10 p-5">
                    <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-md bg-[#0aa8ff] text-2xl font-black">N</div>
                        <div>
                            <div className="text-lg font-black leading-5">NEXTGEN</div>
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">Technology Limited</div>
                        </div>
                    </div>
                    <div className="mt-5 rounded-md border border-cyan-300/20 bg-white/6 p-3">
                        <div className="flex items-center gap-2 text-sm font-semibold"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.9)]" /> Operations Centre</div>
                        <p className="mt-1 text-xs text-cyan-100">{settings.office_address}</p>
                    </div>
                </div>

                <nav className="space-y-1 p-3 text-sm">
                    {nav.map(([id, label, Icon]) => (
                        <button className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 font-semibold ${activeView === id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} key={id} onClick={() => setActiveView(id)} type="button">
                            <Icon size={17} />
                            <span className="flex-1 text-left">{label}</span>
                            {id === 'tickets' && dashboard?.open ? <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{dashboard.open}</span> : null}
                        </button>
                    ))}
                </nav>

                <div className="mt-3 border-t border-white/10 px-5 py-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Quick Links</p>
                    <div className="space-y-3 text-sm text-slate-300">
                        {quickLinks.map((item) => <div className="flex items-center gap-3" key={item}><Wrench size={15} /> {item}</div>)}
                    </div>
                </div>

                <div className="mt-auto p-5">
                    <div className="rounded-md border border-cyan-300/20 bg-white/5 p-4">
                        <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 font-black">N</div>
                            <div className="text-sm font-semibold">24/7 Support</div>
                        </div>
                        <p className="mt-3 text-lg font-black">{settings.support_phone}</p>
                        <p className="mt-1 break-all text-xs text-slate-300">{settings.support_email}</p>
                        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-300"><LifeBuoy size={14} /> Live Chat Online</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
