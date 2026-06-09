<?php
require 'config.php';
if (!function_exists('require_admin') || !require_admin()) {
    header('HTTP/1.0 403 Forbidden');
    exit('Access denied');
}

$message = '';
$error = '';

// Plain fields are saved exactly as submitted.
$plainFields = [
    'company_name',
    'portal_title',
    'portal_subtitle',
    'footer_text',
    'access_provider',
    'controller_mode',
    'controller_admin_url',
    'controller_enforcement_status',
    'portal_scheme',
    'local_portal_host',
    'local_portal_path',
    'portal_ssid',
    'free_wifi_ssid',
    'premium_wifi_ssid',
    'free_access_minutes',
    'spotipo_free_minutes',
    'spotipo_premium_minutes',
    'spotipo_num_devices',
    'unifi_controller_url',
    'unifi_site_id',
    'spotipo_api_base',
    'spotipo_site_id',
    'access_instructions'
];

// Secret fields are only changed when a new non-empty value is entered.
$secretFields = [
    'free_wifi_password',
    'premium_wifi_password',
    'mikrotik_hotspot_username',
    'mikrotik_hotspot_password',
    'unifi_api_key',
    'spotipo_api_token'
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        foreach ($plainFields as $field) {
            setting_set($field, trim((string)($_POST[$field] ?? '')));
        }

        foreach ($secretFields as $field) {
            $value = trim((string)($_POST[$field] ?? ''));
            if ($value !== '') {
                setting_set($field, $value);
            }
        }

        $adminUsername = trim((string)($_POST['admin_username'] ?? ''));
        if ($adminUsername !== '') {
            setting_set('admin_username', $adminUsername);
            $_SESSION['admin_username'] = $adminUsername;
        }

        $newAdminPassword = (string)($_POST['admin_password'] ?? '');
        if ($newAdminPassword !== '') {
            if (strlen($newAdminPassword) < 10) {
                throw new RuntimeException('Admin password must be at least 10 characters.');
            }
            setting_set('admin_password_hash', password_hash($newAdminPassword, PASSWORD_DEFAULT));
        }

        $logoPath = portal_upload_asset('portal_logo', 'branding', ['jpg', 'jpeg', 'png', 'webp', 'gif'], 2097152);
        if ($logoPath !== '') {
            setting_set('portal_logo_path', $logoPath);
        }

        $message = 'Settings saved.';
    } catch (Exception $e) {
        $error = $e->getMessage();
    }
}

function settings_secret_placeholder($key)
{
    if ($key === 'mikrotik_hotspot_username' || $key === 'mikrotik_hotspot_password') {
        $defaults = mikrotik_hotspot_defaults();
        $value = $key === 'mikrotik_hotspot_username' ? $defaults['username'] : $defaults['password'];
        return $value !== '' ? 'Saved - enter a new value to replace' : 'Not set';
    }

    return setting_get($key, '') !== '' ? 'Saved - enter a new value to replace' : 'Not set';
}

$mikrotikCredentials = mikrotik_hotspot_defaults();
$spotipoStatus = spotipo_configured() ? 'Configured' : 'Not configured';
$controllerStatus = controller_enforcement_ready() ? 'Integrated' : 'Not integrated';
$layoutStart = function_exists('admin_layout_start') ? 'admin_layout_start' : null;
$layoutEnd = function_exists('admin_layout_end') ? 'admin_layout_end' : null;
?>
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>System Settings</title>
    <link rel="stylesheet" href="assets/style.css?v=20260521">
