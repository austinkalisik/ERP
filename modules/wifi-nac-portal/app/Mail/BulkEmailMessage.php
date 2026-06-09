<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class BulkEmailMessage extends Mailable
{
    public function __construct(
        public string $emailSubject,
        public string $emailBody,
    ) {}

    public function build(): self
    {
        return $this
            ->subject($this->emailSubject)
            ->text('emails.bulk-message');
    }
}
