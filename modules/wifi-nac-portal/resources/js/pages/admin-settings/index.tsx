import { Head, Link, useForm } from '@inertiajs/react';
import { PlusCircle, Star, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { User } from '@/types/auth';

type Props = {
    users: User[];
    settings: {
        email_from_address: string;
        email_from_name: string;
        mail_host: string;
        mail_port: string;
        mail_scheme: string;
        mail_username: string;
        send_email_user_ids: number[];
        brand_name: string;
        brand_logo_url: string;
    };
};

export default function AdminSettings({ users, settings }: Props) {
    const [collapsed, setCollapsed] = useState(false);
    const form = useForm({
        _method: 'patch',
        email_from_address: settings.email_from_address,
        email_from_name: settings.email_from_name,
        mail_host: settings.mail_host,
        mail_port: settings.mail_port,
        mail_scheme: settings.mail_scheme ?? 'smtp',
        mail_username: settings.mail_username ?? '',
        mail_password: '',
        send_email_user_ids: settings.send_email_user_ids ?? [],
        brand_name: settings.brand_name,
        brand_logo: null as File | null,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/admin-settings', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const toggleSendEmail = (userId: number, checked: boolean) => {
        form.setData(
            'send_email_user_ids',
            checked
                ? [...form.data.send_email_user_ids, userId]
                : form.data.send_email_user_ids.filter((id) => id !== userId),
        );
    };

    return (
        <>
            <Head title="Admin Settings" />
            <form onSubmit={submit} className="legacy-panel legacy-admin">
                <div className="legacy-panel-title">
                    <span>Admin User and Email Settings</span>
                    <div className="legacy-admin-actions">
                        <button
                            type="button"
                            onClick={() => setCollapsed((value) => !value)}
                        >
                            Admin Actions ▾
                        </button>
                        {!collapsed && (
                            <div>
                                <Link href="/users">
                                    <PlusCircle size={14} /> Add Admins ...
                                </Link>
                                <Link href="/users" className="danger">
                                    <XCircle size={14} /> Delete Admins ...
                                </Link>
                            </div>
                        )}
                        <button
                            type="submit"
                            className="legacy-save"
                            disabled={form.processing}
                        >
                            <Star size={14} /> Save Settings
                        </button>
                    </div>
                </div>
                <div className="legacy-panel-body legacy-admin-body">
                    <section>
                        <h2>Admin User Listing</h2>
                        <p>
                            Showing {users.length === 0 ? 0 : 1} to{' '}
                            {users.length} of {users.length} Admin Users
                        </p>
                        <table className="legacy-table">
                            <thead>
                                <tr>
                                    <th>First Name</th>
                                    <th>Last Name</th>
                                    <th>Email Address</th>
                                    <th>Send Emails</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="legacy-loading"
                                        >
                                            No admin users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => {
                                        const [first, ...last] =
                                            user.name.split(' ');

                                        return (
                                            <tr key={user.id}>
                                                <td>
                                                    <input
                                                        value={first}
                                                        readOnly
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        value={
                                                            last.join(' ') ||
                                                            'user'
                                                        }
                                                        readOnly
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        value={user.email}
                                                        readOnly
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={form.data.send_email_user_ids.includes(
                                                            user.id,
                                                        )}
                                                        onChange={(event) =>
                                                            toggleSendEmail(
                                                                user.id,
                                                                event.target
                                                                    .checked,
                                                            )
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </section>
                    <section>
                        <h2>Header Branding</h2>
                        <p>
                            These details control the sidebar and page header
                            shown to staff users.
                        </p>
                        <label>
                            System Name
                            <input
                                value={form.data.brand_name}
                                onChange={(event) =>
                                    form.setData(
                                        'brand_name',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                        </label>
                        <label>
                            Logo Image
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                    form.setData(
                                        'brand_logo',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                            />
                        </label>
                        {settings.brand_logo_url && (
                            <div className="legacy-brand-preview">
                                <img
                                    src={settings.brand_logo_url}
                                    alt={settings.brand_name}
                                />
                            </div>
                        )}
                    </section>
                    <section>
                        <h2>Email Settings</h2>
                        <p>
                            These details are used for any automated email
                            communication to applicants
                        </p>
                        <label>
                            Email From Address
                            <input
                                type="email"
                                value={form.data.email_from_address}
                                onChange={(event) =>
                                    form.setData(
                                        'email_from_address',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                        </label>
                        <label>
                            Email From Name
                            <input
                                value={form.data.email_from_name}
                                onChange={(event) =>
                                    form.setData(
                                        'email_from_name',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                        </label>
                        <label>
                            Mail Host
                            <input
                                value={form.data.mail_host}
                                onChange={(event) =>
                                    form.setData(
                                        'mail_host',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                        </label>
                        <label>
                            SMTP Security
                            <select
                                value={form.data.mail_scheme}
                                onChange={(event) =>
                                    form.setData(
                                        'mail_scheme',
                                        event.target.value,
                                    )
                                }
                            >
                                <option value="">None</option>
                                <option value="smtp">STARTTLS / SMTP</option>
                                <option value="smtps">SSL / SMTPS</option>
                            </select>
                        </label>
                        <label>
                            SMTP Username
                            <input
                                value={form.data.mail_username}
                                onChange={(event) =>
                                    form.setData(
                                        'mail_username',
                                        event.target.value,
                                    )
                                }
                                placeholder="mailbox username"
                            />
                        </label>
                        <label>
                            SMTP Password
                            <input
                                type="password"
                                value={form.data.mail_password}
                                onChange={(event) =>
                                    form.setData(
                                        'mail_password',
                                        event.target.value,
                                    )
                                }
                                placeholder="Leave blank to keep existing password"
                            />
                        </label>
                        <label>
                            Mail Port
                            <input
                                type="number"
                                min="1"
                                max="65535"
                                value={form.data.mail_port}
                                onChange={(event) =>
                                    form.setData(
                                        'mail_port',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                        </label>
                    </section>
                </div>
            </form>
        </>
    );
}

AdminSettings.layout = {
    breadcrumbs: [{ title: 'Admin Settings', href: '/admin-settings' }],
};
