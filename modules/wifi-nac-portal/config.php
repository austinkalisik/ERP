<?php
date_default_timezone_set('Pacific/Port_Moresby');

// Core database settings. Environment variables can override these values
// before config.local.php is loaded.
$DB_HOST = getenv('NAC_DB_HOST') ?: 'localhost';
$DB_NAME = getenv('NAC_DB_NAME') ?: 'nac_wifi_db';
$DB_USER = getenv('NAC_DB_USER') ?: 'root';
$DB_PASS = getenv('NAC_DB_PASS') ?: '';

// Controller and payment defaults. Real production values belong in
// config.local.php or in Admin > Settings, never in public HTML.
$SPOTIPO_API_BASE = getenv('SPOTIPO_API_BASE') ?: 'https://api.spotipo.com';
$SPOTIPO_API_TOKEN = getenv('SPOTIPO_API_TOKEN') ?: '';
$SPOTIPO_SITE_ID = getenv('SPOTIPO_SITE_ID') ?: '';
$SPOTIPO_FREE_MINUTES = (int)(getenv('SPOTIPO_FREE_MINUTES') ?: 30);
$SPOTIPO_PREMIUM_MINUTES = (int)(getenv('SPOTIPO_PREMIUM_MINUTES') ?: 60);
$SPOTIPO_NUM_DEVICES = (int)(getenv('SPOTIPO_NUM_DEVICES') ?: 1);
$APP_ENV = getenv('APP_ENV') ?: 'local';
$ACCESS_PROVIDER = getenv('ACCESS_PROVIDER') ?: 'mikrotik_hotspot';
$MIKROTIK_GATEWAY_IP = getenv('MIKROTIK_GATEWAY_IP') ?: '192.168.56.254';
$LOCAL_PORTAL_HOST = getenv('LOCAL_PORTAL_HOST') ?: ($_SERVER['HTTP_HOST'] ?? 'localhost');
$LOCAL_PORTAL_PATH = getenv('LOCAL_PORTAL_PATH') ?: '/nac_wifi_xampp';
$LOCAL_PORTAL_SCHEME = getenv('LOCAL_PORTAL_SCHEME') ?: 'auto';
$TRUST_PROXY_HEADERS = getenv('NAC_TRUST_PROXY_HEADERS') ?: '1';
$MIKROTIK_HOTSPOT_USERNAME = getenv('MIKROTIK_HOTSPOT_USERNAME') ?: 'demo';
$MIKROTIK_HOTSPOT_PASSWORD = getenv('MIKROTIK_HOTSPOT_PASSWORD') ?: '1234';
$ADMIN_USERNAME = getenv('ADMIN_USERNAME') ?: 'admin';
$ADMIN_PASSWORD = getenv('ADMIN_PASSWORD') ?: 'password1';
$ADMIN_PASSWORD_HASH = getenv('ADMIN_PASSWORD_HASH') ?: '';
$PAYPAL_MODE = getenv('PAYPAL_MODE') ?: 'sandbox';
$PAYPAL_CLIENT_ID = getenv('PAYPAL_CLIENT_ID') ?: '';
$PAYPAL_CLIENT_SECRET = getenv('PAYPAL_CLIENT_SECRET') ?: '';
$PAYPAL_CURRENCY = getenv('PAYPAL_CURRENCY') ?: 'USD';
$STRIPE_SECRET_KEY = getenv('STRIPE_SECRET_KEY') ?: '';
$STRIPE_PUBLISHABLE_KEY = getenv('STRIPE_PUBLISHABLE_KEY') ?: '';

// Optional local deployment overrides. Copy config.local.example.php to config.local.php
// on the server and keep real credentials out of the main application files.
if (file_exists(__DIR__ . '/config.local.php')) {
    require __DIR__ . '/config.local.php';
}

try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("SET time_zone = '+10:00'");
} catch (PDOException $e) {
    die('Database connection failed: ' . $e->getMessage());
}

