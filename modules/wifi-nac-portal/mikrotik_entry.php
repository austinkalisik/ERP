<?php
require 'config.php';

$hotspot = mikrotik_hotspot_capture_context();
$deviceId = mikrotik_hotspot_client_mac($hotspot) ?: portal_request_device_id();
$query = http_build_query(array(
    'new_guest' => 1,
    'mac' => $deviceId,
));

header('Location: index.php?' . $query);
exit;
