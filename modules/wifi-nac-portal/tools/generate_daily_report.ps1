param(
    [string]$OutputDir = "reports"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = (Resolve-Path ".").Path
$out = Join-Path $root $OutputDir
New-Item -ItemType Directory -Force -Path $out | Out-Null

$date = "15 May 2026"
$docxPath = Join-Path $out "NextGen-CRM-Daily-System-Report-2026-05-15.docx"
$mdPath = Join-Path $out "NextGen-CRM-Daily-System-Report-2026-05-15.md"

$sections = @(
    @{
        Title = "Executive Summary"
        Bullets = @(
            "The NextGen CRM system has been updated into a working operational CRM for customers, domain services, support requests, domain registrations, subscriptions, renewals, payments, invoice attachments, and service credits.",
            "Dashboard counts have been corrected so each metric uses clear business logic instead of mixing unrelated request types.",
            "Seed data has been added across the system so the dashboard, domains page, support pages, registrations, subscriptions, payments, and credits can all be tested immediately.",
            "Automated verification passed after the latest updates."
        )
    },
    @{
        Title = "Dashboard Logic"
        Bullets = @(
            "Total Customers counts all customer records.",
            "Total Domains counts domain services plus open domain registrations, excluding cancelled records.",
            "Total Suspended Customers counts customers with suspended account status.",
            "New Support Requests counts open support-service requests only.",
            "New Domain Registrations counts open domain registration requests only.",
            "The Total Domains View Detail card now opens a dedicated /domains listing page."
        )
    },
    @{
        Title = "Core Features Completed"
        Bullets = @(
            "Customer listing and customer creation workflows.",
            "Domain listing page with searchable customer/domain table.",
            "Support request listing, support request detail view, and clickable notification links.",
            "Domain registration listing and detail access.",
            "Admin settings for branding, system name, logo, and email/SMTP settings.",
            "Admin user creation and role assignment.",
            "Bulk email validation and SMTP-backed sending to valid addresses.",
            "Professional Add Customer form layout with corrected start date and renewal date fields.",
            "Subscription module for Domain Hosting, Internet Service, GPS, Email Hosting, Website Hosting, and Other services.",
            "Renewal monitoring now includes both hosting requests and subscriptions.",
            "Payment and invoice attachment tracking for subscriptions.",
            "Service credit tracking that extends expiry dates for outages or unused service periods.",
            "ERD and wireframe documentation added under docs/nextgen-crm-erd-wireframe.md.",
            "LAN run support for http://192.168.88.133:8001/."
        )
    },
    @{
        Title = "Seeded Test Data"
        Bullets = @(
            "5 customer records.",
            "6 domain/domain-registration records.",
            "1 suspended customer record.",
            "3 open support requests.",
            "3 open domain registrations.",
            "3 subscription records.",
            "3 payment records with invoice attachment files.",
            "2 service credit records.",
            "3 user accounts: admin, staff, and customer portal login."
        )
    },
    @{
        Title = "Verification Results"
        Bullets = @(
            "php artisan test passed: 55 tests.",
            "npm run format:check passed.",
            "npm run types:check passed.",
            "npm run lint:check passed.",
            "npm run build passed.",
            "php artisan db:seed completed successfully."
        )
    },
    @{
        Title = "Important Files Updated"
        Bullets = @(
            "app/Http/Controllers/Crm/DashboardController.php",
            "app/Http/Controllers/Crm/DomainHostingRequestController.php",
            "app/Http/Controllers/Crm/CustomerSubscriptionController.php",
            "app/Http/Middleware/HandleInertiaRequests.php",
            "app/Models/DomainHostingRequest.php",
            "app/Models/CustomerSubscription.php",
            "app/Models/SubscriptionPayment.php",
            "app/Models/SubscriptionCredit.php",
            "database/seeders/DatabaseSeeder.php",
            "database/migrations/2026_05_15_000001_create_customer_subscriptions_tables.php",
            "resources/js/pages/dashboard.tsx",
            "resources/js/pages/domains/index.tsx",
            "resources/js/pages/subscriptions/index.tsx",
            "resources/js/pages/support/show.tsx",
            "resources/css/app.css",
            "routes/web.php"
        )
    },
    @{
        Title = "Operational Notes"
        Bullets = @(
            "The app is available on the local network at http://192.168.88.133:8001/ when Laravel is served with --host=0.0.0.0 --port=8001.",
            "SMTP sending requires real SMTP username and password in Admin Settings before emails can be delivered externally.",
            "Seed data is idempotent and can be run again with php artisan db:seed without intentionally duplicating the demo records.",
            "Production data should be backed up before running destructive commands such as migrate:fresh."
        )
    }
)

$markdown = @()
$markdown += "# NextGen CRM Daily System Report"
$markdown += ""
$markdown += "**Report Date:** $date"
$markdown += "**Prepared For:** Daily progress report upload"
$markdown += "**System URL:** http://192.168.88.133:8001/"
$markdown += ""
foreach ($section in $sections) {
    $markdown += "## $($section.Title)"
    foreach ($bullet in $section.Bullets) {
        $markdown += "- $bullet"
    }
    $markdown += ""
}
Set-Content -Path $mdPath -Value ($markdown -join [Environment]::NewLine)

function XmlEscape([string]$value) {
    return [System.Security.SecurityElement]::Escape($value)
}

function Paragraph([string]$text, [string]$style = $null) {
    $escaped = XmlEscape $text
    if ($style) {
        return "<w:p><w:pPr><w:pStyle w:val=""$style""/></w:pPr><w:r><w:t>$escaped</w:t></w:r></w:p>"
    }
    return "<w:p><w:r><w:t>$escaped</w:t></w:r></w:p>"
}

function Bullet([string]$text) {
    $escaped = XmlEscape $text
    return "<w:p><w:pPr><w:pStyle w:val=""ListBullet""/></w:pPr><w:r><w:t>$escaped</w:t></w:r></w:p>"
}

function TableRow([string]$left, [string]$right) {
    $l = XmlEscape $left
    $r = XmlEscape $right
    return @"
<w:tr>
<w:tc><w:tcPr><w:tcW w:w="2600" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>$l</w:t></w:r></w:p></w:tc>
<w:tc><w:tcPr><w:tcW w:w="6200" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>$r</w:t></w:r></w:p></w:tc>
</w:tr>
"@
}

$body = @()
$body += (Paragraph "NextGen CRM Daily System Report" "Title")
$body += (Paragraph "Report Date: $date")
$body += (Paragraph "Prepared for daily report upload")
$body += (Paragraph "System URL: http://192.168.88.133:8001/")
$body += (Paragraph "")
$body += (Paragraph "Current Seeded Dashboard Counts" "Heading1")
$body += @"
<w:tbl>
<w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="8800" w:type="dxa"/></w:tblPr>
$(TableRow "Total Customers" "5")
$(TableRow "Total Domains" "6")
$(TableRow "Total Suspended Customers" "1")
$(TableRow "New Support Requests" "3")
$(TableRow "New Domain Registrations" "3")
$(TableRow "Subscriptions" "3")
$(TableRow "Payments / Invoice Attachments" "3")
$(TableRow "Service Credits" "2")
</w:tbl>
"@

foreach ($section in $sections) {
    $body += (Paragraph $section.Title "Heading1")
    foreach ($bullet in $section.Bullets) {
        $body += (Bullet $bullet)
    }
}

$documentXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
$($body -join "`n")
<w:sectPr>
<w:pgSz w:w="11906" w:h="16838"/>
<w:pgMar w:top="1008" w:right="1008" w:bottom="1008" w:left="1008" w:header="720" w:footer="720" w:gutter="0"/>
</w:sectPr>
</w:body>
</w:document>
"@

$stylesXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:style w:type="paragraph" w:default="1" w:styleId="Normal">
<w:name w:val="Normal"/>
<w:qFormat/>
<w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr>
<w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="22"/></w:rPr>
</w:style>
<w:style w:type="paragraph" w:styleId="Title">
<w:name w:val="Title"/>
<w:basedOn w:val="Normal"/>
<w:next w:val="Normal"/>
<w:qFormat/>
<w:pPr><w:spacing w:after="360"/></w:pPr>
<w:rPr><w:rFonts w:ascii="Aptos Display" w:hAnsi="Aptos Display"/><w:b/><w:color w:val="0F766E"/><w:sz w:val="42"/></w:rPr>
</w:style>
<w:style w:type="paragraph" w:styleId="Heading1">
<w:name w:val="heading 1"/>
<w:basedOn w:val="Normal"/>
<w:next w:val="Normal"/>
<w:qFormat/>
<w:pPr><w:spacing w:before="360" w:after="160"/></w:pPr>
<w:rPr><w:b/><w:color w:val="1F2937"/><w:sz w:val="28"/></w:rPr>
</w:style>
<w:style w:type="paragraph" w:styleId="ListBullet">
<w:name w:val="List Bullet"/>
<w:basedOn w:val="Normal"/>
<w:qFormat/>
<w:pPr><w:ind w:left="360" w:hanging="180"/><w:spacing w:after="80"/></w:pPr>
<w:rPr><w:sz w:val="21"/></w:rPr>
</w:style>
<w:style w:type="table" w:styleId="TableGrid">
<w:name w:val="Table Grid"/>
<w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="CBD5E1"/><w:left w:val="single" w:sz="4" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="4" w:color="CBD5E1"/><w:right w:val="single" w:sz="4" w:color="CBD5E1"/><w:insideH w:val="single" w:sz="4" w:color="CBD5E1"/><w:insideV w:val="single" w:sz="4" w:color="CBD5E1"/></w:tblBorders><w:tblCellMar><w:top w:w="100" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr>
</w:style>
</w:styles>
"@

$contentTypes = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
"@

$rels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"@

$docRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
"@

$core = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>NextGen CRM Daily System Report</dc:title>
<dc:creator>Codex</dc:creator>
<cp:lastModifiedBy>Codex</cp:lastModifiedBy>
<dcterms:created xsi:type="dcterms:W3CDTF">2026-05-15T00:00:00Z</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">2026-05-15T00:00:00Z</dcterms:modified>
</cp:coreProperties>
"@

$app = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
<Application>NextGen CRM</Application>
</Properties>
"@

$temp = Join-Path $out "docx-temp"
if (Test-Path $temp) { Remove-Item -Recurse -Force $temp }
New-Item -ItemType Directory -Force -Path (Join-Path $temp "_rels") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $temp "word\_rels") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $temp "docProps") | Out-Null

Set-Content -LiteralPath (Join-Path $temp "[Content_Types].xml") -Value $contentTypes
Set-Content -LiteralPath (Join-Path $temp "_rels\.rels") -Value $rels
Set-Content -LiteralPath (Join-Path $temp "word\document.xml") -Value $documentXml
Set-Content -LiteralPath (Join-Path $temp "word\styles.xml") -Value $stylesXml
Set-Content -LiteralPath (Join-Path $temp "word\_rels\document.xml.rels") -Value $docRels
Set-Content -LiteralPath (Join-Path $temp "docProps\core.xml") -Value $core
Set-Content -LiteralPath (Join-Path $temp "docProps\app.xml") -Value $app

if (Test-Path $docxPath) { Remove-Item -Force $docxPath }
[System.IO.Compression.ZipFile]::CreateFromDirectory($temp, $docxPath)

Remove-Item -Recurse -Force $temp

Write-Output "DOCX: $docxPath"
Write-Output "Markdown: $mdPath"
