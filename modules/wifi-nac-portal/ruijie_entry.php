<?php
require 'config.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

ruijie_wifidog_capture_context();

$query = $_GET;
$query['ruijie'] = '1';

header('Location: index.php?' . http_build_query($query));
exit;
