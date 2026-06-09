<?php
require 'config.php';
require 'payment_providers.php';

header('Content-Type: application/json');

try {
    $planId = (int)($_POST['plan_id'] ?? 0);
    $guestId = (int)($_POST['guest_id'] ?? 0);
    $guest = portal_guest_by_id($guestId);
    if (!$guest) {
        throw new RuntimeException('Guest login is required before payment.');
    }
    $mac = (string)($_POST['mac'] ?? portal_request_device_id());

    $stmt = $pdo->prepare('SELECT * FROM access_plans WHERE id = ? AND is_active = 1 LIMIT 1');
    $stmt->execute([$planId]);
    $plan = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$plan) {
        throw new RuntimeException('Selected plan is not available.');
    }

    global $PAYPAL_CURRENCY;

    $payload = [
        'intent' => 'CAPTURE',
        'purchase_units' => [[
            'reference_id' => 'PLAN-' . $plan['id'] . '-GUEST-' . $guestId,
            'description' => 'WiFi access: ' . $plan['name'],
            'amount' => [
                'currency_code' => $PAYPAL_CURRENCY,
                'value' => number_format((float)$plan['amount'], 2, '.', '')
            ]
        ]]
    ];

    $order = paypal_request('POST', '/v2/checkout/orders', $payload);
    $orderId = $order['id'] ?? '';

    if ($orderId === '') {
        throw new RuntimeException('PayPal did not return an order ID.');
    }

    $pdo->prepare(
        "INSERT INTO payments(session_id,provider,package_name,amount,status,reference_no)
         VALUES(NULL,'paypal',?,?,'pending',?)"
    )->execute([$plan['name'], $plan['amount'], $orderId]);

    echo json_encode(['ok' => true, 'order_id' => $orderId, 'mac' => $mac]);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => $e->getMessage()]);
}

