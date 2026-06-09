# NAC WiFi Caddy HTTPS Setup

This project can run behind Caddy so users are redirected from HTTP to HTTPS.

## Target Layout

- Caddy listens on `8443` for HTTPS and can redirect HTTP from port `80`.
- Apache/XAMPP listens only on `8080`.
- PHP files stay in `C:\Users\akalisik\xamp\htdocs\nac_wifi_xampp`.
- Caddy proxies `https://192.168.88.133:8443/nac_wifi_xampp` to Apache.

## 1. Move Apache To Port 8080

In XAMPP Apache config, change the Apache listen port from:

```apache
Listen 80
ServerName localhost:80
```

to:

```apache
Listen 8080
ServerName localhost:8080
```

Restart Apache in XAMPP.

Test Apache directly:

```text
http://127.0.0.1:8080/nac_wifi_xampp/phone.php
```

## 2. Use The Project Caddyfile

Project file:

```text
Z:\NextGen Projects\nac_wifi_xampp\Caddyfile
```

Validate it:

```powershell
caddy validate --config "Z:\NextGen Projects\nac_wifi_xampp\Caddyfile"
```

Run it:

```powershell
caddy run --config "Z:\NextGen Projects\nac_wifi_xampp\Caddyfile"
```

## 3. Portal Settings

Open:

```text
https://192.168.88.133:8443/nac_wifi_xampp/admin_settings.php
```

Set:

- Public portal host/IP: `192.168.88.133:8443`
- Public portal scheme: `HTTPS`
- Portal path: `/nac_wifi_xampp`

After saving, System Control should show HTTPS links.

## 4. Certificate Note

The default lab Caddyfile uses:

```caddy
tls internal
```

This creates a local certificate. Browsers may show a warning until the Caddy local root certificate is trusted on the client device.

For a real public DNS name, replace `192.168.88.133:8443` in the Caddyfile with the domain name and chosen HTTPS port and remove `tls internal`. Caddy can then request a public certificate automatically.

## 5. MikroTik / UniFi Note

Use the HTTPS portal URL when configuring the captive portal:

```text
https://192.168.88.133:8443/nac_wifi_xampp
```

For MikroTik, regenerate `hotspot/login.html` from Admin > System Control after switching the portal scheme to HTTPS.