// Escape all dynamic text before rendering HTML.
function h($value) { return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'); }

function setting_get($key, $default = '')
{
    global $pdo;

    try {
        $stmt = $pdo->prepare('SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1');
        $stmt->execute([$key]);
        $value = $stmt->fetchColumn();
        return $value === false || $value === null || $value === '' ? $default : $value;
    } catch (Exception $e) {
        return $default;
    }
}

function setting_set($key, $value)
{
    global $pdo;

    $stmt = $pdo->prepare(
        'INSERT INTO app_settings(setting_key, setting_value) VALUES(?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
    );
    $stmt->execute([$key, $value]);
}

function portal_upload_asset($field, $folder, $allowedExtensions, $maxBytes = 5242880)
{
    if (empty($_FILES[$field]) || !is_array($_FILES[$field])) {
        return '';
    }

    $file = $_FILES[$field];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return '';
    }

    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Upload failed. Try a smaller file or check the uploads folder permission.');
    }

    if ((int)($file['size'] ?? 0) > $maxBytes) {
        throw new RuntimeException('Upload is too large.');
    }

    $originalName = (string)($file['name'] ?? '');
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    if (!in_array($extension, $allowedExtensions, true)) {
        throw new RuntimeException('File type is not allowed.');
    }

    $baseDir = __DIR__ . '/uploads/' . trim($folder, '/');
    if (!is_dir($baseDir) && !mkdir($baseDir, 0775, true)) {
        throw new RuntimeException('Unable to create upload folder.');
    }

    $name = date('YmdHis') . '-' . bin2hex(random_bytes(4)) . '.' . $extension;
    $target = $baseDir . '/' . $name;
    if (!move_uploaded_file((string)$file['tmp_name'], $target)) {
        throw new RuntimeException('Unable to save uploaded file.');
    }

    return 'uploads/' . trim($folder, '/') . '/' . $name;
}

function access_provider()
{
    global $ACCESS_PROVIDER;
    $provider = setting_get('access_provider', $ACCESS_PROVIDER);
    return array_key_exists($provider, access_provider_options()) ? $provider : 'mikrotik_hotspot';
}

function router_test_mode_enabled()
{
    return access_provider() === 'local_demo';
}

function controller_mode()
{
    $mode = setting_get('controller_mode', 'mikrotik_hotspot');
    $validModes = ['mikrotik_hotspot', 'ruijie_wifidog', 'unifi_external', 'spotipo_unifi', 'local_demo'];
    return in_array($mode, $validModes, true) ? $mode : 'mikrotik_hotspot';
}

function controller_admin_url()
{
    global $MIKROTIK_GATEWAY_IP;
    return setting_get('controller_admin_url', 'http://' . $MIKROTIK_GATEWAY_IP);
}

function controller_enforcement_status()
{
    return setting_get('controller_enforcement_status', 'not_integrated');
}

function controller_enforcement_ready()
{
    return controller_enforcement_status() === 'integrated';
}

function unifi_controller_url()
{
    return rtrim(setting_get('unifi_controller_url', ''), '/');
}

function unifi_api_key()
{
    return setting_get('unifi_api_key', '');
}

function unifi_site_id()
{
    return setting_get('unifi_site_id', 'default');
}

function unifi_configured()
{
    return unifi_controller_url() !== '' && unifi_api_key() !== '';
}

function spotipo_api_base()
{
    global $SPOTIPO_API_BASE;
    return rtrim(setting_get('spotipo_api_base', $SPOTIPO_API_BASE), '/');
}

function spotipo_api_token()
{
    global $SPOTIPO_API_TOKEN;
    return setting_get('spotipo_api_token', $SPOTIPO_API_TOKEN);
}

function spotipo_site_id()
{
    global $SPOTIPO_SITE_ID;
    return setting_get('spotipo_site_id', $SPOTIPO_SITE_ID);
}

function spotipo_free_minutes()
{
    global $SPOTIPO_FREE_MINUTES;
    return (int)setting_get('spotipo_free_minutes', (string)$SPOTIPO_FREE_MINUTES);
}

