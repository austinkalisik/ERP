<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CRM\CrmService;

class CrmServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            [
                'name'        => 'Internet Service',
                'description' => 'ISP / broadband internet connectivity',
            ],
            [
                'name'        => 'Domain Hosting',
                'description' => 'Web domain registration and hosting',
            ],
            [
                'name'        => 'GPS',
                'description' => 'GPS tracking and fleet monitoring service',
            ],
        ];

        foreach ($services as $service) {
            CrmService::firstOrCreate(
                ['name' => $service['name']],
                [
                    'description' => $service['description'],
                    'is_active'   => true,
                ]
            );
        }
    }
}