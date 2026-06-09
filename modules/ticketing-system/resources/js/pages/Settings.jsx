import { api } from '../support';

export default function Settings({ reload, setError, setSettings, settings }) {
    function update(key, value) {
        setSettings({ ...settings, [key]: value });
    }

    async function submit(event) {
        event.preventDefault();
        try {
            const saved = await api('/settings', { method: 'PUT', body: JSON.stringify(settings) });
            setSettings(saved);
            await reload();
        } catch (exception) {
            setError(exception.message);
        }
    }

    return (
        <form className="max-w-5xl rounded-md border border-slate-200 bg-white p-5 shadow-sm" onSubmit={submit}>
            <h2 className="text-lg font-semibold">System Settings</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Company Name" onChange={(value) => update('company_name', value)} value={settings.company_name} />
                <Field label="Website URL" onChange={(value) => update('website_url', value)} type="url" value={settings.website_url} />
                <Field label="Support Email" onChange={(value) => update('support_email', value)} type="email" value={settings.support_email} />
                <Field label="Support Phone" onChange={(value) => update('support_phone', value)} value={settings.support_phone} />
                <Field label="Default SLA Minutes" onChange={(value) => update('default_sla_minutes', value)} type="number" value={settings.default_sla_minutes ?? ''} />
                <Field label="Profile Name" onChange={(value) => update('profile_name', value)} value={settings.profile_name} />
                <Field label="Profile Role" onChange={(value) => update('profile_role', value)} value={settings.profile_role} />
                <label className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold">
                    <input checked={String(settings.notifications_enabled) === '1' || settings.notifications_enabled === true} onChange={(event) => update('notifications_enabled', event.target.checked ? '1' : '0')} type="checkbox" />
                    Enable notifications
                </label>
            </div>
            <label className="mt-4 grid gap-1 text-sm font-semibold text-slate-700">Office Address
                <textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal" onChange={(event) => update('office_address', event.target.value)} value={settings.office_address ?? ''} />
            </label>
            <button className="mt-5 rounded-md bg-[#06162a] px-5 py-2.5 text-sm font-semibold text-white" type="submit">Save Settings</button>
        </form>
    );
}

function Field({ label, onChange, type = 'text', value }) {
    return <label className="grid gap-1 text-sm font-semibold text-slate-700">{label}<input className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal" onChange={(event) => onChange(event.target.value)} required type={type} value={value ?? ''} /></label>;
}