function spotipo_premium_minutes()
{
    global $SPOTIPO_PREMIUM_MINUTES;
    return (int)setting_get('spotipo_premium_minutes', (string)$SPOTIPO_PREMIUM_MINUTES);
}

function spotipo_num_devices()
{
    global $SPOTIPO_NUM_DEVICES;
    return (int)setting_get('spotipo_num_devices', (string)$SPOTIPO_NUM_DEVICES);
}

function portal_request_is_https()
{
    global $TRUST_PROXY_HEADERS;

    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }

    if ((string)($_SERVER['SERVER_PORT'] ?? '') === '443') {
        return true;
    }

    if ((string)$TRUST_PROXY_HEADERS === '1') {
        $forwardedProto = strtolower(trim(explode(',', (string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''))[0]));
        if ($forwardedProto === 'https') {
            return true;
        }

        if (strtolower((string)($_SERVER['HTTP_X_FORWARDED_SSL'] ?? '')) === 'on') {
            return true;
        }

        if (strtolower((string)($_SERVER['HTTP_X_FORWARDED_SCHEME'] ?? '')) === 'https') {
            return true;
        }
    }

    return false;
}

function local_portal_base_url()
{
    global $LOCAL_PORTAL_HOST, $LOCAL_PORTAL_PATH, $LOCAL_PORTAL_SCHEME;
    $configuredScheme = setting_get('portal_scheme', $LOCAL_PORTAL_SCHEME ?: 'auto');
    $scheme = in_array($configuredScheme, ['http', 'https'], true)
        ? $configuredScheme
        : (portal_request_is_https() ? 'https' : 'http');
    $host = setting_get('local_portal_host', $LOCAL_PORTAL_HOST ?: ($_SERVER['HTTP_HOST'] ?? 'localhost'));
    $path = trim((string)setting_get('local_portal_path', $LOCAL_PORTAL_PATH ?? '/nac_wifi_xampp'));
    $path = $path === '' ? '' : '/' . trim($path, '/');
    return $scheme . '://' . rtrim($host, '/') . $path;
}

function portal_phone_entry_url()
{
    return local_portal_base_url() . '/phone.php';
}

function mikrotik_hotspot_defaults()
{
    global $MIKROTIK_HOTSPOT_USERNAME, $MIKROTIK_HOTSPOT_PASSWORD;

    return [
        'username' => setting_get('mikrotik_hotspot_username', $MIKROTIK_HOTSPOT_USERNAME ?? 'demo'),
        'password' => setting_get('mikrotik_hotspot_password', $MIKROTIK_HOTSPOT_PASSWORD ?? '1234')
    ];
}

function access_provider_options()
{
    return [
        'mikrotik_hotspot' => 'MikroTik HotSpot handoff',
        'ruijie_wifidog' => 'Ruijie/Reyee external portal',
        'unifi_external' => 'UniFi external portal',
        'spotipo' => 'Spotipo / UniFi guest API',
        'local_demo' => 'Local demo tracking only'
    ];
}

function access_provider_label($provider = null)
{
    $provider = $provider ?: access_provider();
    $options = access_provider_options();
    return $options[$provider] ?? $provider;
}

function admin_default_password_in_use()
{
    global $ADMIN_PASSWORD, $ADMIN_PASSWORD_HASH;
    return setting_get('admin_password_hash', '') === ''
        && $ADMIN_PASSWORD_HASH === ''
        && hash_equals('password1', (string)$ADMIN_PASSWORD);
}

function admin_username()
{
    global $ADMIN_USERNAME;
    return setting_get('admin_username', $ADMIN_USERNAME);
}

function admin_password_valid($password)
{
    global $ADMIN_PASSWORD, $ADMIN_PASSWORD_HASH;

    $storedHash = setting_get('admin_password_hash', '');
    if ($storedHash !== '') {
        return password_verify((string)$password, $storedHash);
    }

    if ($ADMIN_PASSWORD_HASH !== '') {
        return password_verify((string)$password, $ADMIN_PASSWORD_HASH);
    }

    return hash_equals((string)$ADMIN_PASSWORD, (string)$password);
}

