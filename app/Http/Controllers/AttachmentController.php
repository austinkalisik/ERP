<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentController extends Controller
{
    // Supported model types — add more here as needed (e.g. AIMS items)
    private const ALLOWED_TYPES = [
    'maintenance_log' => \App\Models\MOMS\MaintenanceLog::class,
    'crm_payment'     => \App\Models\CRM\CrmPayment::class,
];

    /**
     * POST /api/attachments/{type}/{id}
     * Upload one or more files to a model.
     */
    public function store(Request $request, string $type, int $id)
    {
        $modelClass = self::ALLOWED_TYPES[$type] ?? null;
        if (!$modelClass) {
            return response()->json(['message' => 'Invalid attachment type.'], 422);
        }

        $model = $modelClass::findOrFail($id);

        $request->validate([
            'files'   => 'required|array|max:10',
            'files.*' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240', // 10 MB
        ]);

        $uploaded = [];

        foreach ($request->file('files') as $file) {
            $folder = "attachments/{$type}/{$id}";
            $path   = $file->store($folder, 'public');

            $attachment = $model->attachments()->create([
                'file_name'   => $file->getClientOriginalName(),
                'file_path'   => $path,
                'file_type'   => $file->getMimeType(),
                'file_size'   => $file->getSize(),
                'uploaded_by' => Auth::id(),
            ]);

            $uploaded[] = $attachment;
        }

        return response()->json([
            'message' => count($uploaded) . ' file(s) uploaded successfully.',
            'data'    => $uploaded,
        ], 201);
    }

    /**
     * GET /api/attachments/{id}/download
     * Stream/download a single attachment.
     *
     * Uses response()->streamDownload() instead of Storage::disk()->download()
     * to avoid Intelephense P1013 (unresolved dynamic facade method).
     */
    public function download(int $id): StreamedResponse
    {
        $attachment = Attachment::findOrFail($id);

        if (!Storage::disk('public')->exists($attachment->file_path)) {
            abort(404, 'File not found.');
        }

        $fullPath = Storage::disk('public')->path($attachment->file_path);

        return response()->streamDownload(function () use ($fullPath) {
            readfile($fullPath);
        }, $attachment->file_name, [
            'Content-Type'        => $attachment->file_type,
            'Content-Disposition' => 'attachment; filename="' . $attachment->file_name . '"',
        ]);
    }

    /**
     * DELETE /api/attachments/{id}
     * Delete a single attachment.
     */
    public function destroy(int $id)
    {
        $attachment = Attachment::findOrFail($id);

        Storage::disk('public')->delete($attachment->file_path);
        $attachment->delete();

        return response()->json(['message' => 'Attachment deleted successfully.']);
    }
}