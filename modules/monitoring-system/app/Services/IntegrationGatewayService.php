<?php

namespace App\Services;

class IntegrationGatewayService
{
    public function drivers(): array
    {
        return ['mqtt', 'onvif_rtsp', 'bacnet_ip', 'modbus_tcp', 'rest_api', 'dry_contact'];
    }
}
