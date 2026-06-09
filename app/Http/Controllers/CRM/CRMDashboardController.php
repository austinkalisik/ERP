<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CRMDashboardController extends Controller
{
    /**
     * GET /api/crm/stats
     * All counts in a single raw SQL round-trip. No N+1, no loops.
     */
    public function stats(): JsonResponse
    {
        $counts = DB::selectOne("
            SELECT
                (SELECT COUNT(*) FROM crm_clients)                                   AS total_clients,
                (SELECT COUNT(*) FROM crm_subscriptions WHERE status = 'Active')     AS active_subscriptions,
                (SELECT COUNT(*) FROM crm_subscriptions WHERE status = 'Expiring')   AS expiring_soon,
                (SELECT COUNT(*) FROM crm_subscriptions WHERE status = 'Expired')    AS expired,
                (SELECT COALESCE(SUM(amount), 0) FROM crm_subscriptions
                    WHERE status IN ('Active','Expiring')
                    AND billing_cycle = 'Monthly')                                   AS monthly_revenue,
                (SELECT COALESCE(SUM(credit_days), 0) FROM crm_subscriptions)       AS total_credit_days
        ");

        $byService = DB::select("
            SELECT
                s.name AS service,
                COUNT(sub.id) AS count,
                COALESCE(SUM(
                    CASE WHEN sub.billing_cycle = 'Monthly' THEN sub.amount ELSE 0 END
                ), 0) AS revenue
            FROM crm_services s
            LEFT JOIN crm_subscriptions sub
                ON sub.service_id = s.id AND sub.status = 'Active'
            WHERE s.is_active = 1
            GROUP BY s.id, s.name
            ORDER BY s.name ASC
        ");

        return response()->json([
            'totalClients'        => (int)   ($counts->total_clients        ?? 0),
            'activeSubscriptions' => (int)   ($counts->active_subscriptions ?? 0),
            'expiringSoon'        => (int)   ($counts->expiring_soon        ?? 0),
            'expired'             => (int)   ($counts->expired              ?? 0),
            'monthlyRevenue'      => (float) ($counts->monthly_revenue      ?? 0),
            'totalCredits'        => (int)   ($counts->total_credit_days    ?? 0),
            'byService'           => array_map(fn($r) => [
                'service' => $r->service,
                'count'   => (int)   $r->count,
                'revenue' => (float) $r->revenue,
            ], $byService),
        ]);
    }
}