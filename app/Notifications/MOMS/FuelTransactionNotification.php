<?php

namespace App\Notifications\MOMS;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\MOMS\FuelTransaction;

class FuelTransactionNotification extends Notification
{
    use Queueable;

    public function __construct(
        public FuelTransaction $transaction
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $machine = $this->transaction->machine;
        $logger  = $this->transaction->loggedBy;

        return [
            'type'           => 'fuel_transaction_logged',
            'title'          => '⛽ Fuel Transaction Logged',
            'message'        => "Machine {$machine->machine_id} — {$this->transaction->volume}L of {$this->transaction->fuel_type} logged by {$logger->name}. Total cost: K{$this->transaction->total_cost}.",
            'machine_id'     => $machine->machine_id,
            'transaction_id' => $this->transaction->id,
            'volume'         => $this->transaction->volume,
            'fuel_type'      => $this->transaction->fuel_type,
            'total_cost'     => $this->transaction->total_cost,
            'url'            => '/moms/fuel-logs',
        ];
    }
}