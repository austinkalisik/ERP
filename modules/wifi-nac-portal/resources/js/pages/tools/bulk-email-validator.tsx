import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';

type Result = { email: string; valid: boolean };
type SendSummary = { sent: number; skipped: number } | null;

export default function BulkEmailValidator({
    results,
    input,
    subject,
    message,
    sendSummary,
}: {
    results: Result[];
    input: string;
    subject: string;
    message: string;
    sendSummary?: SendSummary;
}) {
    const form = useForm({
        emails: input ?? '',
        subject: subject ?? '',
        message: message ?? '',
    });
    const [collapsed, setCollapsed] = useState(false);

    const validate = (event: FormEvent) => {
        event.preventDefault();
        form.post('/bulk-email-validator', { preserveScroll: true });
    };

    const send = () => {
        form.post('/bulk-email-validator/send', { preserveScroll: true });
    };

    return (
        <>
            <Head title="Bulk Email Validator" />
            <section className="legacy-panel">
                <div className="legacy-panel-title">
                    <span>Bulk Email Validator</span>
                    <div className="legacy-panel-tools">
                        <button
                            type="button"
                            className="minimize"
                            aria-label="Collapse email validator"
                            onClick={() => setCollapsed((value) => !value)}
                        />
                        <button
                            type="button"
                            className="refresh"
                            aria-label="Clear email validator"
                            onClick={() => form.setData('emails', '')}
                        />
                    </div>
                </div>
                <form
                    onSubmit={validate}
                    className={
                        collapsed
                            ? 'legacy-panel-body legacy-email-tool hidden'
                            : 'legacy-panel-body legacy-email-tool'
                    }
                >
                    <div className="legacy-instructions">
                        <h2>Instructions:</h2>
                        <p>
                            Step 1: Add all the emails to the textbox, one email
                            on each line (basically copy/paste from the
                            spreadsheet into the textbox)
                        </p>
                        <p>Step 2: Press the validate emails button</p>
                        <p>
                            Step 3: The script will validate the list of emails
                            and advise which ones are incorrect
                        </p>
                    </div>
                    <div className="legacy-email-send-fields">
                        <label>
                            Subject
                            <input
                                value={form.data.subject}
                                onChange={(e) =>
                                    form.setData('subject', e.target.value)
                                }
                                placeholder="Email subject"
                            />
                            <InputError message={form.errors.subject} />
                        </label>
                        <label>
                            Message
                            <textarea
                                value={form.data.message}
                                onChange={(e) =>
                                    form.setData('message', e.target.value)
                                }
                                placeholder="Write the email message to send to each valid address."
                            />
                            <InputError message={form.errors.message} />
                        </label>
                    </div>
                    <textarea
                        value={form.data.emails}
                        onChange={(e) => form.setData('emails', e.target.value)}
                        placeholder="Add the list of emails here. One email per line."
                    />
                    <InputError message={form.errors.emails} />
                    <div className="legacy-email-actions">
                        <button className="legacy-action-button" type="submit">
                            Validate Emails
                        </button>
                        <button
                            className="legacy-action-button blue"
                            type="button"
                            disabled={form.processing}
                            onClick={send}
                        >
                            Send Email to Valid Addresses
                        </button>
                    </div>
                    {sendSummary && (
                        <div className="legacy-send-summary">
                            Sent {sendSummary.sent} email(s). Skipped{' '}
                            {sendSummary.skipped} invalid address(es).
                        </div>
                    )}
                    {results.length > 0 && (
                        <div className="legacy-results">
                            {results.map((result) => (
                                <p
                                    key={result.email}
                                    className={
                                        result.valid ? 'valid' : 'invalid'
                                    }
                                >
                                    {result.email} -{' '}
                                    {result.valid ? 'Valid' : 'Invalid'}
                                </p>
                            ))}
                        </div>
                    )}
                </form>
            </section>
        </>
    );
}

BulkEmailValidator.layout = {
    breadcrumbs: [
        { title: 'Bulk Email Validator', href: '/bulk-email-validator' },
    ],
};
