<?php
require 'config.php';
require 'payment_providers.php';

$mac = $_POST['mac'] ?? portal_request_device_id();
$guestId = (int)($_POST['guest_id'] ?? 0);
$guest = portal_require_guest($guestId);
$planId = (int)($_POST['plan_id'] ?? 0);
$action = $_POST['action'] ?? '';

$stmt = $pdo->prepare('SELECT * FROM access_plans WHERE id=? AND is_active=1 LIMIT 1');
$stmt->execute([$planId]);
$plan = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$plan) {
    die('Selected plan is not available.');
}

if ($action === 'manual_demo') {
    $reference = 'MANUAL-' . time();
    $grant = portal_create_access_grant(
        $guestId,
        $mac,
        'premium',
        (int)$plan['minutes'],
        'manual_demo',
        $reference,
        (float)$plan['amount'],
        $plan['name']
    );

    $pdo->prepare("INSERT INTO payments(session_id,provider,package_name,amount,status,reference_no) VALUES(?,?,?,?, 'paid', ?)")
        ->execute([$grant['session_id'], 'manual_demo', $plan['name'], $plan['amount'], $reference]);

    header('Location: grant_access.php?grant_id=' . $grant['grant_id'] . '&token=' . urlencode($grant['token']));
    exit;
}

$paypalReady = paypal_configured();
?>
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Complete Payment</title>
    <link rel="stylesheet" href="assets/style.css?v=20260521">
    <?php if ($paypalReady): ?>
        <script src="https://www.paypal.com/sdk/js?client-id=<?=h($PAYPAL_CLIENT_ID)?>&currency=<?=h($PAYPAL_CURRENCY)?>"></script>
    <?php endif; ?>
</head>
<body>
<?php portal_topbar('Complete Payment', 'Pay now or use manual demo approval'); ?>
<div class="container">
    <div class="phone">
        <h2><?=h($plan['name'])?></h2>
        <p><b>Duration:</b> <?=h($plan['minutes'])?> minutes</p>
        <p><b>Amount:</b> <?=h($PAYPAL_CURRENCY)?> <?=number_format((float)$plan['amount'], 2)?></p>

        <?php if ($paypalReady): ?>
            <div id="paypal-button-container"></div>
            <div id="payment-error" class="status-box status-warn" style="display:none"></div>
        <?php else: ?>
            <div class="status-box status-warn">
                PayPal sandbox is not configured yet. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in config.local.php.
            </div>
        <?php endif; ?>

        <form method="post" action="payment.php">
            <input type="hidden" name="mac" value="<?=h($mac)?>">
            <input type="hidden" name="guest_id" value="<?=$guestId?>">
            <input type="hidden" name="plan_id" value="<?=$planId?>">
            <input type="hidden" name="action" value="manual_demo">
            <button class="btn btn-gold btn-block" type="submit">Manual Demo Approval</button>
        </form>

        <p class="small">
            PayPal uses server-side Orders API create/capture endpoints. Stripe later should use Checkout Sessions and grant access only after a verified webhook.
        </p>
    </div>
</div>
<?php portal_footer('Paid access grants are recorded after payment completion.'); ?>

<?php if ($paypalReady): ?>
<script>
paypal.Buttons({
    createOrder: function () {
        const form = new URLSearchParams();
        form.append('mac', <?=json_encode($mac)?>);
        form.append('guest_id', <?=json_encode((string)$guestId)?>);
        form.append('plan_id', <?=json_encode((string)$planId)?>);

        return fetch('paypal_create_order.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: form
        }).then(function (res) {
            return res.json();
        }).then(function (data) {
            if (!data.ok) {
                throw new Error(data.message || 'Unable to create PayPal order.');
            }
            return data.order_id;
        });
    },
    onApprove: function (data) {
        const form = new URLSearchParams();
        form.append('order_id', data.orderID);
        form.append('mac', <?=json_encode($mac)?>);
        form.append('guest_id', <?=json_encode((string)$guestId)?>);
        form.append('plan_id', <?=json_encode((string)$planId)?>);

        return fetch('paypal_capture_order.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: form
        }).then(function (res) {
            return res.json();
        }).then(function (payload) {
            if (!payload.ok) {
                throw new Error(payload.message || 'Unable to capture PayPal order.');
            }
            window.location.href = payload.redirect;
        });
    },
    onError: function (err) {
        const box = document.getElementById('payment-error');
        box.style.display = 'block';
        box.innerText = err.message || 'Payment failed. Try again or use manual demo approval.';
    }
}).render('#paypal-button-container');
</script>
<?php endif; ?>
</body>
</html>

