<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'by_status' => $this->counts('status'),
            'by_priority' => $this->counts('priority'),
            'by_service' => Ticket::query()
                ->leftJoin('services', 'tickets.service_id', '=', 'services.id')
                ->selectRaw('coalesce(services.name, tickets.category) as label, count(*) as total')
                ->groupBy('label')
                ->orderByDesc('total')
                ->get(),
            'resolved' => Ticket::query()->whereIn('status', ['resolved', 'closed'])->count(),
            'overdue' => Ticket::query()->whereIn('status', ['open', 'in_progress', 'waiting_client'])->where('due_at', '<', now())->count(),
            'monthly_trends' => Ticket::query()
                ->selectRaw("date_format(created_at, '%Y-%m') as label, count(*) as total")
                ->groupBy('label')
                ->orderBy('label')
                ->limit(12)
                ->get(),
        ]);
    }

    private function counts(string $column)
    {
        return Ticket::query()
            ->selectRaw("{$column} as label, count(*) as total")
            ->groupBy($column)
            ->orderByDesc('total')
            ->get();
    }
}
