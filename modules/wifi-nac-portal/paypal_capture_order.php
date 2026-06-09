<?php
require 'config.php';
require 'payment_providers.php';

header('Content-Type: application/json');

try {
    $orderId = trim((string)($_POST['order_id'] ?? ''));
    $planId = (int)($_POST['plan_id'] ?? 0);
    $guestId = (int)($_POST['guest_id'] ?? 0);
    $guest = portal_guest_by_id($guestId);
    if (!$guest) {
        throw new RuntimeException('Guest login is required before payment capture.');
    }
    $mac = (string)($_POST['mac'] ?? portal_request_device_id());

    if ($orderId === '') {
        throw new RuntimeException('Missing PayPal order ID.');
    }

    $stmt = $pdo->prepare('SELECT * FROM access_plans WHERE id = ? AND is_active = 1 LIMIT 1');
    $stmt->execute([$planId]);
    $plan = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$plan) {
        throw new RuntimeException('Selected plan is not available.');
    }

    $capture = paypal_request('POST', '/v2/checkout/orders/' . rawurlencode($orderId) . '/capture');
    if (($capture['status'] ?? '') !== 'COMPLETED') {
        throw new RuntimeException('PayPal payment was not completed.');
    }

    $minutes = (int)$plan['minutes'];
    $grant = portal_create_access_grant(
        $guestId,
        $mac,
        'premium',
        $minutes,
        'paypal',
        $orderId,
        (float)$plan['amount'],
        $plan['name']
    );

    $pdo->prepare("UPDATE payments SET session_id = ?, status = 'paid' WHERE provider = 'paypal' AND reference_no = ?")
        ->execute([$grant['session_id'], $orderId]);

    echo json_encode([
        'ok' => true,
        'redirect' => 'grant_access.php?grant_id=' . $grant['grant_id'] . '&token=' . urlencode($grant['token'])
    ]);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => $e->getMessage()]);
}

