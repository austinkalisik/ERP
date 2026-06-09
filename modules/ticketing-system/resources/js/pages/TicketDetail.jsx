import { useState } from 'react';
import { api, priorityLabels, statusLabels } from '../support';
import Badge from '../components/Badge';

export default function TicketDetail({ reload, selectedTicket, setError, setSelectedTicket }) {
    const [note, setNote] = useState('');
    const [visibility, setVisibility] = useState('internal');

    if (!selectedTicket) {
        return <section className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">Select a ticket to view detail and activity.</section>;
    }

    async function addComment(event) {
        event.preventDefault();
        if (!note.trim()) return;

        try {
            await api(`/tickets/${selectedTicket.id}/comments`, {
                method: 'POST',
                body: JSON.stringify({ author_name: 'NextGen Support', body: note, visibility }),
            });
            const fresh = await api(`/tickets/${selectedTicket.id}`);
            setSelectedTicket(fresh);
            setNote('');
            await reload(selectedTicket.id);
        } catch (exception) {
            setError(exception.message);
        }
    }

    return (
        <section className="rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-blue-700">{selectedTicket.ticket_number}</p>
                        <h2 className="mt-1 text-lg font-semibold">{selectedTicket.title}</h2>
                    </div>
                    <Badge labels={statusLabels} value={selectedTicket.status} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{selectedTicket.description}</p>
            </div>
            <dl className="grid grid-cols-2 gap-4 border-b border-slate-200 p-4 text-sm">
                <Info label="Client" value={selectedTicket.client?.name ?? selectedTicket.department} />
                <Info label="Service" value={selectedTicket.service?.name ?? selectedTicket.category} />
                <Info label="Assignee" value={selectedTicket.assignee_name ?? 'Unassigned'} />
                <Info label="Priority" value={<Badge labels={priorityLabels} value={selectedTicket.priority} />} />
                <Info label="Reported" value={selectedTicket.reported_at ? new Date(selectedTicket.reported_at).toLocaleString() : 'Not set'} />
                <Info label="SLA Due" value={selectedTicket.due_at ? new Date(selectedTicket.due_at).toLocaleString() : 'Not set'} />
            </dl>
            <form className="border-b border-slate-200 p-4" onSubmit={addComment}>
                <div className="mb-2 flex gap-2">
                    <button className={`rounded-md px-3 py-1.5 text-xs font-semibold ${visibility === 'internal' ? 'bg-blue-600 text-white' : 'border border-slate-300'}`} onClick={() => setVisibility('internal')} type="button">Internal Note</button>
                    <button className={`rounded-md px-3 py-1.5 text-xs font-semibold ${visibility === 'public' ? 'bg-blue-600 text-white' : 'border border-slate-300'}`} onClick={() => setVisibility('public')} type="button">Public Comment</button>
                </div>
                <textarea className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" onChange={(event) => setNote(event.target.value)} placeholder="Write ticket activity..." value={note} />
                <button className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white" type="submit">Add Update</button>
            </form>
            <div className="max-h-[420px] space-y-3 overflow-auto p-4">
                {(selectedTicket.comments ?? []).map((comment) => (
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={comment.id}>
                        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">{comment.author_name} · {comment.visibility}</span>
                            <span>{new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{comment.body}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function Info({ label, value }) {
    return <div><dt className="text-xs font-bold uppercase text-slate-500">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>;
}
