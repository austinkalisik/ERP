<?php
require_once __DIR__ . '/config.php';

/** @var PDO $pdo */
$requireAdmin = 'require_admin';

if (!function_exists($requireAdmin)) {
    throw new RuntimeException('Missing require_admin() helper. Check config.php.');
}

call_user_func($requireAdmin);

$ads = $pdo->query('SELECT * FROM ads ORDER BY id DESC')->fetchAll(PDO::FETCH_ASSOC);

$sessions = $pdo->query(
    'SELECT s.*, g.full_name, g.contact 
     FROM sessions s 
     LEFT JOIN guest_users g ON g.id = s.guest_id 
     ORDER BY s.id DESC 
     LIMIT 20'
)->fetchAll(PDO::FETCH_ASSOC);

$sessionRows = is_array($sessions) ? $sessions : [];

$stats = $pdo->query(
    "SELECT 
        (SELECT COUNT(*) FROM sessions) users,
        (SELECT COALESCE(SUM(views),0) FROM ads) views,
        (SELECT COALESCE(SUM(clicks),0) FROM ads) clicks,
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='paid') revenue"
)->fetch(PDO::FETCH_ASSOC);

/*
|--------------------------------------------------------------------------
| Local helper wrappers
|--------------------------------------------------------------------------
| These use call_user_func() so VS Code/Intelephense does not falsely mark
| project helper functions from config.php as undefined in this template.
| Runtime behavior stays the same.
*/
$e = static function ($value): string {
    if (function_exists('h')) {
        return (string) call_user_func('h', $value);
    }

    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
};

$layoutStart = static function (string $active, string $title, string $subtitle): void {
    if (function_exists('admin_layout_start')) {
        call_user_func('admin_layout_start', $active, $title, $subtitle);
    }
};

$layoutEnd = static function (): void {
    if (function_exists('admin_layout_end')) {
        call_user_func('admin_layout_end');
    }
};

$accessProvider = function_exists('access_provider')
    ? (string) call_user_func('access_provider')
    : '';

$accessProviderLabel = function_exists('access_provider_label')
    ? (string) call_user_func('access_provider_label', $accessProvider)
    : $accessProvider;

$phoneTestUrl = function_exists('portal_phone_entry_url')
    ? (string) call_user_func('portal_phone_entry_url')
    : '';

$statusClass = $accessProvider === 'mikrotik_hotspot' || $accessProvider === 'spotipo'
    ? 'status-ok'
    : 'status-warn';

$modeMessage = $accessProvider === 'mikrotik_hotspot'
    ? 'MikroTik HotSpot mode is active. The portal records the guest flow, then grant_access.php posts the saved HotSpot login context back to RouterOS.'
    : 'Confirm the selected controller credentials and captive portal redirect settings before live use.';
