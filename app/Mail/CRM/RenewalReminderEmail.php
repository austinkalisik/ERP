<?php

namespace App\Mail\CRM;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RenewalReminderEmail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param array $data {
     *   client_name, contact_person, email,
     *   service_name, billing_cycle, amount,
     *   expiry_date, days_left
     * }
     */
    public function __construct(public readonly array $data) {}

    public function envelope(): Envelope
    {
        $days = $this->data['days_left'];

        return new Envelope(
            subject: "Subscription Renewal Reminder — {$this->data['service_name']} expires in {$days} day" . ($days !== 1 ? 's' : ''),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.crm.renewal-reminder',
            with: $this->data,
        );
    }
}