function mikrotik_hotspot_context_keys()
{
    return [
        'mac', 'ip', 'username', 'link-login', 'link-login-only', 'link-orig',
        'error', 'chap-id', 'chap-challenge', 'server-name'
    ];
}

function mikrotik_hotspot_capture_context()
{
    global $pdo;

    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    $context = [];
    foreach (mikrotik_hotspot_context_keys() as $key) {
        $value = trim((string)($_POST[$key] ?? $_GET[$key] ?? ''));
        if ($value !== '') {
            $context[$key] = $value;
        }
    }

    if ($context !== []) {
        $context['captured_at'] = date('Y-m-d H:i:s');
        $_SESSION['mikrotik_hotspot'] = $context;

        try {
            $stmt = $pdo->prepare(
                "INSERT INTO mikrotik_hotspot_contexts
                 (session_id, client_mac, client_ip, link_login, link_login_only, link_orig, error_text, chap_id, chap_challenge, raw_context)
                 VALUES(?,?,?,?,?,?,?,?,?,?)
                 ON DUPLICATE KEY UPDATE
                 client_mac = VALUES(client_mac),
                 client_ip = VALUES(client_ip),
                 link_login = VALUES(link_login),
                 link_login_only = VALUES(link_login_only),
                 link_orig = VALUES(link_orig),
                 error_text = VALUES(error_text),
                 chap_id = VALUES(chap_id),
                 chap_challenge = VALUES(chap_challenge),
                 raw_context = VALUES(raw_context)"
            );
            $stmt->execute([
                session_id(),
                $context['mac'] ?? null,
                $context['ip'] ?? null,
                $context['link-login'] ?? null,
                $context['link-login-only'] ?? null,
                $context['link-orig'] ?? null,
                $context['error'] ?? null,
                $context['chap-id'] ?? null,
                $context['chap-challenge'] ?? null,
                json_encode($context)
            ]);
        } catch (Exception $e) {
            // The SQL migration is optional for first boot; session context is enough for the handoff.
        }
    }

    return $_SESSION['mikrotik_hotspot'] ?? [];
}

function mikrotik_hotspot_context()
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    return $_SESSION['mikrotik_hotspot'] ?? [];
}

function mikrotik_hotspot_login_url($context = null)
{
    $context = is_array($context) ? $context : mikrotik_hotspot_context();
    $loginOnly = trim((string)($context['link-login-only'] ?? ''));
    if ($loginOnly !== '') {
        return $loginOnly;
    }

    return trim((string)($context['link-login'] ?? ''));
}

function mikrotik_hotspot_client_mac($context = null)
{
    $context = is_array($context) ? $context : mikrotik_hotspot_context();
    $mac = trim((string)($context['mac'] ?? ''));
    if (portal_is_mac_address($mac)) {
        return strtoupper(str_replace('-', ':', $mac));
    }

    return '';
}

function mikrotik_hotspot_success_url($grantId, $token)
{
    return local_portal_base_url() . '/access_granted.php?grant_id=' . (int)$grantId . '&token=' . rawurlencode((string)$token);
}

function mikrotik_hotspot_handoff_available()
{
    return mikrotik_hotspot_login_url() !== '';
}

function ruijie_wifidog_context_keys()
{
    return [
        'gw_id', 'gw_address', 'gw_port', 'mac', 'ip', 'url', 'ssid',
        'apmac', 'nasid', 'vlan', 'device', 'authaction'
    ];
}

function ruijie_wifidog_capture_context()
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    $context = [];
    foreach (ruijie_wifidog_context_keys() as $key) {
        $value = trim((string)($_POST[$key] ?? $_GET[$key] ?? ''));
        if ($value !== '') {
            $context[$key] = $value;
        }
    }

    if ($context !== []) {
        $context['captured_at'] = date('Y-m-d H:i:s');
        $_SESSION['ruijie_wifidog'] = array_merge($_SESSION['ruijie_wifidog'] ?? [], $context);
    }

    return $_SESSION['ruijie_wifidog'] ?? [];
}

