<?php
require dirname(__DIR__) . '/config.php';

$stage = strtolower(trim((string)($_GET['stage'] ?? 'login')));
$token = trim((string)($_GET['token'] ?? ''));
$grant = ruijie_wifidog_validate_token($token);

if ($stage === 'logout') {
    if ($grant && !empty($grant['session_id'])) {
        $pdo->prepare("UPDATE sessions SET status = 'expired' WHERE id = ?")->execute([(int)$grant['session_id']]);
    }

    ruijie_wifidog_output_auth(false, 'Logged out');
    exit;
}

if ($grant) {
    ruijie_wifidog_output_auth(true, 'Access approved until ' . (string)$grant['expires_at']);
    exit;
}

ruijie_wifidog_output_auth(false, 'Access token is missing, invalid, or expired');
