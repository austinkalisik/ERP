<?php

function paypal_base_url()
{
    global $PAYPAL_MODE;
    return $PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

function paypal_configured()
{
    global $PAYPAL_CLIENT_ID, $PAYPAL_CLIENT_SECRET;
    return $PAYPAL_CLIENT_ID !== '' && $PAYPAL_CLIENT_SECRET !== '';
}

function paypal_access_token()
{
    global $PAYPAL_CLIENT_ID, $PAYPAL_CLIENT_SECRET;

    if (!paypal_configured()) {
        throw new RuntimeException('PayPal client ID or secret is not configured.');
    }

    $ch = curl_init(paypal_base_url() . '/v1/oauth2/token');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERPWD => $PAYPAL_CLIENT_ID . ':' . $PAYPAL_CLIENT_SECRET,
        CURLOPT_HTTPHEADER => ['Accept: application/json', 'Accept-Language: en_US'],
        CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
        CURLOPT_TIMEOUT => 20
    ]);

    $body = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($body === false || $status < 200 || $status >= 300) {
        throw new RuntimeException($error ?: 'PayPal OAuth failed with HTTP ' . $status . '.');
    }

    $json = json_decode($body, true);
    if (empty($json['access_token'])) {
        throw new RuntimeException('PayPal OAuth response did not include an access token.');
    }

    return $json['access_token'];
}

function paypal_request($method, $path, $payload = null)
{
    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . paypal_access_token()
    ];

    $ch = curl_init(paypal_base_url() . $path);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 20
    ]);

    if ($payload !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    }

    $body = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($body === false || $status < 200 || $status >= 300) {
        throw new RuntimeException($error ?: 'PayPal request failed with HTTP ' . $status . ': ' . (string)$body);
    }

    return json_decode($body, true);
}

function stripe_checkout_ready_comment()
{
    return 'Later Stripe integration should use Checkout Sessions with the latest Stripe API. Create the Checkout Session server-side, store the session ID as reference_no, then create the access grant only from a verified checkout.session.completed webhook.';
}

