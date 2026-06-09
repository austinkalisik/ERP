<?php

namespace App\Services\Integrations;

class MqttIntegrationService
{
    public function connect(array $config): bool { return false; }
    public function subscribe(string $topic): void {}
}
