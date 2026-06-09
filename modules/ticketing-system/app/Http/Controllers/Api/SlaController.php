<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SlaContract;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;

class SlaController extends Controller
{
    public function index(): JsonResponse
    {
        $active = ['open', 'in_progress', 'waiting_client'];

        return response()->json([
            'contracts' => SlaContract::query()->with(['client', 'service'])->latest()->get(),
            'breached' => Ticket::query()->whereIn('status', $active)->where('due_at', '<', now())->with(['client', 'service'])->get(),
            'at_risk' => Ticket::query()->whereIn('status', $active)->whereBetween('due_at', [now(), now()->addHours(4)])->with(['client', 'service'])->get(),
            'compliant' => Ticket::query()->where(function ($query) use ($active): void {
                $query->whereIn('status', $active)->where('due_at', '>', now()->addHours(4))
                    ->orWhereIn('status', ['resolved', 'closed'])->whereColumn('resolved_at', '<=', 'due_at');
            })->count(),
        ]);
    }
}