</head>
<body>
<?php if ($layoutStart) { call_user_func($layoutStart, 'settings', 'System Settings', 'Backend configuration for MikroTik, UniFi, Spotipo and production deployment'); } ?>
    <?php if ($message !== '') { ?>
        <div class="status-box status-ok"><?php echo h($message); ?></div>
    <?php } ?>
    <?php if ($error !== '') { ?>
        <div class="status-box status-warn"><?php echo h($error); ?></div>
    <?php } ?>

    <?php if (admin_default_password_in_use()) { ?>
        <div class="status-box status-warn">
            The default admin password is still active. Set ADMIN_PASSWORD_HASH or a strong ADMIN_PASSWORD in config.local.php before production use.
        </div>
    <?php } ?>

    <form method="post" action="admin_settings.php" enctype="multipart/form-data">
        <div class="grid-2">
            <div class="card">
                <h2>Portal Branding</h2>

                <?php $logoPath = trim((string)setting_get('portal_logo_path', '')); ?>
                <label>Portal logo / profile image</label>
                <?php if ($logoPath !== ''): ?>
                    <img class="profile-preview" src="<?php echo h($logoPath); ?>" alt="">
                <?php endif; ?>
                <input class="form-control" name="portal_logo" type="file" accept=".jpg,.jpeg,.png,.webp,.gif">
                <p class="small">Upload a square logo or profile image. PNG, JPG, WEBP and GIF are allowed.</p>

                <label>Company name</label>
                <input class="form-control" name="company_name" value="<?php echo h(setting_get('company_name', 'National Airports Corporation')); ?>">

                <label>Portal title</label>
                <input class="form-control" name="portal_title" value="<?php echo h(setting_get('portal_title', 'Welcome to NAC WiFi')); ?>">

                <label>Portal subtitle</label>
                <input class="form-control" name="portal_subtitle" value="<?php echo h(setting_get('portal_subtitle', 'Smart WiFi Captive Portal')); ?>">

                <label>Footer text</label>
                <input class="form-control" name="footer_text" value="<?php echo h(setting_get('footer_text', 'Connecting People. Opportunities. PNG to the World.')); ?>">

                <label>Access instructions shown after approval</label>
                <textarea class="form-control" name="access_instructions"><?php echo h(setting_get('access_instructions', 'Your access has been approved. If this page was opened through a MikroTik HotSpot redirect, the router will now authorize this device.')); ?></textarea>
            </div>

            <div class="card">
                <h2>Deployment Mode</h2>

                <label>Access provider</label>
                <select class="form-control" name="access_provider">
                    <?php foreach (access_provider_options() as $value => $label): ?>
                        <option value="<?php echo h($value); ?>" <?php echo access_provider() === $value ? 'selected' : ''; ?>><?php echo h($label); ?></option>
                    <?php endforeach; ?>
                </select>

                <label>Controller mode</label>
                <select class="form-control" name="controller_mode">
                    <?php $mode = controller_mode(); ?>
                    <option value="mikrotik_hotspot" <?php echo $mode === 'mikrotik_hotspot' ? 'selected' : ''; ?>>MikroTik RouterOS HotSpot</option>
                    <option value="ruijie_wifidog" <?php echo $mode === 'ruijie_wifidog' ? 'selected' : ''; ?>>Ruijie/Reyee external portal</option>
                    <option value="unifi_external" <?php echo $mode === 'unifi_external' ? 'selected' : ''; ?>>UniFi external captive portal</option>
                    <option value="spotipo_unifi" <?php echo $mode === 'spotipo_unifi' ? 'selected' : ''; ?>>Spotipo + UniFi</option>
                    <option value="local_demo" <?php echo $mode === 'local_demo' ? 'selected' : ''; ?>>Local demo only</option>
                </select>

                <label>Controller admin URL</label>
                <input class="form-control" name="controller_admin_url" value="<?php echo h(controller_admin_url()); ?>" placeholder="http://192.168.56.254 or https://unifi.local">

                <label>Controller enforcement status</label>
                <select class="form-control" name="controller_enforcement_status">
                    <?php $enforcement = controller_enforcement_status(); ?>
                    <option value="not_integrated" <?php echo $enforcement === 'not_integrated' ? 'selected' : ''; ?>>Not integrated</option>
                    <option value="integrated" <?php echo $enforcement === 'integrated' ? 'selected' : ''; ?>>Integrated</option>
                </select>

                <label>Public portal host/IP</label>
                <input class="form-control" name="local_portal_host" value="<?php echo h(setting_get('local_portal_host', $LOCAL_PORTAL_HOST)); ?>" placeholder="192.168.88.133:8443">

                <label>Public portal scheme</label>
                <select class="form-control" name="portal_scheme">
                    <?php $portalScheme = setting_get('portal_scheme', 'https'); ?>
                    <option value="auto" <?php echo $portalScheme === 'auto' ? 'selected' : ''; ?>>Auto detect</option>
                    <option value="https" <?php echo $portalScheme === 'https' ? 'selected' : ''; ?>>HTTPS</option>
                    <option value="http" <?php echo $portalScheme === 'http' ? 'selected' : ''; ?>>HTTP</option>
                </select>

                <label>Portal path</label>
                <input class="form-control" name="local_portal_path" value="<?php echo h(setting_get('local_portal_path', $LOCAL_PORTAL_PATH)); ?>" placeholder="/nac_wifi_xampp">
            </div>
        </div>

        <div class="grid-2">
            <div class="card">
                <h2>Admin Account</h2>
                <label>Admin username</label>
                <input class="form-control" name="admin_username" value="<?php echo h(admin_username()); ?>" autocomplete="username">

                <label>New admin password</label>
                <input class="form-control" name="admin_password" type="password" minlength="10" autocomplete="new-password" placeholder="Leave blank to keep current password">
                <p class="small">Password is stored as a hash in the database. Use at least 10 characters before production use.</p>
            </div>

            <div class="card">
                <h2>Production Checklist</h2>
                <p><b>1.</b> Set the portal host/IP to the address reachable by clients.</p>
            <p><b>2.</b> Configure Ruijie/Reyee external captive portal, MikroTik HotSpot, or UniFi redirect to this portal.</p>
                <p><b>3.</b> Upload advert media locally so unauthenticated clients can load it.</p>
                <p><b>4.</b> Change the admin password and test a client from the AP network.</p>
            </div>
        </div>

        <div class="grid-2">
            <div class="card">
                <h2>Router Captive Portal</h2>
                <p class="small">For Ruijie/Reyee, use an open guest SSID with captive portal enabled and point the external portal to this app's ruijie_entry.php endpoint. For MikroTik, upload hotspot/login.html and use mikrotik_entry.php.</p>

                <label>Portal SSID</label>
                <input class="form-control" name="portal_ssid" value="<?php echo h(setting_get('portal_ssid', 'Portal-Test')); ?>">

                <p class="small">
                    Ruijie portal URL:
                    <code><?php echo h(local_portal_base_url() . '/ruijie_entry.php'); ?></code>
                </p>
                <p class="small">
                    Ruijie WiFiDog auth URL:
                    <code><?php echo h(local_portal_base_url() . '/wifidog/auth.php'); ?></code>
                </p>

                <label>MikroTik HotSpot username</label>
                <input class="form-control" name="mikrotik_hotspot_username" placeholder="<?php echo h(settings_secret_placeholder('mikrotik_hotspot_username')); ?>">

                <label>MikroTik HotSpot password</label>
                <input class="form-control" name="mikrotik_hotspot_password" type="password" placeholder="<?php echo h(settings_secret_placeholder('mikrotik_hotspot_password')); ?>">

                <label>Free access SSID</label>
                <input class="form-control" name="free_wifi_ssid" value="<?php echo h(setting_get('free_wifi_ssid', 'NAC-Free')); ?>">

                <label>Free access WiFi password</label>
                <input class="form-control" name="free_wifi_password" type="password" placeholder="<?php echo h(settings_secret_placeholder('free_wifi_password')); ?>">

                <label>Premium access SSID</label>
                <input class="form-control" name="premium_wifi_ssid" value="<?php echo h(setting_get('premium_wifi_ssid', 'NAC-Premium')); ?>">

                <label>Premium access WiFi password</label>
                <input class="form-control" name="premium_wifi_password" type="password" placeholder="<?php echo h(settings_secret_placeholder('premium_wifi_password')); ?>">

                <label>Free access minutes</label>
                <input class="form-control" name="free_access_minutes" value="<?php echo h(setting_get('free_access_minutes', '30')); ?>">
            </div>

            <div class="card">
                <h2>UniFi / Spotipo</h2>

                <label>UniFi controller URL</label>
                <input class="form-control" name="unifi_controller_url" value="<?php echo h(unifi_controller_url()); ?>" placeholder="https://unifi-controller-or-gateway">

                <label>UniFi API key</label>
                <input class="form-control" name="unifi_api_key" type="password" placeholder="<?php echo h(settings_secret_placeholder('unifi_api_key')); ?>">

                <label>UniFi site ID</label>
                <input class="form-control" name="unifi_site_id" value="<?php echo h(unifi_site_id()); ?>">

                <label>Spotipo API base URL</label>
                <input class="form-control" name="spotipo_api_base" value="<?php echo h(spotipo_api_base()); ?>">

                <label>Spotipo API token</label>
                <input class="form-control" name="spotipo_api_token" type="password" placeholder="<?php echo h(settings_secret_placeholder('spotipo_api_token')); ?>">

                <label>Spotipo site ID</label>
                <input class="form-control" name="spotipo_site_id" value="<?php echo h(spotipo_site_id()); ?>">

                <label>Free access minutes</label>
                <input class="form-control" name="spotipo_free_minutes" value="<?php echo h(spotipo_free_minutes()); ?>">

                <label>Premium default minutes</label>
                <input class="form-control" name="spotipo_premium_minutes" value="<?php echo h(spotipo_premium_minutes()); ?>">

                <label>Devices per guest</label>
                <input class="form-control" name="spotipo_num_devices" value="<?php echo h(spotipo_num_devices()); ?>">
            </div>
        </div>

        <div class="card">
            <h2>Readiness</h2>
            <p><b>Environment:</b> <?php echo h($APP_ENV); ?></p>
            <p><b>Current provider:</b> <?php echo h(access_provider_label()); ?></p>
            <p><b>Portal base URL:</b> <?php echo h(local_portal_base_url()); ?></p>
            <p><b>Controller enforcement:</b> <?php echo h($controllerStatus); ?></p>
            <p><b>MikroTik HotSpot:</b> <?php echo h($mikrotikCredentials['username'] !== '' && $mikrotikCredentials['password'] !== '' ? 'Shared login configured' : 'Shared login not configured'); ?></p>
            <p><b>UniFi direct:</b> <?php echo h(unifi_configured() ? 'Configured' : 'Not configured'); ?></p>
            <p><b>Spotipo:</b> <?php echo h($spotipoStatus); ?></p>
            <p class="small">For real captive portal use, open the portal from the MikroTik or UniFi redirect. Direct browser visits can record the guest flow, but cannot prove router authorization.</p>
        </div>

        <button class="btn btn-blue" type="submit">Save Settings</button>
    </form>
<?php if ($layoutEnd) { call_user_func($layoutEnd); } ?>
</body>
</html>
