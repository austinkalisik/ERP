<?php

namespace App\Http\Controllers\AIMS;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class ExchangeRateController extends Controller
{
    /**
     * GET /api/aims/exchange-rate?from=AUD&to=PGK
     *
     * Tries two free APIs in order:
     *  1. open.er-api.com   — supports PGK, no key needed
     *  2. exchangerate.host — fallback, supports PGK, no key needed
     *
     * If both fail, returns approximate manual fallback rates for PGK.
     * Caches each pair for 1 hour.
     */
    public function show(Request $request)
    {
        $from = strtoupper($request->query('from', 'AUD'));
        $to   = strtoupper($request->query('to',   'PGK'));

        if ($from === $to) {
            return response()->json([
                'rate'   => 1.0,
                'from'   => $from,
                'to'     => $to,
                'source' => 'identity',
            ]);
        }

        $cacheKey = "exchange_rate_{$from}_{$to}";

        $result = Cache::remember($cacheKey, now()->addHour(), function () use ($from, $to) {
            return $this->fetchFromErApi($from, $to)
                ?? $this->fetchFromExchangeRateHost($from, $to)
                ?? $this->getManualFallback($from, $to);
        });

        if ($result === null) {
            return response()->json([
                'message' => "Could not fetch exchange rate for {$from}/{$to}. Please enter rate manually.",
            ], 502);
        }

        return response()->json([
            'rate'       => $result['rate'],
            'from'       => $from,
            'to'         => $to,
            'source'     => $result['source'],
            'fetched_at' => now()->toISOString(),
        ]);
    }

    // ── Provider 1: open.er-api.com (free, no key, supports PGK) ────────────
    private function fetchFromErApi(string $from, string $to): ?array
    {
        try {
            $response = Http::timeout(5)
                ->get("https://open.er-api.com/v6/latest/{$from}");

            if ($response->successful()) {
                $rates = $response->json('rates');
                if (isset($rates[$to])) {
                    return [
                        'rate'   => (float) $rates[$to],
                        'source' => 'open.er-api.com',
                    ];
                }
            }

            return null;

        } catch (\Throwable) {
            return null;
        }
    }

    // ── Provider 2: exchangerate.host (free, no key, supports PGK) ──────────
    private function fetchFromExchangeRateHost(string $from, string $to): ?array
    {
        try {
            $response = Http::timeout(5)
                ->get("https://api.exchangerate.host/latest", [
                    'base'    => $from,
                    'symbols' => $to,
                ]);

            if ($response->successful()) {
                $rates = $response->json('rates');
                if (isset($rates[$to])) {
                    return [
                        'rate'   => (float) $rates[$to],
                        'source' => 'exchangerate.host',
                    ];
                }
            }

            return null;

        } catch (\Throwable) {
            return null;
        }
    }

    // ── Fallback: approximate manual rates for PGK ───────────────────────────
    // Update these periodically if live APIs are unavailable.
    // Approximate mid-market rates as of May 2026.
    private function getManualFallback(string $from, string $to): ?array
    {
        // 1 FOREIGN CURRENCY = X PGK
        $toPGK = [
            'AUD' => 2.60,
            'USD' => 3.97,
            'EUR' => 4.28,
            'GBP' => 5.01,
            'NZD' => 2.37,
            'JPY' => 0.026,
            'CNY' => 0.55,
            'SGD' => 2.95,
        ];

        if ($to === 'PGK' && isset($toPGK[$from])) {
            return [
                'rate'   => $toPGK[$from],
                'source' => 'manual-fallback',
            ];
        }

        if ($from === 'PGK' && isset($toPGK[$to])) {
            return [
                'rate'   => round(1 / $toPGK[$to], 6),
                'source' => 'manual-fallback',
            ];
        }

        return null;
    }
}