function ruijie_wifidog_context()
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    return $_SESSION['ruijie_wifidog'] ?? [];
}

function ruijie_wifidog_auth_url($token, $context = null)
{
    $context = is_array($context) ? $context : ruijie_wifidog_context();
    $gatewayAddress = trim((string)($context['gw_address'] ?? ''));
    if ($gatewayAddress === '') {
        return '';
    }

    $gatewayPort = (int)($context['gw_port'] ?? 2060);
    if ($gatewayPort <= 0) {
        $gatewayPort = 2060;
    }

    return 'http://' . $gatewayAddress . ':' . $gatewayPort . '/wifidog/auth?token=' . rawurlencode((string)$token);
}

function ruijie_wifidog_validate_token($token)
{
    global $pdo;

    $token = trim((string)$token);
    if ($token === '') {
        return false;
    }

    $stmt = $pdo->prepare(
        "SELECT ag.*, s.id AS tracked_session_id
         FROM access_grants ag
         LEFT JOIN sessions s ON s.id = ag.session_id
         WHERE ag.token = ?
           AND ag.expires_at > NOW()
         LIMIT 1"
    );
    $stmt->execute([$token]);
    $grant = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($grant && !empty($grant['tracked_session_id'])) {
        $pdo->prepare("UPDATE sessions SET status = 'granted' WHERE id = ?")->execute([(int)$grant['tracked_session_id']]);
    }

    return $grant;
}

function ruijie_wifidog_output_auth($allowed, $message = '')
{
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Auth: ' . ($allowed ? '1' : '0') . "\n";
    if ($message !== '') {
        echo 'Messages: ' . str_replace(["\r", "\n"], ' ', $message) . "\n";
    }
}

function portal_request_device_id()
{
    $hotspotMac = mikrotik_hotspot_client_mac();
    if ($hotspotMac !== '') {
        return $hotspotMac;
    }

    $fromRequest = trim((string)($_GET['mac'] ?? $_POST['mac'] ?? ''));
    if ($fromRequest !== '') {
        return $fromRequest;
    }

    if (!empty($_COOKIE['portal_device_id'])) {
        return (string)$_COOKIE['portal_device_id'];
    }

    $deviceId = 'device_' . bin2hex(random_bytes(8));
    setcookie('portal_device_id', $deviceId, time() + 31536000, '/');
    return $deviceId;
}

function portal_real_ip()
{
    return (string)($_SERVER['REMOTE_ADDR'] ?? '');
}

function portal_is_mac_address($value)
{
    return (bool)preg_match('/^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i', trim((string)$value));
}

function portal_detect_lan_mac($ip = null)
{
    $ip = trim((string)($ip ?? portal_real_ip()));
    if ($ip === '' || !filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        return '';
    }

    if (!function_exists('shell_exec')) {
        return '';
    }

    $output = (string)@shell_exec('arp -a ' . escapeshellarg($ip));
    if ($output === '') {
        return '';
    }

    if (preg_match('/([0-9a-f]{2}[-:]){5}[0-9a-f]{2}/i', $output, $matches)) {
        return strtoupper(str_replace('-', ':', $matches[0]));
    }

    return '';
}

function portal_client_mac_address($submittedDeviceId = '')
{
    $submittedDeviceId = trim((string)$submittedDeviceId);
    if (portal_is_mac_address($submittedDeviceId)) {
        return strtoupper(str_replace('-', ':', $submittedDeviceId));
    }

    return portal_detect_lan_mac();
}

function portal_real_device_label($deviceId = '')
{
    $mac = portal_client_mac_address($deviceId);
    if ($mac !== '') {
        return $mac;
    }

    return 'MAC unavailable';
}

function portal_display_device_label($storedDevice)
{
    $storedDevice = trim((string)$storedDevice);
    if (portal_is_mac_address($storedDevice)) {
        return strtoupper(str_replace('-', ':', $storedDevice));
    }

    if ($storedDevice === '' || stripos($storedDevice, 'device_') === 0 || stripos($storedDevice, 'MAC not provided') === 0) {
        return 'MAC unavailable';
    }

    return $storedDevice;
}

