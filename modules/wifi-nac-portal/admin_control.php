<?php
require_once __DIR__ . '/config.php';

require_admin();

$message = '';
$error = '';
$hotspotFile = __DIR__ . '/hotspot/login.html';

function control_default_hotspot_html()
{
    $entryUrl = local_portal_base_url() . '/mikrotik_entry.php';
    return '<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>NAC WiFi</title>
</head>
<body>
    <form name="redirect" action="' . h($entryUrl) . '" method="post">
        <input type="hidden" name="mac" value="$(mac)">
        <input type="hidden" name="ip" value="$(ip)">
        <input type="hidden" name="username" value="$(username)">
        <input type="hidden" name="link-login" value="$(link-login)">
        <input type="hidden" name="link-login-only" value="$(link-login-only)">
        <input type="hidden" name="link-orig" value="$(link-orig)">
        <input type="hidden" name="error" value="$(error)">
        <input type="hidden" name="chap-id" value="$(chap-id)">
        <input type="hidden" name="chap-challenge" value="$(chap-challenge)">
        <input type="hidden" name="server-name" value="$(server-name)">
    </form>
    <script>
        document.redirect.submit();
    </script>
    <noscript>
        <button form="redirect" type="submit">Open WiFi Portal</button>
    </noscript>
</body>
</html>
';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = (string)($_POST['action'] ?? '');

    try {
        if ($action === 'save_hotspot') {
            $html = (string)($_POST['hotspot_html'] ?? '');
            if (trim($html) === '' || stripos($html, 'mikrotik_entry.php') === false) {
                throw new RuntimeException('HotSpot bridge file must post to mikrotik_entry.php.');
            }

            file_put_contents($hotspotFile, $html);
            $message = 'HotSpot bridge file saved.';
        } elseif ($action === 'regenerate_hotspot') {
            file_put_contents($hotspotFile, control_default_hotspot_html());
            $message = 'HotSpot bridge file regenerated from current portal URL.';
        } elseif ($action === 'set_enforcement') {
            setting_set('controller_enforcement_status', (string)($_POST['controller_enforcement_status'] ?? 'not_integrated'));
            $message = 'Controller enforcement status updated.';
        }
    } catch (Exception $e) {
        $error = $e->getMessage();
    }
}

$hotspotHtml = is_file($hotspotFile) ? (string)file_get_contents($hotspotFile) : control_default_hotspot_html();
$portalBaseUrl = local_portal_base_url();
$entryUrl = $portalBaseUrl . '/mikrotik_entry.php';
$adminUrl = $portalBaseUrl . '/admin.php';
$setupUrl = $portalBaseUrl . '/setup-check.php';
?>
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>System Control</title>
    <link rel="stylesheet" href="assets/style.css?v=20260521">
</head>
<body>
<?php admin_layout_start('control', 'System Control', 'Controlled production tools for captive portal deployment'); ?>

    <?php if ($message !== ''): ?><div class="status-box status-ok"><?= h($message) ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="status-box status-warn"><?= h($error) ?></div><?php endif; ?>

    <div class="grid-2">
        <div class="card">
            <h2>Deployment Links</h2>
            <p><b>Portal base:</b><br><code><?= h($portalBaseUrl) ?></code></p>
            <p><b>MikroTik entry URL:</b><br><code><?= h($entryUrl) ?></code></p>
            <p><b>Admin:</b><br><code><?= h($adminUrl) ?></code></p>
            <p><b>Setup check:</b><br><code><?= h($setupUrl) ?></code></p>
            <div class="actions">
                <a class="btn btn-blue" href="phone.php">Open Portal</a>
                <a class="btn btn-light" href="setup-check.php">Run Setup Check</a>
                <a class="btn btn-light" href="admin_settings.php">Settings</a>
            </div>
        </div>

        <div class="card">
            <h2>Controller Status</h2>
            <form method="post" action="admin_control.php">
                <input type="hidden" name="action" value="set_enforcement">
                <label>Enforcement status</label>
                <select class="form-control" name="controller_enforcement_status">
                    <?php $status = controller_enforcement_status(); ?>
                    <option value="not_integrated" <?= $status === 'not_integrated' ? 'selected' : '' ?>>Not integrated</option>
                    <option value="integrated" <?= $status === 'integrated' ? 'selected' : '' ?>>Integrated</option>
                </select>
                <button class="btn btn-blue" type="submit">Save Status</button>
            </form>
            <p class="small">Mark integrated only after a real MikroTik or UniFi client completes access and appears authorized on the controller.</p>
        </div>
    </div>

    <div class="card">
        <h2>MikroTik HotSpot Bridge File</h2>
        <p class="small">Upload this file as RouterOS HotSpot <code>hotspot/login.html</code>. It passes RouterOS variables into this PHP portal, then the portal completes the guest/ad/payment flow.</p>
        <form method="post" action="admin_control.php">
            <input type="hidden" name="action" value="save_hotspot">
            <textarea class="form-control code-editor" name="hotspot_html"><?= h($hotspotHtml) ?></textarea>
            <button class="btn btn-blue" type="submit">Save Bridge File</button>
        </form>
        <form method="post" action="admin_control.php">
            <input type="hidden" name="action" value="regenerate_hotspot">
            <button class="btn btn-light" type="submit">Regenerate From Current Portal URL</button>
        </form>
    </div>

<?php admin_layout_end(); ?>
</body>
</html>
