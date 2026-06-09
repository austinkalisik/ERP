<?php
require_once __DIR__ . '/config.php';

require_admin();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$sessions = $pdo->query(
    'SELECT s.*, g.full_name, g.contact
     FROM sessions s
     LEFT JOIN guest_users g ON g.id = s.guest_id
     ORDER BY s.id DESC
     LIMIT 20'
)->fetchAll(PDO::FETCH_ASSOC);

$stats = $pdo->query(
    "SELECT
        (SELECT COUNT(*) FROM sessions) users,
        (SELECT COALESCE(SUM(views),0) FROM ads) views,
        (SELECT COALESCE(SUM(clicks),0) FROM ads) clicks,
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='paid') revenue"
)->fetch(PDO::FETCH_ASSOC);

$rows = [];
$now = new DateTimeImmutable('now');
foreach ($sessions as $session) {
    $expiresAt = !empty($session['expires_at']) ? new DateTimeImmutable($session['expires_at']) : null;
    $isActive = ($session['status'] ?? '') === 'granted' && $expiresAt && $expiresAt > $now;
    $status = $isActive ? 'active' : (($session['status'] ?? '') === 'granted' ? 'expired' : ($session['status'] ?? ''));
    $remainingSeconds = $isActive && $expiresAt ? max(0, $expiresAt->getTimestamp() - $now->getTimestamp()) : 0;
    $remainingMinutes = (int)floor($remainingSeconds / 60);
    $remainingLabel = $isActive
        ? sprintf('%02d:%02d:%02d', (int)floor($remainingSeconds / 3600), (int)floor(($remainingSeconds % 3600) / 60), $remainingSeconds % 60)
        : 'expired';

    $rows[] = [
        'guest' => ($session['full_name'] ?? '') ?: ($session['contact'] ?? ''),
        'device' => portal_display_device_label($session['mac_address'] ?? ''),
        'ip' => $session['ip_address'] ?? '',
        'type' => $session['access_type'] ?? '',
        'package' => $session['package_name'] ?? '',
        'status' => $status,
        'started' => $session['started_at'] ?? '',
        'expires' => $session['expires_at'] ?? '',
        'remaining_seconds' => $remainingSeconds,
        'remaining_minutes' => $remainingMinutes,
        'remaining' => $remainingLabel,
    ];
}

echo json_encode([
    'generated_at' => date('Y-m-d H:i:s'),
    'stats' => [
        'users' => (int)($stats['users'] ?? 0),
        'views' => (int)($stats['views'] ?? 0),
        'clicks' => (int)($stats['clicks'] ?? 0),
        'revenue' => number_format((float)($stats['revenue'] ?? 0), 2),
    ],
    'sessions' => $rows,
]);

