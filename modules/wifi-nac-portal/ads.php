<?php
require_once __DIR__ . '/config.php';

/** @var PDO $pdo */

$ad = $pdo->query(
    "SELECT * FROM ads
     WHERE is_active = 1
       AND image_url IS NOT NULL
       AND TRIM(image_url) <> ''
     ORDER BY RAND()
     LIMIT 1"
)->fetch(PDO::FETCH_ASSOC);

if (!$ad) {
    die('No active advertisements with media are available. Please add an image or MP4 media URL in Admin > Ads.');
}

$portalDeviceHelper = 'portal_request_device_id';

if (!function_exists($portalDeviceHelper)) {
    throw new RuntimeException('Missing portal_request_device_id() helper. Check config.php.');
}

$mac = (string) call_user_func($portalDeviceHelper);
$guestId = (int) ($_GET['guest_id'] ?? 0);
$guest = portal_require_guest($guestId);
$viewToken = bin2hex(random_bytes(16));
$startedAt = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');

$pdo->prepare(
    "INSERT INTO ad_views(ad_id,guest_id,device_ref,ip_address,started_at,status,token)
     VALUES(?,?,?,?,?,'started',?)"
)->execute([
    $ad['id'],
    $guestId ?: null,
    $mac,
    portal_real_ip(),
    $startedAt,
    $viewToken
]);

$viewId = (int)$pdo->lastInsertId();

$continueUrl = 'complete_ad.php?view_id=' . $viewId . '&token=' . urlencode($viewToken) . '&mac=' . urlencode($mac) . '&guest_id=' . $guestId;
$backUrl = 'index.php?mac=' . urlencode($mac) . '&guest_id=' . $guestId;
$advertiserUrl = 'click.php?ad_id=' . urlencode((string) $ad['id']) . '&url=' . urlencode((string) $ad['target_url']);
$mediaUrl = trim((string)($ad['image_url'] ?? ''));
$mediaPath = (string)parse_url($mediaUrl, PHP_URL_PATH);
$mediaExt = strtolower(pathinfo($mediaPath, PATHINFO_EXTENSION));
$videoExts = ['mp4', 'webm', 'ogg', 'mov', 'm4v'];
$isVideo = in_array($mediaExt, $videoExts, true);

$e = static function ($value): string {
    if (function_exists('h')) {
        return (string) call_user_func('h', $value);
    }

    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
};

$portalTopbar = static function (string $title, string $subtitle): void {
    if (function_exists('portal_topbar')) {
        call_user_func('portal_topbar', $title, $subtitle);
    }
};

$portalFooter = static function (string $message): void {
    if (function_exists('portal_footer')) {
        call_user_func('portal_footer', $message);
    }
};
?>
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Free WiFi Advertisement</title>
    <link rel="stylesheet" href="assets/style.css?v=20260521">
    <script>
        let seconds = 8;

        window.addEventListener('DOMContentLoaded', function () {
            const label = document.getElementById('sec');
            const next = document.getElementById('continue');

            const timer = setInterval(function () {
                seconds -= 1;
                label.innerText = seconds;

                if (seconds <= 0) {
                    clearInterval(timer);
                    next.style.display = 'inline-block';
                }
            }, 1000);
        });
    </script>
</head>
<body>
<?php $portalTopbar('NAC Free WiFi', 'Advertisement-supported access'); ?>

<div class="container">
    <div class="phone">
        <h2><?= $e($ad['title'] ?? '') ?></h2>

        <?php if ($mediaUrl !== '' && $isVideo): ?>
            <video class="ad-media" controls autoplay muted playsinline>
                <source src="<?= $e($mediaUrl) ?>" type="video/<?= $mediaExt === 'm4v' ? 'mp4' : $e($mediaExt) ?>">
                Your browser does not support video advertisements.
            </video>
        <?php elseif ($mediaUrl !== ''): ?>
            <img class="ad-media" src="<?= $e($mediaUrl) ?>" alt="">
        <?php else: ?>
            <div class="ad-media ad-placeholder">Advertisement</div>
        <?php endif; ?>

        <p><?= $e($ad['description'] ?? '') ?></p>

        <p>Continue available in <b id="sec">8</b> seconds.</p>

        <a class="btn btn-light" href="<?= $e($backUrl) ?>">Back</a>

        <a class="btn btn-blue" href="<?= $e($advertiserUrl) ?>">Visit Advertiser</a>

        <a id="continue" style="display:none" class="btn btn-green" href="<?= $e($continueUrl) ?>">
            Get Free Internet Access
        </a>
    </div>
</div>

<?php $portalFooter('Free access is recorded in the admin dashboard.'); ?>
</body>
</html>

