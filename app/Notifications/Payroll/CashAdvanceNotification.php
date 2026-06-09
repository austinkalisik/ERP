<?php
namespace App\Notifications\Payroll;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
class CashAdvanceNotification extends Notification
{
    use Queueable;
    public function __construct(
        public int    $advanceId,
        public float  $amount,
        public string $status  // 'Approved' | 'Rejected'
    ) {}
    public function via(object $notifiable): array { return ['database']; }
    public function toDatabase(object $notifiable): array
    {
        $emoji = $this->status === 'Approved' ? '✅' : '❌';
        return [
            'module'     => 'payroll',
            'type'       => 'cash_advance_' . strtolower($this->status),
            'title'      => "{$emoji} Cash Advance {$this->status}",
            'message'    => "Your cash advance request of K" . number_format($this->amount, 2) . " has been {$this->status}.",
            'url'        => '/payroll/cash-advances',
            'advance_id' => $this->advanceId,
            'amount'     => $this->amount,
        ];
    }
}