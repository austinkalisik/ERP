<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://192.168.88.133',
        'https://localhost',
        'http://localhost',
    ],
    'allowed_headers' => ['*'],
    'supports_credentials' => true,
];
