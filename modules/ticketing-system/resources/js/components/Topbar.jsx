import { Bell, Menu, Plus, Search } from 'lucide-react';

const titles = {
    dashboard: 'Dashboard',
    tickets: 'Tickets',
    clients: 'Clients',
    services: 'Services',
    assets: 'Assets',
    knowledge: 'Knowledge Base',
    reports: 'Reports',
    sla: 'SLA & Contracts',
    finance: 'Finance',
    settings: 'Settings',
};

export default function Topbar({ activeView, filters, setActiveView, setFilters, settings }) {
    return (
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <button className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 xl:hidden" type="button"><Menu size={18} /></button>
                    <div className="min-w-0">
                        <h1 className="truncate text-xl font-semibold">{titles[activeView] ?? 'Dashboard'}</h1>
                        <p className="truncate text-sm text-slate-500">{settings.company_name} service operations</p>
                    </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={17} />
                        <input
                            className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm sm:w-96"
                            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                            placeholder="Search tickets, clients, services, domains..."
                            value={filters.search}
                        />
                    </label>
                    <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700" onClick={() => setActiveView('tickets')} type="button">
                        <Plus size={16} /> Create Ticket
                    </button>
                    <div className="hidden items-center gap-4 lg:flex">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            <span className="font-semibold">Service Status</span>
                        </div>
                        <Bell className="text-slate-500" size={18} />
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">AO</div>
                    </div>
                </div>
            </div>
        </header>
    );
}