?>
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="assets/style.css?v=20260521">
</head>
<body>
<?php $layoutStart('dashboard', 'Dashboard', 'Sessions, advertisements, payments and revenue'); ?>

    <div class="status-box <?= $e($statusClass) ?>">
        <b>Access provider:</b> <?= $e($accessProviderLabel) ?><br>
        <b>Phone test URL:</b> <?= $e($phoneTestUrl) ?><br>
        <?= $e($modeMessage) ?>
    </div>

    <div class="metrics">
        <div class="metric"><strong id="metric-users"><?= $e($stats['users'] ?? 0) ?></strong><br>Users/Sessions</div>
        <div class="metric"><strong id="metric-views"><?= $e($stats['views'] ?? 0) ?></strong><br>Ad Impressions</div>
        <div class="metric"><strong id="metric-clicks"><?= $e($stats['clicks'] ?? 0) ?></strong><br>Ad Clicks</div>
        <div class="metric"><strong>PGK <span id="metric-revenue"><?= number_format((float) ($stats['revenue'] ?? 0), 2) ?></span></strong><br>Revenue</div>
    </div>

    <div class="cards">
        <div class="card">
            <h2>Captive Portal Setup</h2>
            <p>Set MikroTik, UniFi, portal URL, SSIDs, shared HotSpot login, logo and public splash text.</p>
            <a class="btn btn-blue" href="admin_settings.php">Open Settings</a>
            <a class="btn btn-light" href="admin_control.php">System Control</a>
        </div>
        <div class="card">
            <h2>Guest Experience</h2>
            <p>Upload advert media and keep at least one free advert active before enabling free access.</p>
            <a class="btn btn-blue" href="admin_ads.php">Manage Ads</a>
            <a class="btn btn-light" href="phone.php">Preview Portal</a>
        </div>
        <div class="card">
            <h2>Paid Access</h2>
            <p>Edit paid packages and confirm payment settings before collecting live money.</p>
            <a class="btn btn-blue" href="admin_plans.php">Manage Plans</a>
            <a class="btn btn-light" href="setup-check.php">Run Checks</a>
        </div>
    </div>

    <h2 class="section-title">Advertisements</h2>
    <table>
        <tr>
            <th>Title</th>
            <th>Views</th>
            <th>Clicks</th>
            <th>Status</th>
        </tr>
        <?php foreach ($ads as $a): ?>
            <tr>
                <td><?= $e($a['title'] ?? '') ?></td>
                <td><?= $e($a['views'] ?? 0) ?></td>
                <td><?= $e($a['clicks'] ?? 0) ?></td>
                <td><?= !empty($a['is_active']) ? 'Active' : 'Off' ?></td>
            </tr>
        <?php endforeach; ?>
    </table>

    <div class="section-header">
        <div>
            <h2>Latest Sessions</h2>
            <p class="small">Live portal sessions from devices that open and complete this portal. Real MAC addresses come from the controller redirect, MikroTik HotSpot context, or local network detection when available.</p>
        </div>
        <div class="actions no-print">
            <button class="btn btn-blue" type="button" onclick="window.print()">Print</button>
            <a class="btn btn-light" href="admin_sessions.php?export=csv">Export CSV</a>
            <a class="btn btn-light" href="admin_sessions.php">Manage Sessions</a>
        </div>
    </div>
    <table>
        <thead>
            <tr>
                <th>Guest</th>
                <th>Device/MAC</th>
                <th>IP</th>
                <th>Type</th>
                <th>Package</th>
                <th>Status</th>
                <th>Started</th>
                <th>Expires</th>
                <th>Remaining</th>
            </tr>
        </thead>
        <tbody id="latest-sessions">
            <?php foreach ($sessionRows as $s): ?>
                <?php
                    $expiresAt = !empty($s['expires_at']) ? strtotime((string)$s['expires_at']) : 0;
                    $remainingSeconds = max(0, $expiresAt - time());
                    $remainingLabel = $remainingSeconds > 0
                        ? sprintf('%02d:%02d:%02d', (int)floor($remainingSeconds / 3600), (int)floor(($remainingSeconds % 3600) / 60), $remainingSeconds % 60)
                        : 'expired';
                ?>
                <tr>
                    <td><?= $e(($s['full_name'] ?? '') ?: ($s['contact'] ?? '')) ?></td>
                    <td><?= $e(function_exists('portal_display_device_label') ? portal_display_device_label($s['mac_address'] ?? '') : ($s['mac_address'] ?? '')) ?></td>
                    <td><?= $e($s['ip_address'] ?? '') ?></td>
                    <td><?= $e($s['access_type'] ?? '') ?></td>
                    <td><?= $e($s['package_name'] ?? '') ?></td>
                    <td><?= $e(($s['status'] ?? '') === 'granted' && !empty($s['expires_at']) && strtotime((string)$s['expires_at']) > time() ? 'active' : (($s['status'] ?? '') === 'granted' ? 'expired' : ($s['status'] ?? ''))) ?></td>
                    <td><?= $e($s['started_at'] ?? '') ?></td>
                    <td><?= $e($s['expires_at'] ?? '') ?></td>
                    <td><?= $e($remainingLabel) ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <p class="small">Last live update: <span id="live-updated">loading...</span></p>

<?php $layoutEnd(); ?>
<script>
    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, function (char) {
            return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[char];
        });
    }

    function renderSessions(data) {
        document.getElementById('metric-users').innerText = data.stats.users;
        document.getElementById('metric-views').innerText = data.stats.views;
        document.getElementById('metric-clicks').innerText = data.stats.clicks;
        document.getElementById('metric-revenue').innerText = data.stats.revenue;
        document.getElementById('live-updated').innerText = data.generated_at;

        const body = document.getElementById('latest-sessions');
        body.innerHTML = '';

        if (!data.sessions.length) {
            body.innerHTML = '<tr><td colspan="9">No completed sessions yet.</td></tr>';
            return;
        }

        data.sessions.forEach(function (row) {
            body.innerHTML += '<tr>'
                + '<td>' + escapeHtml(row.guest) + '</td>'
                + '<td>' + escapeHtml(row.device) + '</td>'
                + '<td>' + escapeHtml(row.ip) + '</td>'
                + '<td>' + escapeHtml(row.type) + '</td>'
                + '<td>' + escapeHtml(row.package) + '</td>'
                + '<td>' + escapeHtml(row.status) + '</td>'
                + '<td>' + escapeHtml(row.started) + '</td>'
                + '<td>' + escapeHtml(row.expires) + '</td>'
                + '<td>' + escapeHtml(row.remaining) + '</td>'
                + '</tr>';
        });
    }

    function loadLiveSessions() {
        fetch('admin_live_sessions.php', {cache: 'no-store'})
            .then(function (response) { return response.json(); })
            .then(renderSessions)
            .catch(function () {
                document.getElementById('live-updated').innerText = 'unable to refresh';
            });
    }

    loadLiveSessions();
    setInterval(loadLiveSessions, 3000);
</script>
</body>
</html>

