<?php
require_once __DIR__ . '/config.php';

require_admin();

$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = (string)($_POST['action'] ?? 'save');
    $planId = (int)($_POST['plan_id'] ?? 0);

    try {
        if ($action === 'delete' && $planId > 0) {
            $stmt = $pdo->prepare('DELETE FROM access_plans WHERE id = ?');
            $stmt->execute([$planId]);
            $message = 'Plan deleted.';
        } elseif ($action === 'toggle' && $planId > 0) {
            $stmt = $pdo->prepare('UPDATE access_plans SET is_active = IF(is_active = 1, 0, 1) WHERE id = ?');
            $stmt->execute([$planId]);
            $message = 'Plan status updated.';
        } else {
            $name = trim((string)($_POST['name'] ?? ''));
            $minutes = (int)($_POST['minutes'] ?? 0);
            $amount = (float)($_POST['amount'] ?? 0);
            $sortOrder = (int)($_POST['sort_order'] ?? 0);
            $isActive = isset($_POST['is_active']) ? 1 : 0;

            if ($name === '' || $minutes <= 0) {
                throw new RuntimeException('Plan name and duration are required.');
            }

            if ($planId > 0) {
                $stmt = $pdo->prepare('UPDATE access_plans SET name = ?, minutes = ?, amount = ?, is_active = ?, sort_order = ? WHERE id = ?');
                $stmt->execute([$name, $minutes, $amount, $isActive, $sortOrder, $planId]);
                $message = 'Plan updated.';
            } else {
                $stmt = $pdo->prepare('INSERT INTO access_plans(name,minutes,amount,is_active,sort_order) VALUES(?,?,?,?,?)');
                $stmt->execute([$name, $minutes, $amount, $isActive, $sortOrder]);
                $message = 'Plan added.';
            }
        }
    } catch (Exception $e) {
        $error = $e->getMessage();
    }
}

$editId = (int)($_GET['edit'] ?? 0);
$editPlan = null;
if ($editId > 0) {
    $stmt = $pdo->prepare('SELECT * FROM access_plans WHERE id = ? LIMIT 1');
    $stmt->execute([$editId]);
    $editPlan = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

$plans = $pdo->query('SELECT * FROM access_plans ORDER BY sort_order,id')->fetchAll(PDO::FETCH_ASSOC);
$planRows = is_array($plans) ? $plans : [];
?>
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Subscription Plans</title>
    <link rel="stylesheet" href="assets/style.css?v=20260521">
</head>
<body>
<?php admin_layout_start('plans', 'Subscription Plans', 'Paid WiFi packages shown to guests'); ?>

    <?php if ($message !== ''): ?><div class="status-box status-ok"><?= h($message) ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="status-box status-warn"><?= h($error) ?></div><?php endif; ?>

    <div class="grid-2">
        <div class="card">
            <h2><?= $editPlan ? 'Edit Plan' : 'Add Plan' ?></h2>
            <form method="post" action="admin_plans.php">
                <input type="hidden" name="action" value="save">
                <input type="hidden" name="plan_id" value="<?= (int)($editPlan['id'] ?? 0) ?>">

                <label>Plan name</label>
                <input class="form-control" name="name" value="<?= h($editPlan['name'] ?? '') ?>" placeholder="2 Hours" required>

                <label>Duration in minutes</label>
                <input class="form-control" name="minutes" type="number" min="1" value="<?= h($editPlan['minutes'] ?? '') ?>" required>

                <label>Amount PGK</label>
                <input class="form-control" name="amount" type="number" min="0" step="0.01" value="<?= h($editPlan['amount'] ?? '') ?>" required>

                <label>Sort order</label>
                <input class="form-control" name="sort_order" type="number" value="<?= h($editPlan['sort_order'] ?? 0) ?>">

                <label class="inline-check"><input type="checkbox" name="is_active" <?= !isset($editPlan['is_active']) || !empty($editPlan['is_active']) ? 'checked' : '' ?>> Active</label>

                <button class="btn btn-blue" type="submit"><?= $editPlan ? 'Save Plan' : 'Add Plan' ?></button>
                <?php if ($editPlan): ?><a class="btn btn-light" href="admin_plans.php">Cancel</a><?php endif; ?>
            </form>
        </div>

        <div class="card">
            <h2>Payment Readiness</h2>
            <p>Plans are shown on the paid access page. Keep at least one active plan before enabling premium access in a live captive portal.</p>
            <p>For production payments, keep access granting tied to verified payment callbacks or manual admin approval.</p>
        </div>
    </div>

    <h2 class="section-title">Current Plans</h2>
    <table>
        <tr>
            <th>Name</th>
            <th>Minutes</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
        </tr>

        <?php foreach ($planRows as $plan): ?>
            <tr>
                <td><?= h($plan['name'] ?? '') ?></td>
                <td><?= h($plan['minutes'] ?? 0) ?></td>
                <td>PGK <?= number_format((float)($plan['amount'] ?? 0), 2) ?></td>
                <td><?= !empty($plan['is_active']) ? 'Active' : 'Off' ?></td>
                <td class="table-actions">
                    <a class="btn btn-light" href="admin_plans.php?edit=<?= (int)$plan['id'] ?>">Edit</a>
                    <form method="post" action="admin_plans.php">
                        <input type="hidden" name="action" value="toggle">
                        <input type="hidden" name="plan_id" value="<?= (int)$plan['id'] ?>">
                        <button class="btn btn-light" type="submit"><?= !empty($plan['is_active']) ? 'Turn Off' : 'Turn On' ?></button>
                    </form>
                    <form method="post" action="admin_plans.php" onsubmit="return confirm('Delete this plan?')">
                        <input type="hidden" name="action" value="delete">
                        <input type="hidden" name="plan_id" value="<?= (int)$plan['id'] ?>">
                        <button class="btn btn-danger" type="submit">Delete</button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
    </table>

<?php admin_layout_end(); ?>
</body>
</html>
