<?php
require 'config.php';
session_start();

$grantId = (int)($_GET['grant_id'] ?? 0);
$token = (string)($_GET['token'] ?? '');

$stmt = $pdo->prepare(
    'SELECT ag.*, g.full_name, g.contact
     FROM access_grants ag
     LEFT JOIN guest_users g ON g.id = ag.guest_id
     WHERE ag.id = ? AND ag.token = ?
     LIMIT 1'
);
$stmt->execute([$grantId, $token]);
$grant = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$grant) {
    die('Access grant was not found. Please return to the portal and try again.');
}

$guestName = ($grant['full_name'] ?? '') ?: ($grant['contact'] ?? 'Guest');
$provider = access_provider();
$expiresAt = new DateTimeImmutable((string)$grant['expires_at']);
$now = new DateTimeImmutable('now');
$remainingSeconds = max(0, $expiresAt->getTimestamp() - $now->getTimestamp());
$isExpired = $remainingSeconds <= 0;
$instructions = setting_get(
    'access_instructions',
    'Your portal access has been approved. Keep this page open as your access confirmation.'
);

$missingHotspot = ($_GET['hotspot'] ?? '') === 'missing';
$missingRuijieGateway = ($_GET['ruijie'] ?? '') === 'missing';
?>
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>WiFi Access Granted</title>
    <link rel="stylesheet" href="assets/style.css?v=20260521">
    <script>
        let remainingSeconds = <?= (int)$remainingSeconds ?>;

        function formatRemaining(total) {
            const hours = Math.floor(total / 3600);
            const minutes = Math.floor((total % 3600) / 60);
            const seconds = total % 60;
            return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
        }

        function updateAccessTimer() {
            const timer = document.getElementById('access-timer');
            const status = document.getElementById('access-status');
            const box = document.getElementById('access-box');
            if (!timer || !status || !box) {
                return;
            }

            if (remainingSeconds <= 0) {
                timer.innerText = '00:00:00';
                status.innerText = 'Expired';
                box.className = 'status-box status-warn';
                return;
            }

            timer.innerText = formatRemaining(remainingSeconds);
            status.innerText = 'Active';
            remainingSeconds -= 1;
            setTimeout(updateAccessTimer, 1000);
        }

        window.addEventListener('DOMContentLoaded', updateAccessTimer);
    </script>
</head>
<body>
<?php portal_topbar('Access Approved', 'Your session has been recorded'); ?>
<div class="container">
    <div class="phone">
        <h2>Success</h2>
        <p><b>Guest:</b> <?=h($guestName)?></p>
        <p><b>Access type:</b> <?=h(ucfirst($grant['access_type']))?></p>
        <p><b>Expires:</b> <?=h($grant['expires_at'])?></p>
        <p><b>Status:</b> <span id="access-status"><?= $isExpired ? 'Expired' : 'Active' ?></span></p>
        <p><b>Remaining:</b> <span id="access-timer"><?= $isExpired ? '00:00:00' : gmdate('H:i:s', $remainingSeconds) ?></span></p>

        <div id="access-box" class="status-box <?= $isExpired ? 'status-warn' : 'status-ok' ?>">
            <p><?= $isExpired ? 'This portal access session has expired.' : 'Your access request has been approved and recorded for this device/IP address.' ?></p>
            <p class="small">WiFi address, WiFi password, and generated internal credentials are hidden on this success page.</p>
        </div>

        <p><?=h($instructions)?></p>

        <?php if ($provider === 'local_demo'): ?>
            <div class="status-box status-warn">
                Local demo mode is active. This page records the access session, but router-level network authorization is not being enforced.
            </div>
        <?php endif; ?>

        <?php if ($provider === 'ruijie_wifidog'): ?>
            <div class="status-box status-info">
                Ruijie/Reyee mode is active. The gateway authorizes this device through the local WiFiDog endpoint and will expire the session at the configured duration.
            </div>
        <?php endif; ?>

        <?php if ($missingHotspot): ?>
            <div class="status-box status-warn">
                The access grant was created, but this browser session did not include MikroTik HotSpot login context. Open the portal from a HotSpot redirect and try again.
            </div>
        <?php endif; ?>

        <?php if ($missingRuijieGateway): ?>
            <div class="status-box status-warn">
                The access grant was created, but this browser session did not include Ruijie/Reyee gateway redirect parameters. Connect through the Portal-Test SSID and open the captive portal again.
            </div>
        <?php endif; ?>

        <a class="btn btn-blue btn-block" href="phone.php">Back To Portal</a>
    </div>
</div>
<?php portal_footer('Access grants are recorded in the admin dashboard.'); ?>
</body>
</html>

