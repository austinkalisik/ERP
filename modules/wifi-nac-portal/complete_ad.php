<?php
require 'config.php';

$viewId = (int)($_GET['view_id'] ?? 0);
$token = (string)($_GET['token'] ?? '');
$deviceId = (string)($_GET['mac'] ?? portal_request_device_id());
$guestId = (int)($_GET['guest_id'] ?? 0);
$guest = portal_require_guest($guestId);

$stmt = $pdo->prepare('SELECT * FROM ad_views WHERE id = ? AND token = ? LIMIT 1');
$stmt->execute([$viewId, $token]);
$view = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$view) {
    die('Advertisement view was not found. Please return to the portal and try again.');
}

$startedAt = new DateTimeImmutable($view['started_at']);
$duration = max(0, time() - $startedAt->getTimestamp());

if ($duration < 8) {
    die('Please watch the full advertisement before continuing.');
}

if ($view['status'] !== 'completed') {
    $pdo->prepare(
        "UPDATE ad_views SET completed_at = NOW(), duration_seconds = ?, status = 'completed' WHERE id = ?"
    )->execute([$duration, $viewId]);
    $pdo->prepare('UPDATE ads SET views = views + 1 WHERE id = ?')->execute([(int)$view['ad_id']]);
}

$minutes = access_provider() === 'spotipo'
    ? spotipo_free_minutes()
    : (int)setting_get('free_access_minutes', $SPOTIPO_FREE_MINUTES);
header('Location: grant_access.php?' . http_build_query([
    'type' => 'free',
    'mac' => $deviceId,
    'guest_id' => $guestId,
    'minutes' => $minutes,
    'source' => 'ad_view',
    'reference' => 'ADVIEW-' . $viewId,
    'package_name' => 'Free Ad Access'
]));
exit;

