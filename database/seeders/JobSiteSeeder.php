<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MOMS\JobSite;

class JobSiteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jobSites = [
            [
                'name' => 'North Pit Excavation',
                'location' => 'Mining Site A - North Sector',
                'code' => 'NP-EXC',
                'description' => 'Primary excavation site for mineral extraction',
                'status' => 'Active',
            ],
            [
                'name' => 'South Pit Development',
                'location' => 'Mining Site A - South Sector',
                'code' => 'SP-DEV',
                'description' => 'New development area for expansion',
                'status' => 'Active',
            ],
            [
                'name' => 'Crusher Station 1',
                'location' => 'Processing Area - Station 1',
                'code' => 'CS-01',
                'description' => 'Primary crushing and processing station',
                'status' => 'Active',
            ],
            [
                'name' => 'Haul Road Maintenance',
                'location' => 'Main Transport Route',
                'code' => 'HR-MNT',
                'description' => 'Road maintenance and grading operations',
                'status' => 'Active',
            ],
            [
                'name' => 'Storage Yard Operations',
                'location' => 'Central Storage Facility',
                'code' => 'SY-OPS',
                'description' => 'Material storage and handling area',
                'status' => 'Active',
            ],
            [
                'name' => 'East Slope Stabilization',
                'location' => 'Mining Site B - East Wall',
                'code' => 'ES-STB',
                'description' => 'Slope stabilization and safety work',
                'status' => 'Active',
            ],
        ];

        foreach ($jobSites as $site) {
            JobSite::updateOrCreate(
                ['code' => $site['code']],
                $site
            );
        }
    }
}
