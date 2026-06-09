import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, AirVent, AlertTriangle, Bell, Building2, Camera, CheckCircle2,
  DoorOpen, Flame, Gauge, HardDrive, Lock, LogOut, Menu, PlugZap, Search,
  Settings, Shield, Thermometer, UserRound, Wrench, Zap
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie,
  PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import '../css/app.css';

const tokenKey = 'ibmcp_token';
const statusColors = { online: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30', offline: 'bg-zinc-500/15 text-zinc-300 ring-zinc-500/30', warning: 'bg-amber-500/15 text-amber-300 ring-amber-500/30', alarm: 'bg-red-500/15 text-red-300 ring-red-500/30', maintenance: 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/30' };
const severityColors = { critical: 'bg-red-500 text-white', high: 'bg-orange-500 text-white', medium: 'bg-amber-400 text-zinc-950', low: 'bg-cyan-500 text-zinc-950' };
const nav = [
  ['Dashboard', Gauge], ['Devices', HardDrive], ['Events', Bell], ['Fire Alarm', Flame],
  ['CCTV', Camera], ['HVAC', AirVent], ['Access Control', DoorOpen], ['Power / UPS', PlugZap],
  ['Maintenance', Wrench], ['Reports', Activity], ['Settings', Settings],
];

function api(path, options = {}) {
  const token = localStorage.getItem(tokenKey);
  return fetch(`/api${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  }).then(async (res) => {
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
    if (res.status === 204) return null;
    return res.json();
  });
}

function Badge({ children, tone = 'online' }) {
  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ${statusColors[tone] || statusColors.online}`}>{children}</span>;
}

function Severity({ value }) {
  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold uppercase ${severityColors[value] || severityColors.low}`}>{value}</span>;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@building.test');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem(tokenKey, data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 grid place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <Shield className="h-9 w-9 text-cyan-300" />
          <div>
            <h1 className="text-xl font-semibold">Integrated Building Monitoring Control Panel</h1>
            <p className="text-sm text-zinc-400">Secure operations login</p>
          </div>
        </div>
        <label className="block text-sm text-zinc-300">Email</label>
        <input className="mt-2 mb-4 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} />
        <label className="block text-sm text-zinc-300">Password</label>
        <input type="password" className="mt-2 mb-4 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <button className="w-full rounded-md bg-cyan-400 px-4 py-2 font-semibold text-zinc-950">Sign in</button>
        <p className="mt-4 text-xs text-zinc-500">Demo users: admin/supervisor/operator/technician/viewer@building.test, password: password</p>
      </form>
    </main>
  );
}

function Shell({ user, onLogout }) {
  const [active, setActive] = useState('Dashboard');
  const [summary, setSummary] = useState(null);
  const [devices, setDevices] = useState([]);
  const [events, setEvents] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [settings, setSettings] = useState([]);
  const [reports, setReports] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [ticketDevice, setTicketDevice] = useState('');

  async function load() {
    const [dash, dev, ev, maint, integ, rep] = await Promise.all([
      api('/dashboard/summary'), api('/devices'), api('/events'), api('/maintenance'), api('/integration-settings'), api('/reports/summary'),
    ]);
    setSummary(dash); setDevices(dev.data || []); setEvents(ev.data || []); setMaintenance(maint.data || []); setSettings(integ); setReports(rep);
  }

  useEffect(() => { load().catch(console.error); }, []);

  async function logout() {
    await api('/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem(tokenKey);
    onLogout();
  }

  const filteredDevices = devices.filter(d => `${d.name} ${d.type} ${d.status} ${d.location?.building || ''}`.toLowerCase().includes(query.toLowerCase()));
  const pages = { Dashboard, Devices, Events, 'Fire Alarm': FireAlarm, CCTV, HVAC, 'Access Control': AccessControl, 'Power / UPS': PowerUps, Maintenance, Reports, Settings: SettingsPanel };
  const Page = pages[active] || Dashboard;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-zinc-800 bg-zinc-950/95 p-4 lg:block">
        <div className="mb-6 flex items-center gap-3 px-2">
          <Building2 className="h-8 w-8 text-cyan-300" />
          <div><div className="text-sm font-bold uppercase tracking-wide">IB Monitoring</div><div className="text-xs text-zinc-500">Control Panel</div></div>
        </div>
        <nav className="space-y-1">
          {nav.map(([label, Icon]) => <button key={label} onClick={() => setActive(label)} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm ${active === label ? 'bg-cyan-400 text-zinc-950' : 'text-zinc-300 hover:bg-zinc-900'}`}><Icon className="h-4 w-4" />{label}</button>)}
        </nav>
      </aside>
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur lg:ml-72">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3"><Menu className="h-5 w-5 lg:hidden" /><div><h1 className="font-semibold">{active}</h1><p className="text-xs text-zinc-500">Realtime-ready simulated operations view</p></div></div>
          <div className="flex items-center gap-3 text-sm">
            <Badge tone="alarm">Critical {summary?.kpis?.critical_alarms ?? 0}</Badge>
            <Badge tone="warning">Warnings {summary?.kpis?.warning_alarms ?? 0}</Badge>
            <span className="hidden items-center gap-2 text-zinc-400 md:flex"><UserRound className="h-4 w-4" />{user.name} ({user.role})</span>
            <button onClick={logout} className="rounded-md border border-zinc-700 p-2 text-zinc-300 hover:bg-zinc-900"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>
      <main className="p-4 lg:ml-72 lg:p-6">
        <Page summary={summary} devices={filteredDevices} events={events} maintenance={maintenance} settings={settings} reports={reports} query={query} setQuery={setQuery} setSelectedEvent={setSelectedEvent} ticketDevice={ticketDevice} setTicketDevice={setTicketDevice} reload={load} />
      </main>
      {selectedEvent && <AcknowledgeModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onSaved={() => { setSelectedEvent(null); load(); }} />}
    </div>
  );
}

