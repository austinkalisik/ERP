<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Service;
use App\Models\SystemStatus;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $statusCounts = Ticket::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $priorityCounts = Ticket::query()
            ->selectRaw('priority, count(*) as total')
            ->groupBy('priority')
            ->pluck('total', 'priority');

        $activeStatuses = ['open', 'in_progress', 'waiting_client'];
        $resolvedToday = Ticket::query()
            ->whereDate('resolved_at', now()->toDateString())
            ->count();
        $closedTickets = Ticket::query()->whereIn('status', ['resolved', 'closed'])->count();
        $breachedTickets = Ticket::query()
            ->whereIn('status', ['resolved', 'closed'])
            ->whereColumn('resolved_at', '>', 'due_at')
            ->count()
            + Ticket::query()->whereIn('status', $activeStatuses)->where('due_at', '<', now())->count();
        $totalTickets = max(Ticket::count(), 1);

        return response()->json([
            'total' => $totalTickets,
            'open' => (int) ($statusCounts['open'] ?? 0),
            'in_progress' => (int) ($statusCounts['in_progress'] ?? 0),
            'waiting_client' => (int) (($statusCounts['waiting_client'] ?? 0) + ($statusCounts['waiting'] ?? 0)),
            'resolved' => (int) ($statusCounts['resolved'] ?? 0),
            'closed' => (int) ($statusCounts['closed'] ?? 0),
            'resolved_today' => $resolvedToday,
            'critical' => (int) (($priorityCounts['critical'] ?? 0) + ($priorityCounts['urgent'] ?? 0)),
            'overdue' => Ticket::query()
                ->whereIn('status', $activeStatuses)
                ->where('due_at', '<', now())
                ->count(),
            'customers' => Client::count(),
            'sla_compliance' => round((($totalTickets - $breachedTickets) / $totalTickets) * 100, 1),
            'recent_tickets' => Ticket::query()->with(['client', 'service'])->latest()->limit(8)->get(),
            'service_summary' => Service::query()
                ->withCount([
                    'tickets',
                    'tickets as open_tickets_count' => fn ($query) => $query->whereIn('status', $activeStatuses),
                    'tickets as sla_risk_count' => fn ($query) => $query->whereIn('status', $activeStatuses)->where('due_at', '<=', now()->addHours(4)),
                ])
                ->orderBy('name')
                ->get(),
            'system_statuses' => SystemStatus::query()->orderBy('name')->get(),
            'sla' => [
                'compliant' => $totalTickets - $breachedTickets,
                'at_risk' => Ticket::query()->whereIn('status', $activeStatuses)->whereBetween('due_at', [now(), now()->addHours(4)])->count(),
                'breached' => $breachedTickets,
                'closed' => $closedTickets,
            ],
        ]);
    }
}
