import { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Clients from './pages/Clients';
import Services from './pages/Services';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { api } from './support';

const defaultSettings = {
    company_name: 'NextGen Technology Limited',
    support_email: 'support@nextgenpng.net',
    support_phone: '+675 7999 8999',
    office_address: 'Port Moresby, PNG',
    website_url: 'https://nextgenpng.net/',
    profile_name: 'NextGen Operations Centre',
    profile_role: 'Port Moresby, PNG',
    default_sla_minutes: '1440',
    notifications_enabled: '1',
};

export default function App() {
    const [activeView, setActiveView] = useState('dashboard');
    const [dashboard, setDashboard] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);
    const [reports, setReports] = useState(null);
    const [settings, setSettings] = useState(defaultSettings);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [filters, setFilters] = useState({ search: '', status: 'all', priority: 'all', client_id: 'all', service_id: 'all' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const query = useMemo(() => new URLSearchParams(filters).toString(), [filters]);

    async function loadAll(nextSelectedId = selectedTicket?.id) {
        setLoading(true);
        setError('');

        try {
            const [dashboardData, ticketData, clientData, serviceData, reportData, settingsData] = await Promise.all([
                api('/dashboard'),
                api(`/tickets?${query}`),
                api('/clients'),
                api('/services'),
                api('/reports'),
                api('/settings'),
            ]);

            setDashboard(dashboardData);
            setTickets(ticketData.data ?? ticketData);
            setClients(clientData);
            setServices(serviceData);
            setReports(reportData);
            setSettings({ ...defaultSettings, ...settingsData });

            const list = ticketData.data ?? ticketData;
            const next = list.find((ticket) => ticket.id === nextSelectedId) ?? list[0] ?? null;
            setSelectedTicket(next ? await api(`/tickets/${next.id}`) : null);
        } catch (exception) {
            setError(exception.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
    }, [query]);

    async function selectTicket(ticket) {
        setSelectedTicket(await api(`/tickets/${ticket.id}`));
        setActiveView('tickets');
    }

    const pageProps = {
        dashboard,
        tickets,
        clients,
        services,
        reports,
        settings,
        filters,
        loading,
        selectedTicket,
        setFilters,
        setSelectedTicket,
        selectTicket,
        reload: loadAll,
        setError,
    };

    return (
        <main className="min-h-screen bg-[#eef3f8] text-slate-950">
            <div className="grid min-h-screen xl:grid-cols-[250px_1fr]">
                <Sidebar activeView={activeView} dashboard={dashboard} setActiveView={setActiveView} settings={settings} />
                <section className="min-w-0">
                    <Topbar
                        activeView={activeView}
                        filters={filters}
                        setActiveView={setActiveView}
                        setFilters={setFilters}
                        settings={settings}
                    />

                    <div className="px-4 py-5 sm:px-6">
                        {error && <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</div>}
                        {activeView === 'dashboard' && <Dashboard {...pageProps} setActiveView={setActiveView} />}
                        {activeView === 'tickets' && <Tickets {...pageProps} />}
                        {activeView === 'clients' && <Clients {...pageProps} />}
                        {activeView === 'services' && <Services {...pageProps} />}
                        {activeView === 'assets' && <Placeholder title="Assets" text="Managed client assets are seeded in the database and ready for the next workflow pass." />}
                        {activeView === 'knowledge' && <Placeholder title="Knowledge Base" text="Published troubleshooting articles are available in the knowledge_base_articles table." />}
                        {activeView === 'reports' && <Reports {...pageProps} />}
                        {activeView === 'sla' && <Reports {...pageProps} slaMode />}
                        {activeView === 'finance' && <Placeholder title="Finance" text="Finance records and invoice-ready data are available through the finance_records table." />}
                        {activeView === 'settings' && <Settings {...pageProps} setSettings={setSettings} />}
                    </div>
                </section>
            </div>
        </main>
    );
}

function Placeholder({ title, text }) {
    return (
        <section className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{text}</p>
        </section>
    );
}