function Dashboard({ summary, devices, events, setSelectedEvent }) {
  const k = summary?.kpis || {};
  const cards = [
    ['Total Devices', k.total_devices, HardDrive, 'text-cyan-300'], ['Online', k.online_devices, CheckCircle2, 'text-emerald-300'],
    ['Offline', k.offline_devices, AlertTriangle, 'text-zinc-300'], ['Critical Alarms', k.critical_alarms, Flame, 'text-red-400'],
    ['Warnings', k.warning_alarms, Bell, 'text-amber-300'], ['Fire Signals', k.active_fire_signals, Flame, 'text-red-300'],
    ['HVAC Faults', k.hvac_faults, AirVent, 'text-cyan-300'], ['CCTV Offline', k.cctv_offline, Camera, 'text-orange-300'],
  ];
  const trend = normalizeTrend(summary?.event_trends || []);
  const health = Object.entries(summary?.device_status?.by_status || {}).map(([name, value]) => ({ name, value }));

  return <div className="space-y-5">
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, Icon, color]) => <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"><div className="flex items-center justify-between text-zinc-400"><span className="text-xs uppercase">{label}</span><Icon className={`h-5 w-5 ${color}`} /></div><div className="mt-3 text-3xl font-semibold">{value ?? '-'}</div></div>)}</section>
    <section className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
      <Panel title="Event Trend"><ResponsiveContainer width="100%" height={280}><AreaChart data={trend}><CartesianGrid stroke="#27272a" /><XAxis dataKey="day" stroke="#a1a1aa" /><YAxis stroke="#a1a1aa" /><Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46' }} /><Legend /><Area dataKey="critical" stroke="#ef4444" fill="#ef444433" /><Area dataKey="high" stroke="#f97316" fill="#f9731633" /><Area dataKey="medium" stroke="#facc15" fill="#facc1533" /></AreaChart></ResponsiveContainer></Panel>
      <Panel title="Device Health"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={health} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92}>{health.map((e, i) => <Cell key={e.name} fill={['#22c55e', '#ef4444', '#f59e0b', '#06b6d4', '#71717a'][i % 5]} />)}</Pie><Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46' }} /><Legend /></PieChart></ResponsiveContainer></Panel>
    </section>
    <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <Panel title="Latest Events"><EventTable events={events.slice(0, 10)} onSelect={setSelectedEvent} /></Panel>
      <Panel title="Building / Floor / Zone Summary"><div className="space-y-3">{summary?.locations?.map(l => <div key={l.id} className="flex items-center justify-between rounded-md bg-zinc-950 p-3"><div><div className="font-medium">{l.building}</div><div className="text-xs text-zinc-500">{l.floor} · {l.room} · {l.zone}</div></div><Badge tone="online">{l.devices_count} devices</Badge></div>)}</div></Panel>
    </section>
  </div>;
}

