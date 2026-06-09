<?php
require_once __DIR__ . '/config.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$next = (string)($_GET['next'] ?? $_POST['next'] ?? 'admin.php');
if ($next === '' || preg_match('/^https?:\/\//i', $next)) {
    $next = 'admin.php';
}

if (!empty($_SESSION['admin_authenticated'])) {
    header('Location: ' . $next);
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim((string)($_POST['username'] ?? ''));
    $password = (string)($_POST['password'] ?? '');

    if (hash_equals((string)admin_username(), $username) && admin_password_valid($password)) {
        $_SESSION['admin_authenticated'] = true;
        $_SESSION['admin_username'] = $username;
        header('Location: ' . $next);
        exit;
    }

    $error = 'Invalid admin username or password.';
}
?>
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>NAC WiFi Admin Login</title>
    <link rel="stylesheet" href="assets/style.css?v=20260521">
</head>
<body class="login-page">
    <main class="login-shell">
        <section class="login-panel">
            <div class="login-brand">
                <div class="logo">N</div>
                <div>
                    <h1>NAC WiFi</h1>
                    <p>Admin Console</p>
                </div>
            </div>

            <h2>Sign in</h2>
            <p class="small">Use your administrator credentials to manage sessions, adverts, plans, and controller settings.</p>

            <?php if ($error !== ''): ?>
                <div class="status-box status-warn"><?= h($error) ?></div>
            <?php endif; ?>

            <form method="post" action="admin_login.php">
                <input type="hidden" name="next" value="<?= h($next) ?>">

                <label>Username</label>
                <input class="form-control" name="username" autocomplete="username" required>

                <label>Password</label>
                <input class="form-control" name="password" type="password" autocomplete="current-password" required>

                <button class="btn btn-blue btn-block" type="submit">Sign In</button>
            </form>

            <a class="btn btn-light btn-block" href="phone.php">Back To Portal</a>
        </section>
    </main>
</body>
</html>
