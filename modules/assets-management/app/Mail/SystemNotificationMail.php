<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SystemNotificationMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public string $title,
        public string $messageBody,
        public ?string $actionUrl = null
    ) {}

    public function build(): self
    {
        $lines = [$this->messageBody];

        if ($this->actionUrl) {
            $lines[] = '';
            $lines[] = 'Open: '.$this->actionUrl;
        }

        return $this->subject($this->title)
            ->text('emails.system-notification-plain')
            ->with([
                'bodyText' => implode("\n", $lines),
            ]);
    }
}
