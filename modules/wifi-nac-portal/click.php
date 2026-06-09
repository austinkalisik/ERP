<?php
require 'config.php';

$id = (int)($_GET['ad_id'] ?? 0);
$url = trim((string)($_GET['url'] ?? 'index.php'));

if ($id > 0) {
    $stmt = $pdo->prepare('SELECT target_url FROM ads WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $targetUrl = (string)$stmt->fetchColumn();

    if ($targetUrl !== '') {
        $url = $targetUrl;
        $pdo->prepare('UPDATE ads SET clicks = clicks + 1 WHERE id = ?')->execute([$id]);
    }
}

if (!filter_var($url, FILTER_VALIDATE_URL)) {
    $url = 'index.php';
}

header('Location: ' . $url);
exit;

