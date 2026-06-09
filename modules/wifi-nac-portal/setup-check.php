<?php
require 'config.php';
require 'payment_providers.php';
require_admin();

$checks = array();

try {
    $pdo->query('SELECT 1');
    $checks[] = array('Database', 'OK', 'Connected successfully.');
} catch (Exception $e) {
    $checks[] = array('Database', 'ERROR', $e->getMessage());
}

$spotipoStatus = 'WARN';
$spotipoMessage = 'Not configured yet. This is fine when using MikroTik HotSpot mode.';
if (spotipo_configured()) {
    $spotipoStatus = 'OK';
    $spotipoMessage = 'Configured.';
}

$checks[] = array('Application folder', 'INFO', __DIR__);
$checks[] = array('Environment', 'INFO', $APP_ENV);
$checks[] = array('Access provider', 'INFO', access_provider_label());
$checks[] = array('Phone entry URL', 'INFO', portal_phone_entry_url());
$checks[] = array('Admin URL', 'INFO', local_portal_base_url() . '/admin.php');
$checks[] = array('Admin password', admin_default_password_in_use() ? 'WARN' : 'OK', admin_default_password_in_use() ? 'Default password is still active. Change config.local.php before production.' : 'Default password is not active.');
$checks[] = array('Controller admin URL', 'INFO', controller_admin_url());
$checks[] = array('Controller enforcement', controller_enforcement_ready() ? 'OK' : 'WARN', controller_enforcement_ready() ? 'Router/controller enforcement is marked integrated.' : 'Portal tracking is working, but router allow/block enforcement is not integrated yet.');
$mikrotikCredentials = mikrotik_hotspot_defaults();
$checks[] = array('MikroTik HotSpot login', $mikrotikCredentials['username'] !== '' && $mikrotikCredentials['password'] !== '' ? 'OK' : 'WARN', $mikrotikCredentials['username'] !== '' && $mikrotikCredentials['password'] !== '' ? 'Shared HotSpot login is available.' : 'Set the shared HotSpot username and password in Admin Settings.');
$checks[] = array('UniFi direct controller', unifi_configured() ? 'OK' : 'WARN', unifi_configured() ? 'Controller URL and API key are saved.' : 'Not configured. Add UniFi controller URL and API key after UniFi quotation/procurement.');
$checks[] = array('Spotipo API base', 'INFO', spotipo_api_base());
$checks[] = array('Spotipo site ID', spotipo_site_id() !== '' ? 'OK' : 'WARN', spotipo_site_id() !== '' ? 'Configured.' : 'Missing.');
$checks[] = array('Spotipo API token', spotipo_api_token() !== '' ? 'OK' : 'WARN', spotipo_api_token() !== '' ? 'Configured.' : 'Missing.');
$checks[] = array('Portal SSID', 'INFO', setting_get('portal_ssid', 'NAC-WiFi-Portal'));
$checks[] = array('Free access SSID', 'INFO', setting_get('free_wifi_ssid', 'NAC-Free'));
$checks[] = array('Premium access SSID', 'INFO', setting_get('premium_wifi_ssid', 'NAC-Premium'));
$checks[] = array('PayPal', paypal_configured() ? 'OK' : 'WARN', paypal_configured() ? 'Configured for sandbox/live Orders API.' : 'Not configured. Add credentials to config.local.php.');
$checks[] = array('Spotipo', $spotipoStatus, $spotipoMessage);

$requiredFiles = array(
    'phone.php',
    'index.php',
    'ads.php',
    'grant_access.php',
    'complete_ad.php',
    'access_granted.php',
    'mikrotik_entry.php',
    'ruijie_entry.php',
    'wifidog/auth.php',
    'wifidog/ping.php',
    'wifidog/portal.php',
    'hotspot/login.html',
    'paypal_create_order.php',
    'paypal_capture_order.php',
    'premium.php',
    'payment.php',
    'admin.php',
    'admin_sessions.php',
    'admin_settings.php',
    'admin_control.php',
    'admin_ads.php',
    'admin_plans.php',
    'assets/style.css'
);

foreach ($requiredFiles as $file) {
    $checks[] = file_exists(__DIR__ . '/' . $file)
        ? array('File: ' . $file, 'OK', 'Found.')
        : array('File: ' . $file, 'ERROR', 'Missing.');
}

$requiredTables = array('ads', 'sessions', 'payments', 'guest_users', 'app_settings', 'access_plans', 'ad_views', 'access_grants', 'wifi_access_codes', 'mikrotik_hotspot_contexts');
foreach ($requiredTables as $table) {
    try {
        $pdo->query('SELECT 1 FROM `' . $table . '` LIMIT 1');
        $checks[] = array('Table: ' . $table, 'OK', 'Ready.');
    } catch (Exception $e) {
        $checks[] = array('Table: ' . $table, 'ERROR', $e->getMessage());
    }
}
?>
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>NAC WiFi Setup Check</title>
    <link rel="stylesheet" href="assets/style.css?v=20260521">
</head>
<body>
<?php admin_layout_start('setup', 'Setup Check', 'Deployment readiness and configuration status'); ?>
    <div class="hero">
        <h1>System Readiness</h1>
        <p>Use this page after copying the project to XAMPP and before switching live MikroTik, UniFi, or Spotipo authorization on.</p>
        <div class="actions">
            <a class="btn btn-blue" href="phone.php">Open Portal</a>
            <a class="btn btn-light" href="admin.php">Admin Dashboard</a>
            <a class="btn btn-light" href="admin_settings.php">Settings</a>
        </div>
    </div>

    <h2 class="section-title">Checks</h2>
    <table>
        <tr>
            <th>Check</th>
            <th>Status</th>
            <th>Details</th>
        </tr>
        <?php foreach ($checks as $check): ?>
            <tr>
                <td><?=h($check[0])?></td>
                <td><?=h($check[1])?></td>
                <td><?=h($check[2])?></td>
            </tr>
        <?php endforeach; ?>
    </table>
<?php admin_layout_end(); ?>
</body>
</html>