function Devices({ devices, query, setQuery }) {
  return <Panel title="Device Management" action={<SearchBox query={query} setQuery={setQuery} />}>
    <DataTable headers={['Device', 'Type', 'Location', 'Protocol', 'Status', 'Heartbeat']}>
      {devices.map(d => <tr key={d.id} className="border-t border-zinc-800">
        <td className="p-3 font-medium">{d.name}<div className="text-xs text-zinc-500">{d.manufacturer} {d.model}</div></td>
        <td className="p-3">{d.type}</td><td className="p-3 text-zinc-400">{d.location?.building} {d.location?.floor}</td>
        <td className="p-3">{d.protocol}</td><td className="p-3"><Badge tone={d.status}>{d.status}</Badge></td><td className="p-3 text-zinc-400">{formatDate(d.last_heartbeat)}</td>
      </tr>)}
    </DataTable>
  </Panel>;
}

function Events({ events, setSelectedEvent }) { return <Panel title="Event and Alarm Monitoring"><EventTable events={events} onSelect={setSelectedEvent} /></Panel>; }

function FireAlarm({ devices, events }) {
  const fireDevices = devices.filter(d => d.type === 'Fire Alarm');
  const fireEvents = events.filter(e => e.device?.type === 'Fire Alarm');
  return <ModuleLayout title="Fire Alarm Monitoring" note="Monitoring-only. Certified fire contractors are required for real panel connection and commissioning.">
    <StatusGrid items={[['Panel Status', fireEvents.some(e => !e.acknowledged) ? 'ALARM' : 'NORMAL'], ['Alarm Zones', fireDevices.length], ['Trouble Signal', fireEvents.filter(e => e.event_type === 'fault').length], ['Supervisory Signal', fireEvents.filter(e => e.severity === 'medium').length]]} />
    <Panel title="Active Alarm List"><EventTable events={fireEvents} /></Panel>
  </ModuleLayout>;
}

function CCTV({ devices, events }) {
  const cams = devices.filter(d => d.type === 'CCTV');
  return <ModuleLayout title="CCTV Module" note="Preview cards are placeholders. RTSP/ONVIF URLs are kept server-side and credentials are masked.">
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{cams.map(cam => <div key={cam.id} className="aspect-video rounded-lg border border-zinc-800 bg-zinc-900 p-3"><div className="flex items-center justify-between"><span className="text-sm font-medium">{cam.name}</span><Badge tone={cam.status}>{cam.status}</Badge></div><div className="mt-8 grid place-items-center text-zinc-600"><Camera className="h-12 w-12" /></div></div>)}</section>
    <Panel title="Motion / Offline History"><EventTable events={events.filter(e => e.device?.type === 'CCTV')} /></Panel>
  </ModuleLayout>;
}

