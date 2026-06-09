<?php

namespace App\Services\Integrations;

class FireAlarmGatewayService
{
    public function dryContactState(string $zone): array
    {
        return ['zone' => $zone, 'alarm' => false, 'trouble' => false, 'supervisory' => false];
    }
}
