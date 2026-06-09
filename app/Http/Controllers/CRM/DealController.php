<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CRM\Deal;
use App\Models\CRM\DealDocument;
use App\Models\CRM\DealInvoice;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DealController extends Controller
{
    // ── Get system currency ───────────────────────────────────────────────
    private function currency(): string
    {
        return SystemSetting::first()?->currency ?? 'PGK';
    }

    // ── List all deals ────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = Deal::with(['client', 'service', 'assignedTo'])
            ->when($request->stage,    fn($q) => $q->where('stage', $request->stage))
            ->when($request->priority, fn($q) => $q->where('priority', $request->priority))
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->when($request->search,   fn($q) => $q->where('title', 'like', "%{$request->search}%"))
            ->latest();

        return response()->json($query->paginate($request->per_page ?? 50));
    }

    // ── Create deal ───────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'client_id'           => 'required|exists:crm_clients,id',
            'service_id'          => 'nullable|exists:crm_services,id',
            'assigned_to'         => 'nullable|exists:users,id',
            'title'               => 'required|string|max:255',
            'category'            => 'nullable|string|max:100',
            'priority'            => 'in:Low,Medium,High',
            'stage'               => 'in:Lead,Qualified,Proposal,Negotiation,Closed Won,Closed Lost',
            'value'               => 'nullable|numeric|min:0',
            'expected_close_date' => 'nullable|date',
            'description'         => 'nullable|string',
            'notes'               => 'nullable|string',
            'project_status'      => 'nullable|string',
        ]);

        $data['currency'] = $this->currency();

        $deal = Deal::create($data);

        return response()->json($deal->load(['client', 'service', 'assignedTo']), 201);
    }

    // ── Show single deal ──────────────────────────────────────────────────
    public function show(Deal $deal)
    {
        return response()->json(
            $deal->load(['client', 'service', 'assignedTo', 'documents.uploader', 'invoices.recorder'])
        );
    }

    // ── Update deal ───────────────────────────────────────────────────────
    public function update(Request $request, Deal $deal)
    {
        $data = $request->validate([
            'client_id'           => 'sometimes|exists:crm_clients,id',
            'service_id'          => 'nullable|exists:crm_services,id',
            'assigned_to'         => 'nullable|exists:users,id',
            'title'               => 'sometimes|string|max:255',
            'category'            => 'nullable|string|max:100',
            'priority'            => 'in:Low,Medium,High',
            'stage'               => 'in:Lead,Qualified,Proposal,Negotiation,Closed Won,Closed Lost',
            'value'               => 'nullable|numeric|min:0',
            'expected_close_date' => 'nullable|date',
            'actual_close_date'   => 'nullable|date',
            'description'         => 'nullable|string',
            'notes'               => 'nullable|string',
            'project_status'      => 'nullable|string',
        ]);

        if (isset($data['stage']) && in_array($data['stage'], ['Closed Won', 'Closed Lost'])) {
            $data['actual_close_date'] = now()->toDateString();
        }

        $deal->update($data);

        return response()->json($deal->load(['client', 'service', 'assignedTo']));
    }

    // ── Delete deal ───────────────────────────────────────────────────────
    public function destroy(Deal $deal)
    {
        foreach ($deal->documents as $doc) {
            Storage::disk('public')->delete($doc->file_path);
        }
        $deal->delete();
        return response()->json(['message' => 'Deal deleted.']);
    }

    // ── Upload document ───────────────────────────────────────────────────
    public function uploadDocument(Request $request, Deal $deal)
    {
        $request->validate([
            'file'  => 'required|file|max:20480',
            'name'  => 'nullable|string|max:255',
            'type'  => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $file = $request->file('file');
        $path = $file->store("crm/deals/{$deal->id}/documents", 'public');

        $doc = DealDocument::create([
            'deal_id'     => $deal->id,
            'uploaded_by' => Auth::id(),
            'name'        => $request->name ?: $file->getClientOriginalName(),
            'type'        => $request->type ?? 'Other',
            'file_path'   => $path,
            'file_name'   => $file->getClientOriginalName(),
            'mime_type'   => $file->getMimeType(),
            'file_size'   => $file->getSize(),
            'notes'       => $request->notes,
        ]);

        return response()->json($doc->load('uploader'), 201);
    }

    // ── Delete document ───────────────────────────────────────────────────
    public function deleteDocument(Deal $deal, DealDocument $document)
    {
        Storage::disk('public')->delete($document->file_path);
        $document->delete();
        return response()->json(['message' => 'Document deleted.']);
    }

    // ── Download document ─────────────────────────────────────────────────
public function downloadDocument(Deal $deal, DealDocument $document)
{
    if (!Storage::disk('public')->exists($document->file_path)) {
        abort(404, 'File not found.');
    }

    $path = Storage::disk('public')->path($document->file_path);

    return response()->file($path, [
        'Content-Type'        => $document->mime_type ?? 'application/octet-stream',
        'Content-Disposition' => 'inline; filename="' . $document->file_name . '"',
    ]);
}

    // ── Add invoice ───────────────────────────────────────────────────────
    public function addInvoice(Request $request, Deal $deal)
    {
        $data = $request->validate([
            'invoice_number' => 'required|string|max:100',
            'amount'         => 'required|numeric|min:0',
            'status'         => 'in:Draft,Sent,Paid,Overdue,Cancelled',
            'issue_date'     => 'required|date',
            'due_date'       => 'nullable|date',
            'paid_date'      => 'nullable|date',
            'notes'          => 'nullable|string',
        ]);

        $invoice = DealInvoice::create([
            ...$data,
            'deal_id'     => $deal->id,
            'currency'    => $this->currency(),
            'recorded_by' => Auth::id(),
        ]);

        return response()->json($invoice->load('recorder'), 201);
    }

    // ── Update invoice ────────────────────────────────────────────────────
    public function updateInvoice(Request $request, Deal $deal, DealInvoice $invoice)
    {
        $data = $request->validate([
            'invoice_number' => 'sometimes|string|max:100',
            'amount'         => 'sometimes|numeric|min:0',
            'status'         => 'in:Draft,Sent,Paid,Overdue,Cancelled',
            'issue_date'     => 'sometimes|date',
            'due_date'       => 'nullable|date',
            'paid_date'      => 'nullable|date',
            'notes'          => 'nullable|string',
        ]);

        $invoice->update($data);
        return response()->json($invoice->load('recorder'));
    }

    // ── Delete invoice ────────────────────────────────────────────────────
    public function deleteInvoice(Deal $deal, DealInvoice $invoice)
    {
        $invoice->delete();
        return response()->json(['message' => 'Invoice deleted.']);
    }

    // ── Pipeline summary ──────────────────────────────────────────────────
    public function pipeline()
    {
        $stages = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
        $currency = $this->currency();

        $data = collect($stages)->map(fn($stage) => [
            'stage'    => $stage,
            'count'    => Deal::where('stage', $stage)->count(),
            'value'    => Deal::where('stage', $stage)->sum('value'),
            'currency' => $currency,
        ]);

        return response()->json($data);
    }
}