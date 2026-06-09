<?php

namespace App\Http\Controllers;

use App\Models\AssetLog;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    private const REPORT_TIMEZONE = 'Pacific/Port_Moresby';

    public function index(Request $request)
    {
        $perPage = max(10, min((int) $request->integer('per_page', 20), 100));

        $query = AssetLog::query()
            ->with(['item:id,name,sku,asset_tag', 'user:id,name,email'])
            ->latest();

        if ($request->filled('action')) {
            $query->where('action', $request->string('action'));
        }

        if ($request->filled('item_id')) {
            $query->where('item_id', (int) $request->integer('item_id'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->integer('user_id'));
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $this->startOfReportDay((string) $request->date_from));
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $this->endOfReportDay((string) $request->date_to));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->where(function ($sub) use ($search) {
                $sub->where('action', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('item', function ($itemQuery) use ($search) {
                        $itemQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%")
                            ->orWhere('asset_tag', 'like', "%{$search}%");
                    })
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    protected function startOfReportDay(string $date): CarbonImmutable
    {
        return CarbonImmutable::parse($date, self::REPORT_TIMEZONE)
            ->startOfDay()
            ->utc();
    }

    protected function endOfReportDay(string $date): CarbonImmutable
    {
        return CarbonImmutable::parse($date, self::REPORT_TIMEZONE)
            ->endOfDay()
            ->utc();
    }
}
