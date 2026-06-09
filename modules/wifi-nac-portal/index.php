<?php
require 'config.php';
session_start();
mikrotik_hotspot_capture_context();
ruijie_wifidog_capture_context();

if (isset($_GET['new_guest'])) {
    unset($_SESSION['guest_id']);
}

$deviceId = portal_request_device_id();
$detectedMac = portal_client_mac_address($deviceId);

$ip = portal_real_ip();
$guestId = 0;
if (isset($_GET['guest_id'])) {
    $guestId = (int)$_GET['guest_id'];
} elseif (isset($_SESSION['guest_id'])) {
    $guestId = (int)$_SESSION['guest_id'];
}

$guest = false;
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullName = trim($_POST['full_name'] ?? '');
    $organization = trim($_POST['organization'] ?? '');
    $contact = trim($_POST['contact'] ?? '');

    if ($fullName === '' || $contact === '') {
        $error = 'Enter your full name and phone number or email to continue.';
    } else {
        try {
            $stmt = $pdo->prepare('INSERT INTO guest_users(full_name,organization,contact,mac_address,ip_address) VALUES(?,?,?,?,?)');
            $stmt->execute(array($fullName, $organization, $contact, $detectedMac !== '' ? $detectedMac : null, $ip));
            $guestId = (int)$pdo->lastInsertId();
            $_SESSION['guest_id'] = $guestId;
        } catch (Exception $e) {
            $error = 'Registration failed. Check database setup in setup-check.php.';
        }
    }
}

if ($guestId > 0) {
    try {
        $stmt = $pdo->prepare('SELECT * FROM guest_users WHERE id = ? LIMIT 1');
        $stmt->execute(array($guestId));
        $guest = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($guest && $detectedMac !== '' && $guest['mac_address'] !== '' && $guest['mac_address'] !== $detectedMac) {
            unset($_SESSION['guest_id']);
            $guestId = 0;
            $guest = false;
        }
    } catch (Exception $e) {
        unset($_SESSION['guest_id']);
        $guestId = 0;
        $guest = false;
        $error = 'Guest lookup failed. Check database setup in setup-check.php.';
    }
}

$query = http_build_query(array('mac' => $deviceId, 'guest_id' => $guestId));
$hotspotContext = mikrotik_hotspot_context();
$directHotspotWarning = access_provider() === 'mikrotik_hotspot' && empty($hotspotContext);
$hotspotError = trim((string)($hotspotContext['error'] ?? ''));
$companyName = setting_get('company_name', 'National Airports Corporation');
$portalSubtitle = setting_get('portal_subtitle', 'Smart WiFi Portal');
$portalTitle = setting_get('portal_title', 'Welcome to NAC WiFi');
$footerText = setting_get('footer_text', 'Connecting People. Opportunities. PNG to the World.');
$guestName = '';

if ($guest) {
    $guestName = $guest['contact'];
    if (isset($guest['full_name']) && $guest['full_name'] !== '') {
        $guestName = $guest['full_name'];
    }
}

$content = '';
if (!$guest) {
    $errorHtml = '';
    if ($error !== '') {
        $errorHtml = '<div class="status-box status-warn">' . h($error) . '</div>';
    } elseif ($hotspotError !== '') {
        $errorHtml = '<div class="status-box status-warn">HotSpot message: ' . h($hotspotError) . '</div>';
    } elseif ($directHotspotWarning) {
        $errorHtml = '<div class="status-box status-warn">Direct portal visit detected. You can test the form, but real network authorization requires the MikroTik HotSpot redirect.</div>';
    }

    $content = ''
        . '<div class="hero">'
        . '<h1>Login / Sign Up</h1>'
        . '<p>Enter your details, then choose free advertisement access or a paid subscription.</p>'
        . $errorHtml
        . '<form method="post" action="index.php" class="login-form">'
        . '<input type="hidden" name="mac" value="' . h($deviceId) . '">'
        . '<input class="form-control" name="full_name" placeholder="Full name" required>'
        . '<input class="form-control" name="organization" placeholder="Company / organization">'
        . '<input class="form-control" name="contact" placeholder="Phone number or email" required>'
        . '<button class="btn btn-blue" type="submit">Continue</button>'
        . '</form>'
        . '</div>';
} else {
    $content = ''
        . '<div class="hero">'
        . '<h1>' . h($portalTitle) . '</h1>'
        . '<p>Choose how you want to connect.</p>'
        . '<p><b>Guest:</b> ' . h($guestName) . '</p>'
        . '<div>'
        . '<a class="btn btn-blue" href="ads.php?' . h($query) . '">Free Access - Watch Ad</a>'
        . '<a class="btn btn-gold" href="premium.php?' . h($query) . '">Paid Subscription</a>'
        . '<a class="btn btn-blue" href="index.php?new_guest=1&amp;mac=' . h(urlencode($deviceId)) . '">Change Guest</a>'
        . '</div>'
        . '</div>';
}

echo '<!doctype html>';
echo '<html>';
echo '<head>';
echo '<meta charset="utf-8">';
echo '<meta name="viewport" content="width=device-width, initial-scale=1">';
echo '<title>NAC Smart WiFi Portal</title>';
echo '<link rel="stylesheet" href="assets/style.css?v=20260521">';
echo '</head>';
echo '<body>';
portal_topbar($companyName, $portalSubtitle);
echo '<div class="container">';
echo $content;
echo '<div class="cards">';
echo '<div class="card"><h2>Free Access</h2><p>Passengers watch or interact with an advertisement before internet access is granted.</p></div>';
echo '<div class="card"><h2>Premium Access</h2><p>Paid access packages for high-speed or ad-free internet.</p></div>';
echo '<div class="card"><h2>Analytics</h2><p>Track users, ad impressions, clicks, premium sales and revenue.</p></div>';
echo '</div>';
echo '</div>';
portal_footer($footerText);
echo '</body>';
echo '</html>';

