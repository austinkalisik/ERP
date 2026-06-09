<?php
$query = $_GET;
header('Location: ../ruijie_entry.php?' . http_build_query($query));
exit;
