<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CRMReportController extends Controller
{
    /**
     * GET /api/crm/reports/revenue
     *
     * group_by = month | service | client   (default: month)
     * date_from, date_to  (optional range)
     */
    public function revenue(Request $request): JsonResponse
    {
        $groupBy  = $request->get('group_by', 'month');
        $dateFrom = $request->get('date_from');
        $dateTo   = $request->get('date_to');

        $where  = '';
        $params = [];

        if ($dateFrom) {
            $where   .= ' AND p.payment_date >= ?';
            $params[] = $dateFrom;
        }
        if ($dateTo) {
            $where   .= ' AND p.payment_date <= ?';
            $params[] = $dateTo;
        }

        $data = match ($groupBy) {

            'service' => DB::select("
                SELECT
                    s.name                              AS label,
                    COUNT(p.id)                         AS payment_count,
                    COALESCE(SUM(p.amount), 0)         AS total,
                    COALESCE(AVG(p.amount), 0)         AS average
                FROM crm_payments p
                JOIN crm_subscriptions sub ON sub.id = p.subscription_id
                JOIN crm_services s        ON s.id   = sub.service_id
                WHERE 1=1 {$where}
                GROUP BY s.id, s.name
                ORDER BY total DESC
            ", $params),

            'client' => DB::select("
                SELECT
                    c.name                              AS label,
                    COUNT(p.id)                         AS payment_count,
                    COALESCE(SUM(p.amount), 0)         AS total,
                    COALESCE(AVG(p.amount), 0)         AS average
                FROM crm_payments p
                JOIN crm_subscriptions sub ON sub.id = p.subscription_id
                JOIN crm_clients c         ON c.id   = sub.client_id
                WHERE 1=1 {$where}
                GROUP BY c.id, c.name
                ORDER BY total DESC
                LIMIT 20
            ", $params),

            default => DB::select("
                SELECT
                    DATE_FORMAT(p.payment_date, '%b %Y')  AS label,
                    DATE_FORMAT(p.payment_date, '%Y-%m')  AS sort_key,
                    COUNT(p.id)                           AS payment_count,
                    COALESCE(SUM(p.amount), 0)           AS total,
                    COALESCE(AVG(p.amount), 0)           AS average
                FROM crm_payments p
                WHERE 1=1 {$where}
                GROUP BY label, sort_key
                ORDER BY sort_key ASC
            ", $params),
        };

        $summary = DB::selectOne("
            SELECT
                COUNT(*)                    AS total_payments,
                COALESCE(SUM(amount), 0)   AS total_revenue,
                COALESCE(AVG(amount), 0)   AS average_payment
            FROM crm_payments p
            WHERE 1=1 {$where}
        ", $params);

        return response()->json([
            'group_by' => $groupBy,
            'data'     => array_map(fn($r) => [
                'label'         => $r->label,
                'payment_count' => (int)   $r->payment_count,
                'total'         => (float) $r->total,
                'average'       => (float) $r->average,
            ], $data),
            'summary'  => [
                'total_payments' => (int)   ($summary->total_payments  ?? 0),
                'total_revenue'  => (float) ($summary->total_revenue   ?? 0),
                'average'        => (float) ($summary->average_payment ?? 0),
            ],
        ]);
    }

    /**
     * GET /api/crm/reports/expiry
     *
     * window = 30 | 60 | 90 | all   (default: 30)
     * status = Active | Expiring | Expired
     */
    public function expiry(Request $request): JsonResponse
    {
        $window = $request->get('window', 30);

        $query = "
            SELECT
                c.name          AS client_name,
                c.phone         AS phone,
                c.email         AS email,
                s.name          AS service_name,
                sub.billing_cycle,
                sub.amount,
                sub.expiry_date,
                sub.status,
                sub.credit_days,
                DATEDIFF(sub.expiry_date, CURDATE()) AS days_left
            FROM crm_subscriptions sub
            JOIN crm_clients  c ON c.id = sub.client_id
            JOIN crm_services s ON s.id = sub.service_id
            WHERE sub.status != 'Suspended'
        ";

        $params = [];

        if ($window !== 'all') {
            $query   .= " AND sub.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)";
            $params[] = (int) $window;
        }

        if ($request->filled('status')) {
            $query   .= " AND sub.status = ?";
            $params[] = $request->status;
        }

        $query .= " ORDER BY sub.expiry_date ASC";

        $results = DB::select($query, $params);

        $summary = DB::selectOne("
            SELECT
                SUM(CASE WHEN status = 'Active'   THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN status = 'Expiring' THEN 1 ELSE 0 END) AS expiring,
                SUM(CASE WHEN status = 'Expired'  THEN 1 ELSE 0 END) AS expired
            FROM crm_subscriptions
            WHERE status != 'Suspended'
        ");

        return response()->json([
            'window'  => $window,
            'data'    => array_map(fn($r) => [
                'client_name'   => $r->client_name,
                'phone'         => $r->phone,
                'email'         => $r->email,
                'service_name'  => $r->service_name,
                'billing_cycle' => $r->billing_cycle,
                'amount'        => (float) $r->amount,
                'expiry_date'   => $r->expiry_date,
                'status'        => $r->status,
                'credit_days'   => (int) $r->credit_days,
                'days_left'     => (int) $r->days_left,
            ], $results),
            'summary' => [
                'active'   => (int) ($summary->active   ?? 0),
                'expiring' => (int) ($summary->expiring ?? 0),
                'expired'  => (int) ($summary->expired  ?? 0),
            ],
        ]);
    }

    /**
     * GET /api/crm/reports/credits
     *
     * Clients with accumulated credit days + interruption log.
     */
    public function credits(Request $request): JsonResponse
    {
        $clients = DB::select("
            SELECT
                c.id                              AS client_id,
                c.name                            AS client_name,
                c.phone                           AS phone,
                COUNT(sub.id)                     AS subscription_count,
                SUM(sub.credit_days)              AS total_credit_days,
                SUM(
                    CASE WHEN sub.billing_cycle = 'Monthly'
                    THEN sub.amount / 30 * sub.credit_days
                    ELSE 0 END
                )                                 AS estimated_credit_value
            FROM crm_clients c
            JOIN crm_subscriptions sub ON sub.client_id = c.id
            WHERE sub.credit_days > 0
            GROUP BY c.id, c.name, c.phone
            ORDER BY total_credit_days DESC
        ");

        $interruptions = DB::select("
            SELECT
                c.name          AS client_name,
                s.name          AS service_name,
                i.from_date,
                i.to_date,
                i.credit_days,
                i.reason,
                sub.expiry_date AS new_expiry
            FROM crm_service_interruptions i
            JOIN crm_subscriptions sub ON sub.id = i.subscription_id
            JOIN crm_clients  c        ON c.id   = sub.client_id
            JOIN crm_services s        ON s.id   = sub.service_id
            ORDER BY i.created_at DESC
            LIMIT 50
        ");

        $summary = DB::selectOne("
            SELECT
                COUNT(DISTINCT sub.client_id)  AS clients_with_credits,
                SUM(sub.credit_days)           AS total_credit_days,
                COUNT(i.id)                    AS total_interruptions
            FROM crm_subscriptions sub
            JOIN crm_service_interruptions i ON i.subscription_id = sub.id
            WHERE sub.credit_days > 0
        ");

        return response()->json([
            'clients'       => array_map(fn($r) => [
                'client_id'              => $r->client_id,
                'client_name'            => $r->client_name,
                'phone'                  => $r->phone,
                'subscription_count'     => (int)   $r->subscription_count,
                'total_credit_days'      => (int)   $r->total_credit_days,
                'estimated_credit_value' => (float) $r->estimated_credit_value,
            ], $clients),
            'interruptions' => array_map(fn($r) => [
                'client_name'  => $r->client_name,
                'service_name' => $r->service_name,
                'from_date'    => $r->from_date,
                'to_date'      => $r->to_date,
                'credit_days'  => (int) $r->credit_days,
                'reason'       => $r->reason,
                'new_expiry'   => $r->new_expiry,
            ], $interruptions),
            'summary' => [
                'clients_with_credits' => (int) ($summary->clients_with_credits ?? 0),
                'total_credit_days'    => (int) ($summary->total_credit_days    ?? 0),
                'total_interruptions'  => (int) ($summary->total_interruptions  ?? 0),
            ],
        ]);
    }
}