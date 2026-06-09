<?php

namespace App\Services\Integrations;

class OnvifCameraService
{
    public function probe(string $host): array { return ['host' => $host, 'available' => false]; }
}
