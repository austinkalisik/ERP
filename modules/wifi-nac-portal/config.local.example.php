<?php
// Copy this file to config.local.php on the XAMPP server and fill in real values.
// config.local.php is loaded by config.php and should not be shared publicly.

$DB_HOST = 'localhost';
$DB_NAME = 'nac_wifi_db';
$DB_USER = 'root';
$DB_PASS = '';

$SPOTIPO_API_BASE = 'https://api.spotipo.com';
$SPOTIPO_API_TOKEN = 'paste-your-spotipo-token-here';
$SPOTIPO_SITE_ID = 'paste-your-spotipo-site-id-here';
$SPOTIPO_FREE_MINUTES = 30;
$SPOTIPO_PREMIUM_MINUTES = 60;
$SPOTIPO_NUM_DEVICES = 1;

$APP_ENV = 'production';
// Supported providers:
// mikrotik_hotspot: RouterOS HotSpot redirect and final login handoff.
// unifi_external: UniFi external portal configuration placeholder.
// spotipo: Spotipo/UniFi guest API authorization.
// local_demo: records sessions only; no router enforcement.
$ACCESS_PROVIDER = 'mikrotik_hotspot';
$LOCAL_PORTAL_HOST = '192.168.88.133:8443';
$LOCAL_PORTAL_PATH = '/nac_wifi_xampp';
// Use auto behind Caddy. Set to https when the captive portal must always
// generate HTTPS MikroTik/UniFi redirect URLs.
$LOCAL_PORTAL_SCHEME = 'auto';
$TRUST_PROXY_HEADERS = '1';
$MIKROTIK_HOTSPOT_USERNAME = 'paste-shared-hotspot-username-here';
$MIKROTIK_HOTSPOT_PASSWORD = 'paste-shared-hotspot-password-here';
$ADMIN_USERNAME = 'admin';
// Prefer ADMIN_PASSWORD_HASH. Generate it with:
// php -r "echo password_hash('your-strong-password', PASSWORD_DEFAULT), PHP_EOL;"
$ADMIN_PASSWORD_HASH = 'paste-generated-password-hash-here';

// PayPal REST app credentials from developer.paypal.com > Apps & Credentials.
// Keep the secret private. Do not paste it into screenshots, GitHub, or shared docs.
$PAYPAL_MODE = 'sandbox';
$PAYPAL_CURRENCY = 'USD';
$PAYPAL_CLIENT_ID = 'paste-your-paypal-client-id-here';
$PAYPAL_CLIENT_SECRET = 'paste-your-paypal-secret-here';

// Stripe later configuration. Use Checkout Sessions server-side and grant WiFi
// access only after a verified checkout.session.completed webhook.
$STRIPE_PUBLISHABLE_KEY = 'paste-your-stripe-publishable-key-later';
$STRIPE_SECRET_KEY = 'paste-your-stripe-secret-key-later';

