<?php
require_once __DIR__ . '/config.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

unset($_SESSION['admin_authenticated'], $_SESSION['admin_username']);
session_regenerate_id(true);

header('Location: admin_login.php');
exit;
