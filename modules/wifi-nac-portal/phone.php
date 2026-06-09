<?php
require 'config.php';

$deviceId = portal_request_device_id();
$loginUrl = 'index.php?new_guest=1&mac=' . urlencode($deviceId);
$hotspotContext = mikrotik_hotspot_context();
$companyName = setting_get('company_name', 'National Airports Corporation');
$subtitle = setting_get('portal_subtitle', 'Smart WiFi Portal');
$portalTitle = setting_get('portal_title', 'Welcome to NAC WiFi');
$footerText = setting_get('footer_text', 'Connecting People. Opportunities. PNG to the World.');
?>
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?=h($companyName)?> WiFi Portal</title>
    <link rel="stylesheet" href="assets/style.css?v=20260521">
</head>
<body>
<?php portal_topbar($companyName, $subtitle); ?>

<div class="container">
    <div class="hero hero-centered">
        <h1><?=h($portalTitle)?></h1>
        <p>Secure guest access for visitors using MikroTik HotSpot, UniFi external portal, or Spotipo/UniFi backend configuration.</p>
        <div class="actions">
            <a class="btn btn-blue" href="<?=h($loginUrl)?>">Login / Sign Up</a>
            <a class="btn btn-light" href="admin.php">Admin Dashboard</a>
        </div>
    </div>

    <div class="cards">
        <div class="card">
            <h2>Free Access</h2>
            <p>Guests watch an advertisement before access is recorded.</p>
        </div>
        <div class="card">
            <h2>Paid Packages</h2>
            <p>Guests can choose a paid package through the demo payment flow.</p>
        </div>
        <div class="card">
            <h2>Ready To Integrate</h2>
            <p>Deployment settings are managed from Admin Settings without changing the guest splash page.</p>
        </div>
    </div>

    <div class="status-box status-info">
        <b>Current mode:</b> <?=h(access_provider_label())?><br>
        <b>Your IP address:</b> <?=h(portal_real_ip())?><br>
        <b>Detected MAC:</b> <?=h(portal_real_device_label($deviceId))?><br>
        <?php if (access_provider() === 'mikrotik_hotspot' && empty($hotspotContext)): ?>
            <span class="small">Direct portal visit detected. Real MikroTik authorization starts when the client is redirected through RouterOS HotSpot.</span>
        <?php else: ?>
            <span class="small">MAC detection is automatic when the controller redirect provides it or when the server can read it from the local network.</span>
        <?php endif; ?>
    </div>
</div>
<?php portal_footer($footerText); ?>
</body>
</html>

