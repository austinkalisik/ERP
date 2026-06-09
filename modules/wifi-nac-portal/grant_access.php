<?php
require 'config.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$error = '';
$grant = false;
$grantId = (int)($_GET['grant_id'] ?? $_POST['grant_id'] ?? 0);
$token = (string)($_GET['token'] ?? $_POST['token'] ?? '');

if ($grantId > 0 && $token !== '') {
    // Existing grant path: used when a page returns to grant_access.php with a saved grant.
    $stmt = $pdo->prepare('SELECT * FROM access_grants WHERE id = ? AND token = ? LIMIT 1');
    $stmt->execute([$grantId, $token]);
    $grant = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$grant) {
        $error = 'Access grant was not found. Please return to the portal and try again.';
    }
} else {
    // New grant path: creates a session/access grant after free ad or paid approval.
    $type = ($_GET['type'] ?? $_POST['type'] ?? '') === 'premium' ? 'premium' : 'free';
    $deviceId = $_GET['mac'] ?? $_POST['mac'] ?? portal_request_device_id();
    $guestId = (int)($_GET['guest_id'] ?? $_POST['guest_id'] ?? ($_SESSION['guest_id'] ?? 0));
    $sessionId = (int)($_GET['session_id'] ?? $_POST['session_id'] ?? 0);
    $source = trim((string)($_GET['source'] ?? $_POST['source'] ?? 'portal'));
    $reference = trim((string)($_GET['reference'] ?? $_POST['reference'] ?? ''));
    $amount = (float)($_GET['amount'] ?? $_POST['amount'] ?? 0);
    $packageName = trim((string)($_GET['package_name'] ?? $_POST['package_name'] ?? ($type === 'premium' ? 'Premium Access' : 'Free Access')));
    $minutes = (int)($_GET['minutes'] ?? $_POST['minutes'] ?? 0);

    if ($sessionId > 0) {
        $stmt = $pdo->prepare('SELECT * FROM sessions WHERE id = ? LIMIT 1');
        $stmt->execute([$sessionId]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($session) {
            $guestId = (int)($session['guest_id'] ?? $guestId);
            $deviceId = (string)($session['mac_address'] ?? $deviceId);
        }
    }

    if ($guestId <= 0) {
        $error = 'Guest login is required before access can be granted.';
    } else {
        if ($minutes <= 0) {
            $minutes = $type === 'premium'
                ? (access_provider() === 'spotipo' ? spotipo_premium_minutes() : $SPOTIPO_PREMIUM_MINUTES)
                : (access_provider() === 'spotipo' ? spotipo_free_minutes() : (int)setting_get('free_access_minutes', $SPOTIPO_FREE_MINUTES));
        }

        $created = portal_create_access_grant(
            $guestId,
            $deviceId,
            $type,
            $minutes,
            $source !== '' ? $source : 'portal',
            $reference !== '' ? $reference : null,
            $amount,
            $packageName
        );

        $grantId = (int)$created['grant_id'];
        $token = (string)$created['token'];

        $stmt = $pdo->prepare('SELECT * FROM access_grants WHERE id = ? AND token = ? LIMIT 1');
        $stmt->execute([$grantId, $token]);
        $grant = $stmt->fetch(PDO::FETCH_ASSOC);
    }
}

$context = mikrotik_hotspot_context();
$loginUrl = mikrotik_hotspot_login_url($context);
$credentials = mikrotik_hotspot_defaults();
$successUrl = $grant ? mikrotik_hotspot_success_url((int)$grant['id'], (string)$grant['token']) : local_portal_base_url() . '/phone.php';
$fallbackUrl = $grant ? $successUrl . '&hotspot=missing' : local_portal_base_url() . '/index.php?new_guest=1';
$originalUrl = trim((string)($context['link-orig'] ?? ''));
$destinationUrl = $successUrl;
$ruijieAuthUrl = $grant ? ruijie_wifidog_auth_url((string)$grant['token']) : '';

// MikroTik mode must have RouterOS context so PHP can post back to the router.
if ($error === '' && $grant && access_provider() === 'mikrotik_hotspot' && $loginUrl === '') {
    header('Location: ' . $fallbackUrl);
    exit;
}

// Ruijie/Reyee external portal mode uses WiFiDog. After approval, send the
// client back to the gateway auth URL so the AP/gateway opens the session.
if ($error === '' && $grant && access_provider() === 'ruijie_wifidog') {
    if ($ruijieAuthUrl !== '') {
        header('Location: ' . $ruijieAuthUrl);
        exit;
    }

    if (!empty($grant['session_id'])) {
        $pdo->prepare("UPDATE sessions SET status = 'pending_gateway' WHERE id = ?")->execute([(int)$grant['session_id']]);
    }

    $error = 'This device did not arrive through the Ruijie/Reyee captive portal gateway. Connect to the Portal-Test SSID first, then let the Reyee captive portal redirect open this page. Direct browser visits can record the ad, but cannot unlock internet on the AP.';
}

// Non-MikroTik modes authorize through their controller/API layer and can show success directly.
if ($error === '' && $grant && access_provider() !== 'mikrotik_hotspot') {
    header('Location: ' . $successUrl);
    exit;
}

if ($error !== '') {
    http_response_code(400);
}
?>
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Connecting WiFi</title>
    <link rel="stylesheet" href="assets/style.css?v=20260521">
</head>
<body>
<?php portal_topbar('Connecting WiFi', 'Finalizing HotSpot access'); ?>
<div class="container">
    <div class="phone">
        <?php if ($error !== ''): ?>
            <h2>Access Not Ready</h2>
            <div class="status-box status-warn"><?=h($error)?></div>
            <a class="btn btn-blue btn-block" href="index.php?new_guest=1">Return To Portal</a>
        <?php else: ?>
            <h2>Connecting</h2>
            <p>Your portal access is approved. Connecting this device to the MikroTik HotSpot.</p>
            <?php if ($originalUrl !== ''): ?>
                <p class="small">Original destination: <?=h($originalUrl)?></p>
            <?php endif; ?>
            <form id="hotspot-login" method="post" action="<?=h($loginUrl)?>">
                <input type="hidden" name="username" value="<?=h($credentials['username'])?>">
                <input type="hidden" name="password" value="<?=h($credentials['password'])?>">
                <input type="hidden" name="dst" value="<?=h($destinationUrl)?>">
                <input type="hidden" name="popup" value="false">
                <button class="btn btn-blue btn-block" type="submit">Connect Now</button>
            </form>
            <script>
                window.addEventListener('DOMContentLoaded', function () {
                    const form = document.getElementById('hotspot-login');
                    if (form) {
                        setTimeout(function () { form.submit(); }, 800);
                    }
                });
            </script>
        <?php endif; ?>
    </div>
</div>
<?php portal_footer('MikroTik HotSpot authentication is handled by the router.'); ?>
</body>
</html>
