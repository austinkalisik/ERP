<?php
require_once __DIR__ . '/config.php';

require_admin();

$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = (string)($_POST['action'] ?? 'save');
    $adId = (int)($_POST['ad_id'] ?? 0);

    try {
        if ($action === 'delete' && $adId > 0) {
            $stmt = $pdo->prepare('DELETE FROM ads WHERE id = ?');
            $stmt->execute([$adId]);
            $message = 'Advertisement deleted.';
        } elseif ($action === 'toggle' && $adId > 0) {
            $stmt = $pdo->prepare('UPDATE ads SET is_active = IF(is_active = 1, 0, 1) WHERE id = ?');
            $stmt->execute([$adId]);
            $message = 'Advertisement status updated.';
        } else {
            $title = trim((string)($_POST['title'] ?? ''));
            $description = trim((string)($_POST['description'] ?? ''));
            $imageUrl = trim((string)($_POST['image_url'] ?? ''));
            $targetUrl = trim((string)($_POST['target_url'] ?? ''));
            $isActive = isset($_POST['is_active']) ? 1 : 0;
            $uploadPath = portal_upload_asset('media_file', 'ads', ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'ogg', 'mov', 'm4v'], 52428800);

            if ($uploadPath !== '') {
                $imageUrl = $uploadPath;
            }

            if ($title === '') {
                throw new RuntimeException('Advert title is required.');
            }

            if ($adId > 0) {
                $stmt = $pdo->prepare('UPDATE ads SET title = ?, description = ?, image_url = ?, target_url = ?, is_active = ? WHERE id = ?');
                $stmt->execute([$title, $description, $imageUrl, $targetUrl, $isActive, $adId]);
                $message = 'Advertisement updated.';
            } else {
                $stmt = $pdo->prepare('INSERT INTO ads(title,description,image_url,target_url,is_active) VALUES(?,?,?,?,?)');
                $stmt->execute([$title, $description, $imageUrl, $targetUrl, $isActive]);
                $message = 'Advertisement added.';
            }
        }
    } catch (Exception $e) {
        $error = $e->getMessage();
    }
}

$editId = (int)($_GET['edit'] ?? 0);
$editAd = null;
if ($editId > 0) {
    $stmt = $pdo->prepare('SELECT * FROM ads WHERE id = ? LIMIT 1');
    $stmt->execute([$editId]);
    $editAd = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

$ads = $pdo->query('SELECT * FROM ads ORDER BY id DESC')->fetchAll(PDO::FETCH_ASSOC);
$adRows = is_array($ads) ? $ads : [];
?>
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Advertisement Manager</title>
    <link rel="stylesheet" href="assets/style.css?v=20260521">
</head>
<body>
<?php admin_layout_start('ads', 'Advertisement Manager', 'Upload and manage campaigns used in the free WiFi flow'); ?>

    <?php if ($message !== ''): ?><div class="status-box status-ok"><?= h($message) ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="status-box status-warn"><?= h($error) ?></div><?php endif; ?>

    <div class="grid-2">
        <div class="card">
            <h2><?= $editAd ? 'Edit Advertisement' : 'Add Advertisement' ?></h2>
            <form method="post" action="admin_ads.php" enctype="multipart/form-data">
                <input type="hidden" name="action" value="save">
                <input type="hidden" name="ad_id" value="<?= (int)($editAd['id'] ?? 0) ?>">

                <label>Title</label>
                <input class="form-control" name="title" value="<?= h($editAd['title'] ?? '') ?>" required>

                <label>Description</label>
                <textarea class="form-control" name="description"><?= h($editAd['description'] ?? '') ?></textarea>

                <label>Upload image or video</label>
                <input class="form-control" name="media_file" type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.ogg,.mov,.m4v">

                <label>Media URL or saved path</label>
                <input class="form-control" name="image_url" value="<?= h($editAd['image_url'] ?? '') ?>" placeholder="uploads/ads/file.png or https://example.com/ad.mp4">

                <label>Advertiser URL</label>
                <input class="form-control" name="target_url" value="<?= h($editAd['target_url'] ?? '') ?>" placeholder="https://example.com">

                <label class="inline-check"><input type="checkbox" name="is_active" <?= !isset($editAd['is_active']) || !empty($editAd['is_active']) ? 'checked' : '' ?>> Active</label>

                <button class="btn btn-blue" type="submit"><?= $editAd ? 'Save Advertisement' : 'Add Advertisement' ?></button>
                <?php if ($editAd): ?><a class="btn btn-light" href="admin_ads.php">Cancel</a><?php endif; ?>
            </form>
        </div>

        <div class="card">
            <h2>Campaign Rules</h2>
            <p>Guests see one active advert before free access is granted. Use uploaded files for reliable captive portal playback because many HotSpot clients block external media before authorization.</p>
            <p>Supported media: PNG, JPG, WEBP, GIF, MP4, WEBM and OGG. Keep videos short for airport WiFi users.</p>
        </div>
    </div>

    <h2 class="section-title">Advertisements</h2>
    <table>
        <tr>
            <th>Title</th>
            <th>Views</th>
            <th>Clicks</th>
            <th>Media</th>
            <th>Target</th>
            <th>Status</th>
            <th>Actions</th>
        </tr>

        <?php foreach ($adRows as $ad): ?>
            <?php
                $media = trim((string)($ad['image_url'] ?? ''));
                $mediaPath = (string)parse_url($media, PHP_URL_PATH);
                $mediaExt = strtolower(pathinfo($mediaPath, PATHINFO_EXTENSION));
                $isVideo = in_array($mediaExt, ['mp4', 'webm', 'ogg', 'mov', 'm4v'], true);
            ?>
            <tr>
                <td><?= h($ad['title'] ?? '') ?></td>
                <td><?= h($ad['views'] ?? 0) ?></td>
                <td><?= h($ad['clicks'] ?? 0) ?></td>
                <td>
                    <?php if ($media === ''): ?>
                        <span class="small">No media set</span>
                    <?php elseif ($isVideo): ?>
                        <video class="ad-thumb" muted playsinline controls><source src="<?= h($media) ?>"></video>
                        <div class="small"><?= h($media) ?></div>
                    <?php else: ?>
                        <img class="ad-thumb" src="<?= h($media) ?>" alt="">
                        <div class="small"><?= h($media) ?></div>
                    <?php endif; ?>
                </td>
                <td><?= h($ad['target_url'] ?? '') ?></td>
                <td><?= !empty($ad['is_active']) ? 'Active' : 'Off' ?></td>
                <td class="table-actions">
                    <a class="btn btn-light" href="admin_ads.php?edit=<?= (int)$ad['id'] ?>">Edit</a>
                    <form method="post" action="admin_ads.php">
                        <input type="hidden" name="action" value="toggle">
                        <input type="hidden" name="ad_id" value="<?= (int)$ad['id'] ?>">
                        <button class="btn btn-light" type="submit"><?= !empty($ad['is_active']) ? 'Turn Off' : 'Turn On' ?></button>
                    </form>
                    <form method="post" action="admin_ads.php" onsubmit="return confirm('Delete this advertisement?')">
                        <input type="hidden" name="action" value="delete">
                        <input type="hidden" name="ad_id" value="<?= (int)$ad['id'] ?>">
                        <button class="btn btn-danger" type="submit">Delete</button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
    </table>

<?php admin_layout_end(); ?>
</body>
</html>
