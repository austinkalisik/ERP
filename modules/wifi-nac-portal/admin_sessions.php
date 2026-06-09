<?php
require_once __DIR__ . '/config.php';

require_admin();

function session_status_label($session)
{
    $expiresAt = !empty($session['expires_at']) ? strtotime((string)$session['expires_at']) : 0;
    if (($session['status'] ?? '') === 'granted' && $expiresAt > time()) {
        return 'active';
    }

    if (($session['status'] ?? '') === 'granted') {
        return 'expired';
    }

    return (string)($session['status'] ?? '');
}

function session_remaining_label($session)
{
    $expiresAt = !empty($session['expires_at']) ? strtotime((string)$session['expires_at']) : 0;
    $remaining = max(0, $expiresAt - time());
    if ($remaining <= 0) {
        return 'expired';
    }

    return sprintf('%02d:%02d:%02d', (int)floor($remaining / 3600), (int)floor(($remaining % 3600) / 60), $remaining % 60);
}

function session_rows($limit = 200)
{
    global $pdo;

    $stmt = $pdo->prepare(
        'SELECT s.*, g.full_name, g.contact
         FROM sessions s
         LEFT JOIN guest_users g ON g.id = s.guest_id
         ORDER BY s.id DESC
         LIMIT ?'
    );
    $stmt->bindValue(1, (int)$limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

if (($_GET['export'] ?? '') === 'csv') {
    $rows = session_rows(1000);
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="nac-wifi-sessions-' . date('Ymd-His') . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Guest', 'Contact', 'Device/MAC', 'IP', 'Type', 'Package', 'Amount', 'Status', 'Started', 'Expires', 'Remaining']);
    foreach ($rows as $row) {
        fputcsv($out, [
            (string)($row['full_name'] ?? ''),
            (string)($row['contact'] ?? ''),
            portal_display_device_label($row['mac_address'] ?? ''),
            (string)($row['ip_address'] ?? ''),
            (string)($row['access_type'] ?? ''),
            (string)($row['package_name'] ?? ''),
            number_format((float)($row['amount'] ?? 0), 2, '.', ''),
            session_status_label($row),
            (string)($row['started_at'] ?? ''),
            (string)($row['expires_at'] ?? ''),
            session_remaining_label($row)
        ]);
    }
    fclose($out);
    exit;
}

$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = (string)($_POST['action'] ?? '');
    $sessionId = (int)($_POST['session_id'] ?? 0);

    try {
        if ($action === 'delete_one' && $sessionId > 0) {
            $pdo->prepare('DELETE FROM access_grants WHERE session_id = ?')->execute([$sessionId]);
            $pdo->prepare('DELETE FROM payments WHERE session_id = ?')->execute([$sessionId]);
            $pdo->prepare('DELETE FROM sessions WHERE id = ?')->execute([$sessionId]);
            $message = 'Session deleted.';
        } elseif ($action === 'delete_expired') {
            $ids = $pdo->query("SELECT id FROM sessions WHERE expires_at IS NOT NULL AND expires_at < NOW()")->fetchAll(PDO::FETCH_COLUMN);
            if ($ids) {
                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                $pdo->prepare("DELETE FROM access_grants WHERE session_id IN ($placeholders)")->execute($ids);
                $pdo->prepare("DELETE FROM payments WHERE session_id IN ($placeholders)")->execute($ids);
                $pdo->prepare("DELETE FROM sessions WHERE id IN ($placeholders)")->execute($ids);
            }
            $message = count($ids) . ' expired session(s) deleted.';
        } elseif ($action === 'delete_all') {
            $pdo->exec('DELETE FROM access_grants');
            $pdo->exec('DELETE FROM payments');
            $pdo->exec('DELETE FROM sessions');
            $message = 'All sessions deleted.';
        }
    } catch (Exception $e) {
        $error = $e->getMessage();
    }
}

$rows = session_rows(200);
?>
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Session Controller</title>
    <link rel="stylesheet" href="assets/style.css?v=20260521">
</head>
<body>
<?php admin_layout_start('sessions', 'Session Controller', 'Print, export, review and delete captive portal sessions'); ?>

    <?php if ($message !== ''): ?><div class="status-box status-ok no-print"><?= h($message) ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="status-box status-warn no-print"><?= h($error) ?></div><?php endif; ?>

    <div class="card no-print">
        <h2>Session Actions</h2>
        <div class="actions">
            <button class="btn btn-blue" type="button" onclick="window.print()">Print Sessions</button>
            <a class="btn btn-light" href="admin_sessions.php?export=csv">Export CSV</a>
            <form method="post" action="admin_sessions.php" onsubmit="return confirm('Delete all expired sessions?')">
                <input type="hidden" name="action" value="delete_expired">
                <button class="btn btn-light" type="submit">Delete Expired</button>
            </form>
            <form method="post" action="admin_sessions.php" onsubmit="return confirm('Delete ALL sessions and related grants/payments?')">
                <input type="hidden" name="action" value="delete_all">
                <button class="btn btn-danger" type="submit">Delete All</button>
            </form>
        </div>
        <p class="small">Export includes the latest 1000 sessions. This page shows the latest 200 sessions.</p>
    </div>

    <h2 class="section-title">Latest Sessions</h2>
    <table>
        <tr>
            <th>Guest</th>
            <th>Contact</th>
            <th>Device/MAC</th>
            <th>IP</th>
            <th>Type</th>
            <th>Package</th>
            <th>Status</th>
            <th>Started</th>
            <th>Expires</th>
            <th>Remaining</th>
            <th class="no-print">Action</th>
        </tr>
        <?php foreach ($rows as $row): ?>
            <tr>
                <td><?= h($row['full_name'] ?? '') ?></td>
                <td><?= h($row['contact'] ?? '') ?></td>
                <td><?= h(portal_display_device_label($row['mac_address'] ?? '')) ?></td>
                <td><?= h($row['ip_address'] ?? '') ?></td>
                <td><?= h($row['access_type'] ?? '') ?></td>
                <td><?= h($row['package_name'] ?? '') ?></td>
                <td><?= h(session_status_label($row)) ?></td>
                <td><?= h($row['started_at'] ?? '') ?></td>
                <td><?= h($row['expires_at'] ?? '') ?></td>
                <td><?= h(session_remaining_label($row)) ?></td>
                <td class="no-print">
                    <form method="post" action="admin_sessions.php" onsubmit="return confirm('Delete this session?')">
                        <input type="hidden" name="action" value="delete_one">
                        <input type="hidden" name="session_id" value="<?= (int)$row['id'] ?>">
                        <button class="btn btn-danger" type="submit">Delete</button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
    </table>

<?php admin_layout_end(); ?>
</body>
</html>
