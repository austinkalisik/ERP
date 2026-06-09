<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Subscription Renewal Reminder</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #6366f1; padding: 28px 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 700; }
    .header p  { color: #c7d2fe; margin: 6px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .urgency { display: inline-block; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; margin-bottom: 20px; }
    .urgency.high   { background: #fee2e2; color: #991b1b; }
    .urgency.medium { background: #fef3c7; color: #92400e; }
    .urgency.low    { background: #dbeafe; color: #1e40af; }
    .greeting { font-size: 15px; color: #374151; margin-bottom: 16px; }
    .detail-box { background: #f8fafc; border-radius: 10px; padding: 20px 24px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; }
    .detail-value { color: #111827; font-weight: 600; }
    .detail-value.urgent { color: #dc2626; }
    .cta { text-align: center; margin: 28px 0 8px; }
    .cta a { display: inline-block; background: #6366f1; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; }
    .note { font-size: 13px; color: #9ca3af; margin-top: 20px; line-height: 1.6; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
<div class="wrapper">

  <div class="header">
    <h1>NextGen CRM</h1>
    <p>Subscription Renewal Reminder</p>
  </div>

  <div class="body">

    @php
      $urgencyClass = $days_left <= 7 ? 'high' : ($days_left <= 14 ? 'medium' : 'low');
      $urgencyLabel = $days_left <= 7 ? 'Urgent — expires very soon' : ($days_left <= 14 ? 'Action needed soon' : 'Renewal due soon');
    @endphp

    <span class="urgency {{ $urgencyClass }}">{{ $urgencyLabel }}</span>

    <p class="greeting">
      Dear {{ $contact_person ?? $client_name }},
    </p>

    <p style="color:#374151;font-size:15px;line-height:1.6;">
      This is a reminder that your <strong>{{ $service_name }}</strong> subscription
      is due for renewal in <strong>{{ $days_left }} day{{ $days_left !== 1 ? 's' : '' }}</strong>.
      Please arrange payment to avoid any service interruption.
    </p>

    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Client</span>
        <span class="detail-value">{{ $client_name }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Service</span>
        <span class="detail-value">{{ $service_name }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Billing cycle</span>
        <span class="detail-value">{{ $billing_cycle }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Renewal amount</span>
        <span class="detail-value">K{{ number_format($amount, 2) }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Expiry date</span>
        <span class="detail-value {{ $urgencyClass === 'high' ? 'urgent' : '' }}">
          {{ \Carbon\Carbon::parse($expiry_date)->format('d M Y') }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Days remaining</span>
        <span class="detail-value {{ $urgencyClass === 'high' ? 'urgent' : '' }}">
          {{ $days_left }} day{{ $days_left !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <p style="color:#374151;font-size:14px;line-height:1.6;">
      To renew your subscription, please contact your account manager or make payment
      directly. Once payment is received, your subscription will be extended for another
      {{ strtolower($billing_cycle) }} period.
    </p>

    <p class="note">
      This is an automated reminder from NextGen CRM. If you have already arranged
      renewal, please disregard this message. For queries, contact your account manager.
    </p>
  </div>

  <div class="footer">
    NextGen Technology Limited PNG &nbsp;·&nbsp; This email was sent automatically by NextGen CRM
  </div>

</div>
</body>
</html>