<?php
require 'config.php';

$mac = portal_request_device_id();
$guestId = (int)($_GET['guest_id'] ?? 0);
$guest = portal_require_guest($guestId);
$plans = $pdo->query('SELECT * FROM access_plans WHERE is_active=1 ORDER BY sort_order,id')->fetchAll(PDO::FETCH_ASSOC);
$error = $_GET['error'] ?? '';
?>
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Paid WiFi Subscription</title>
    <link rel="stylesheet" href="assets/style.css?v=20260521">
</head>
<body>
<?php portal_topbar('Paid WiFi Subscription', 'Choose an access package'); ?>
<div class="container">
    <div class="phone">
        <h2>Choose Package</h2>
        <?php if ($error === 'no_plan'): ?>
            <div class="status-box status-warn">No active package is available. Please ask the administrator to add a plan.</div>
        <?php endif; ?>
        <?php if (count($plans) === 0): ?>
            <div class="status-box status-warn">No active packages are available. Add one in Admin > Plans.</div>
            <a class="btn btn-light btn-block" href="index.php?mac=<?=h(urlencode($mac))?>&guest_id=<?=$guestId?>">Back To Access Options</a>
        <?php else: ?>
        <form method="post" action="payment.php">
            <input type="hidden" name="mac" value="<?=h($mac)?>">
            <input type="hidden" name="guest_id" value="<?=$guestId?>">
            <?php foreach ($plans as $i => $plan): ?>
                <label>
                    <input type="radio" name="plan_id" value="<?=$plan['id']?>" <?=$i === 0 ? 'checked' : ''?>>
                    <?=h($plan['name'])?> - PGK <?=number_format((float)$plan['amount'], 2)?>
                </label>
                <br><br>
            <?php endforeach; ?>
            <button class="btn btn-gold btn-block" type="submit">Continue To Payment</button>
        </form>
        <a class="btn btn-light btn-block" href="index.php?mac=<?=h(urlencode($mac))?>&guest_id=<?=$guestId?>">Back To Access Options</a>
        <p class="small">PayPal sandbox/live can be configured in config.local.php. Manual demo approval remains available for office testing.</p>
        <?php endif; ?>
    </div>
</div>
<?php portal_footer('Paid sessions and revenue are visible in the admin dashboard.'); ?>
</body>
</html>