function HVAC({ devices, events }) {
  const units = devices.filter(d => d.type === 'HVAC');
  return <ModuleLayout title="HVAC / Aircon Module" note="Setpoint controls are simulated and should be audited before connecting to real BMS controls.">
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{units.map(u => <div key={u.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"><div className="flex items-center justify-between"><b>{u.name}</b><Badge tone={u.status}>{u.status}</Badge></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><Metric label="Current" value={`${20 + u.id % 8} C`} /><Metric label="Target" value={`${u.metadata?.target_temperature || 22} C`} /><Metric label="Humidity" value={`${45 + u.id % 25}%`} /><Metric label="Mode" value={u.metadata?.mode || 'auto'} /><Metric label="Runtime" value={`${800 + u.id * 17} h`} /><Metric label="Fault" value={u.status === 'alarm' ? 'Active' : 'Clear'} /></div></div>)}</section>
    <Panel title="HVAC Faults"><EventTable events={events.filter(e => e.device?.type === 'HVAC')} /></Panel>
  </ModuleLayout>;
}

function AccessControl({ devices, events }) {
  return <ModuleLayout title="Access Control Module"><StatusGrid items={[['Doors Monitored', devices.filter(d => d.type === 'Access Control').length], ['Forced Open', 1], ['Held Open', 3], ['Denied Events', events.filter(e => e.message.includes('Door')).length]]} /><Panel title="Recent Access Logs"><EventTable events={events.filter(e => e.device?.type === 'Access Control')} /></Panel></ModuleLayout>;
}

function PowerUps({ devices, events }) {
  return <ModuleLayout title="Power / UPS Module"><StatusGrid items={[['Mains Power', 'NORMAL'], ['UPS Average Battery', '82%'], ['Estimated Runtime', '47 min'], ['Generator Status', 'Standby']]} /><Panel title="Power Failure Events"><EventTable events={events.filter(e => ['UPS', 'Power Meter'].includes(e.device?.type))} /></Panel></ModuleLayout>;
}

function Maintenance({ maintenance, devices, ticketDevice, setTicketDevice }) {
  return <Panel title="Maintenance Module" action={<select className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" value={ticketDevice} onChange={e => setTicketDevice(e.target.value)}><option>Create ticket for...</option>{devices.map(d => <option key={d.id}>{d.name}</option>)}</select>}>
    <DataTable headers={['Device', 'Issue', 'Technician', 'Priority', 'Status', 'Due']}>{maintenance.map(m => <tr key={m.id} className="border-t border-zinc-800"><td className="p-3">{m.device?.name}</td><td className="p-3">{m.issue}</td><td className="p-3">{m.technician?.name || '-'}</td><td className="p-3"><Severity value={m.priority} /></td><td className="p-3"><Badge tone={m.status === 'resolved' ? 'online' : 'maintenance'}>{m.status}</Badge></td><td className="p-3 text-zinc-400">{m.due_date}</td></tr>)}</DataTable>
  </Panel>;
}

function Reports({ reports }) {
  const bars = reports?.events_by_type || [];
  return <div className="space-y-5"><Panel title="Reports Overview"><ResponsiveContainer width="100%" height={260}><BarChart data={bars}><CartesianGrid stroke="#27272a" /><XAxis dataKey="event_type" stroke="#a1a1aa" /><YAxis stroke="#a1a1aa" /><Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46' }} /><Bar dataKey="total" fill="#22d3ee" /></BarChart></ResponsiveContainer></Panel><Panel title="Export-ready Report Sections"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">{['Daily alarm report', 'Device downtime report', 'Maintenance report', 'Fire alarm event report', 'HVAC fault report'].map(x => <div className="rounded-md bg-zinc-950 p-4 text-sm" key={x}>{x}<div className="mt-2 text-xs text-zinc-500">PDF layout ready</div></div>)}</div></Panel></div>;
}

function SettingsPanel({ settings }) {
  return <Panel title="Settings / Integration Module"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{settings.map(s => <div key={s.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4"><div className="flex items-center justify-between"><b>{s.name}</b><Badge tone={s.enabled ? 'online' : 'offline'}>{s.enabled ? 'enabled' : 'disabled'}</Badge></div><div className="mt-3 space-y-1 text-xs text-zinc-400">{Object.entries(s.settings || {}).map(([k, v]) => <div key={k} className="flex justify-between gap-4"><span>{k}</span><span className="text-zinc-300">{String(v)}</span></div>)}</div></div>)}</div></Panel>;
}

function AcknowledgeModal({ event, onClose, onSaved }) {
  const [notes, setNotes] = useState('');
  async function save() { await api(`/events/${event.id}/acknowledge`, { method: 'POST', body: JSON.stringify({ notes }) }); onSaved(); }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><div className="w-full max-w-lg rounded-lg border border-zinc-700 bg-zinc-900 p-5"><h2 className="text-lg font-semibold">Acknowledge Event</h2><p className="mt-2 text-sm text-zinc-400">{event.message}</p><textarea className="mt-4 h-28 w-full rounded-md border border-zinc-700 bg-zinc-950 p-3" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Resolution notes" /><div className="mt-4 flex justify-end gap-2"><button onClick={onClose} className="rounded-md border border-zinc-700 px-4 py-2">Cancel</button><button onClick={save} className="rounded-md bg-cyan-400 px-4 py-2 font-semibold text-zinc-950">Acknowledge</button></div></div></div>;
}

function Panel({ title, action, children }) { return <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-semibold">{title}</h2>{action}</div>{children}</section>; }
function ModuleLayout({ title, note, children }) { return <div className="space-y-5"><div><h2 className="text-xl font-semibold">{title}</h2>{note && <p className="mt-1 text-sm text-amber-300">{note}</p>}</div>{children}</div>; }
function DataTable({ headers, children }) { return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs uppercase text-zinc-500"><tr>{headers.map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
function EventTable({ events, onSelect = () => {} }) { return <DataTable headers={['Time', 'Source', 'Type', 'Severity', 'Message', 'Ack']} children={events.map(e => <tr key={e.id} onClick={() => onSelect(e)} className="cursor-pointer border-t border-zinc-800 hover:bg-zinc-800/60"><td className="p-3 text-zinc-400">{formatDate(e.occurred_at)}</td><td className="p-3">{e.device?.name || 'Gateway'}</td><td className="p-3">{e.event_type}</td><td className="p-3"><Severity value={e.severity} /></td><td className="p-3 text-zinc-300">{e.message}</td><td className="p-3">{e.acknowledged ? <Badge tone="online">yes</Badge> : <Badge tone="alarm">no</Badge>}</td></tr>)} />; }
function SearchBox({ query, setQuery }) { return <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" /><input className="rounded-md border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-sm" placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} /></div>; }
function StatusGrid({ items }) { return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{items.map(([label, value]) => <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"><div className="text-xs uppercase text-zinc-500">{label}</div><div className="mt-2 text-2xl font-semibold">{value}</div></div>)}</section>; }
function Metric({ label, value }) { return <div className="rounded-md bg-zinc-950 p-3"><div className="text-xs text-zinc-500">{label}</div><div className="font-semibold">{value}</div></div>; }
function formatDate(value) { return value ? new Date(value).toLocaleString() : '-'; }
function normalizeTrend(rows) { const map = {}; rows.forEach(r => { map[r.day] ||= { day: r.day, critical: 0, high: 0, medium: 0, low: 0 }; map[r.day][r.severity] = r.total; }); return Object.values(map); }

function App() {
  const [user, setUser] = useState(null);
  useEffect(() => { if (localStorage.getItem(tokenKey)) api('/user').then(d => setUser(d.user)).catch(() => localStorage.removeItem(tokenKey)); }, []);
  if (!user) return <Login onLogin={setUser} />;
  return <Shell user={user} onLogout={() => setUser(null)} />;
}

createRoot(document.getElementById('root')).render(<App />);