function portal_guest_by_id($guestId)
{
    global $pdo;

    $guestId = (int)$guestId;
    if ($guestId <= 0) {
        return false;
    }

    $stmt = $pdo->prepare('SELECT * FROM guest_users WHERE id = ? LIMIT 1');
    $stmt->execute([$guestId]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function portal_require_guest($guestId)
{
    $guest = portal_guest_by_id($guestId);
    if ($guest) {
        return $guest;
    }

    header('Location: index.php?new_guest=1');
    exit;
}

function require_admin()
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    if (!empty($_SESSION['admin_authenticated'])) {
        return true;
    }

    $user = $_SERVER['PHP_AUTH_USER'] ?? '';
    $pass = $_SERVER['PHP_AUTH_PW'] ?? '';
    $adminUsername = admin_username();

    if (hash_equals((string)$adminUsername, (string)$user) && admin_password_valid($pass)) {
        $_SESSION['admin_authenticated'] = true;
        $_SESSION['admin_username'] = $adminUsername;
        return true;
    }

    $current = $_SERVER['REQUEST_URI'] ?? 'admin.php';
    header('Location: admin_login.php?next=' . urlencode($current));
    exit;
}

function portal_topbar($title, $subtitle = '')
{
    $logo = trim((string)setting_get('portal_logo_path', ''));
    $logoHtml = $logo !== ''
        ? '<img class="logo-img" src="' . h($logo) . '" alt="">'
        : '<div class="logo">N</div>';
    echo '<div class="topbar"><div class="topbar-inner"><div class="brand">' . $logoHtml . '<div><h2>' . h($title) . '</h2><div>' . h($subtitle) . '</div></div></div><nav class="nav"><a href="phone.php">Portal</a><a href="index.php">Guest Login</a><a href="admin.php">Admin</a></nav></div></div>';
}

function portal_footer($message)
{
    echo '<div class="footer">' . h($message) . '</div>';
}

function admin_layout_start($active, $title, $subtitle = '')
{
    $items = [
        'dashboard' => ['admin.php', 'Dashboard', 'D'],
        'sessions' => ['admin_sessions.php', 'Sessions', 'R'],
        'ads' => ['admin_ads.php', 'Ads', 'A'],
        'plans' => ['admin_plans.php', 'Plans', 'P'],
        'settings' => ['admin_settings.php', 'Settings', 'S'],
        'control' => ['admin_control.php', 'Control', 'C'],
        'setup' => ['setup-check.php', 'Setup', 'T']
    ];

    $logo = trim((string)setting_get('portal_logo_path', ''));
    $logoHtml = $logo !== ''
        ? '<img class="logo-img" src="' . h($logo) . '" alt="">'
        : '<div class="logo">N</div>';

    echo '<div class="admin-shell">';
    echo '<aside class="sidebar">';
    echo '<div class="sidebar-brand">' . $logoHtml . '<div><h2>' . h(setting_get('company_name', 'NAC WiFi')) . '</h2><p>Admin Console</p></div></div>';
    echo '<nav class="sidebar-nav">';
    foreach ($items as $key => $item) {
        $class = $key === $active ? 'active' : '';
        echo '<a class="' . h($class) . '" href="' . h($item[0]) . '"><span class="nav-icon">' . h($item[2]) . '</span><span>' . h($item[1]) . '</span></a>';
    }
    echo '</nav>';
    echo '<div class="sidebar-footer"><a href="phone.php"><span class="nav-icon">O</span><span>Open Portal</span></a><a href="index.php"><span class="nav-icon">G</span><span>Guest Login</span></a><a href="admin_logout.php"><span class="nav-icon">L</span><span>Logout</span></a></div>';
    echo '</aside>';
    echo '<main class="admin-main">';
    echo '<header class="admin-header"><div><h1>' . h($title) . '</h1><p>' . h($subtitle) . '</p></div><a class="btn btn-blue" href="phone.php">Open Portal</a></header>';
}

function admin_layout_end()
{
    echo '</main></div>';
}

function portal_wifi_profile($type)
{
    $isPremium = $type === 'premium';
    return [
        'ssid' => setting_get($isPremium ? 'premium_wifi_ssid' : 'free_wifi_ssid', $isPremium ? 'NAC-Premium' : 'NAC-Free'),
        'password' => setting_get($isPremium ? 'premium_wifi_password' : 'free_wifi_password', $isPremium ? 'ChangeMe-VIP' : 'ChangeMe-Free'),
        'instructions' => setting_get('access_instructions', 'Open WiFi settings, choose the network shown here, and enter the password before the expiry time.')
    ];
}

function portal_generate_access_credentials($guestId, $type)
{
    $prefix = $type === 'premium' ? 'vip' : 'free';
    return [
        'username' => $prefix . '_' . (int)$guestId . '_' . strtolower(bin2hex(random_bytes(3))),
        'password' => strtoupper(substr(bin2hex(random_bytes(6)), 0, 10))
    ];
}

function portal_create_access_grant($guestId, $deviceId, $type, $minutes, $source, $reference = null, $amount = 0, $packageName = null)
{
    global $pdo;

    $profile = portal_wifi_profile($type);
    $credentials = portal_generate_access_credentials($guestId, $type);
    $startedAt = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $expiresAt = (new DateTimeImmutable('now'))->modify('+' . (int)$minutes . ' minutes')->format('Y-m-d H:i:s');

    $pdo->prepare(
        "INSERT INTO sessions(guest_id,mac_address,ip_address,access_type,package_name,amount,status,started_at,expires_at)
         VALUES(?,?,?,?,?,?,'granted',?,?)"
    )->execute([$guestId ?: null, portal_real_device_label($deviceId), portal_real_ip(), $type, $packageName, $amount, $startedAt, $expiresAt]);
    $sessionId = (int)$pdo->lastInsertId();

    $token = bin2hex(random_bytes(16));
    $pdo->prepare(
        "INSERT INTO access_grants(session_id,guest_id,access_type,ssid,wifi_password,access_username,access_password,source,reference_no,expires_at,token)
         VALUES(?,?,?,?,?,?,?,?,?,?,?)"
    )->execute([
        $sessionId,
        $guestId ?: null,
        $type,
        $profile['ssid'],
        $profile['password'],
        $credentials['username'],
        $credentials['password'],
        $source,
        $reference,
        $expiresAt,
        $token
    ]);

    $grantId = (int)$pdo->lastInsertId();
    $controllerResult = controller_authorize_access($guestId, $deviceId, $type, $minutes, $sessionId);

    return [
        'session_id' => $sessionId,
        'grant_id' => $grantId,
        'token' => $token,
        'controller' => $controllerResult
    ];
}

function controller_authorize_access($guestId, $deviceId, $type, $minutes, $sessionId = null)
{
    if (access_provider() === 'mikrotik_hotspot') {
        return ['ok' => true, 'skipped' => false, 'message' => 'MikroTik authorization is completed by grant_access.php posting to RouterOS HotSpot.'];
    }

    if (access_provider() === 'ruijie_wifidog') {
        return ['ok' => true, 'skipped' => false, 'message' => 'Ruijie/Reyee authorization is completed when the gateway validates this grant token through the WiFiDog auth endpoint.'];
    }

    if (access_provider() === 'unifi_external') {
        if (!unifi_configured()) {
            return ['ok' => false, 'skipped' => true, 'message' => 'UniFi External Hotspot API is selected but controller URL/API key are not configured.'];
        }

        $deviceLabel = portal_real_device_label($deviceId);
        if (!portal_is_mac_address($deviceLabel)) {
            return ['ok' => false, 'skipped' => true, 'message' => 'UniFi authorization requires the real client MAC passed by the UniFi captive portal redirect.'];
        }

        return ['ok' => false, 'skipped' => true, 'message' => 'UniFi External Hotspot API settings are ready. Final API endpoint call must be enabled after UniFi Network version/API key is confirmed.'];
    }

    if (access_provider() !== 'spotipo') {
        return ['ok' => false, 'skipped' => true, 'message' => 'Local demo mode: router authorization skipped.'];
    }

    $deviceLabel = portal_real_device_label($deviceId);
    if (!portal_is_mac_address($deviceLabel)) {
        return ['ok' => false, 'skipped' => true, 'message' => 'Spotipo authorization requires a real client MAC address.'];
    }

    $guest = portal_guest_by_id($guestId);
    $guestName = $guest ? (($guest['full_name'] ?? '') ?: ($guest['contact'] ?? 'Guest')) : 'Guest';
    $username = spotipo_guest_username($deviceLabel);
    $notes = 'NAC WiFi ' . $type . ' access for ' . $guestName . '. Session ID: ' . (string)$sessionId;

    return spotipo_save_guest_user($username, $minutes, $notes);
}

// Check whether the Spotipo API settings have been filled in.
function spotipo_configured()
{
    $token = spotipo_api_token();
    $siteId = spotipo_site_id();

    return $token !== ''
        && $siteId !== ''
        && $token !== 'paste-your-spotipo-token-here'
        && $siteId !== 'paste-your-spotipo-site-id-here';
}

// Send one HTTP request to Spotipo using the configured API token.
function spotipo_request($method, $path, $payload = null)
{
    if (!spotipo_configured()) {
        return ['ok' => false, 'skipped' => true, 'status' => 0, 'message' => 'Spotipo API token or site ID is not configured.'];
    }

    if (!function_exists('curl_init')) {
        return ['ok' => false, 'skipped' => false, 'status' => 0, 'message' => 'PHP cURL extension is not enabled.'];
    }

    $headers = ['Accept: application/json', 'Authentication-Token: ' . spotipo_api_token()];
    $options = [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 20
    ];

    if ($payload !== null) {
        $headers[] = 'Content-Type: application/json';
        $options[CURLOPT_HTTPHEADER] = $headers;
        $options[CURLOPT_POSTFIELDS] = json_encode($payload);
    }

    $ch = curl_init(spotipo_api_base() . $path);
    curl_setopt_array($ch, $options);
    $body = curl_exec($ch);
    $error = curl_error($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($body === false) {
        return ['ok' => false, 'skipped' => false, 'status' => $status, 'message' => $error ?: 'Spotipo API request failed.'];
    }

    return [
        'ok' => $status >= 200 && $status < 300,
        'skipped' => false,
        'status' => $status,
        'message' => $status >= 200 && $status < 300 ? 'Spotipo API request succeeded.' : 'Spotipo API returned HTTP ' . $status . '.',
        'body' => $body
    ];
}

// Use the client MAC address as the stable guest username.
function spotipo_guest_username($mac)
{
    $clean = preg_replace('/[^a-zA-Z0-9]/', '', $mac);
    return $clean !== '' ? 'guest_' . strtolower($clean) : 'guest_' . time();
}

// Spotipo requires username, password, duration, and number of devices.
function spotipo_guest_payload($username, $minutes, $notes)
{
    return [
        'username' => $username,
        'password' => substr(hash('sha256', $username), 0, 12),
        'duration_type' => 1,
        'duration_val' => (int)$minutes,
        'num_devices' => spotipo_num_devices(),
        'unlimited_speed' => true,
        'unlimited_data' => true,
        'notes' => $notes
    ];
}

// Create the guest account first. If it already exists, update it for another test/session.
function spotipo_save_guest_user($username, $minutes, $notes)
{
    $payload = spotipo_guest_payload($username, $minutes, $notes);
    $site = rawurlencode(spotipo_site_id());
    $create = spotipo_request('POST', '/ext/' . $site . '/api/v1/guestuser/', $payload);

    if ($create['ok'] || $create['skipped']) {
        return $create;
    }

    $update = spotipo_request('PUT', '/ext/' . $site . '/api/v1/guestuser/u/' . rawurlencode($username), $payload);
    if ($update['ok']) {
        $update['message'] = 'Spotipo guest user updated.';
        return $update;
    }

    return $create;
}
?>
