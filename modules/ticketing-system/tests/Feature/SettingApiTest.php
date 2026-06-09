<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_can_be_loaded_and_updated(): void
    {
        $this->getJson('/api/settings')
            ->assertOk()
            ->assertJsonPath('company_name', 'Nextgen Technology Limited')
            ->assertJsonPath('support_email', 'support@nextgenpng.net');

        $this->putJson('/api/settings', [
            'company_name' => 'Nextgen Technology Limited',
            'website_url' => 'https://nextgenpng.net/',
            'support_email' => 'helpdesk@nextgenpng.net',
            'support_phone' => '+675 325 2023',
            'office_address' => 'Mutual Rumana Building Waigani, Port Moresby',
            'profile_name' => 'Support Manager',
            'profile_role' => 'Service Desk Lead',
            'profile_photo' => 'data:image/png;base64,abc123',
        ])
            ->assertOk()
            ->assertJsonPath('support_email', 'helpdesk@nextgenpng.net')
            ->assertJsonPath('profile_name', 'Support Manager')
            ->assertJsonPath('profile_photo', 'data:image/png;base64,abc123');
    }
}
