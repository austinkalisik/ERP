<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HRMS\EmploymentClassification;

class EmploymentClassificationSeeder extends Seeder
{
    public function run(): void
    {
        $classifications = [
            'Probationary',
            'Regular',
            'Resigned',
            'Terminated',
            'End of Contract',
            'Retired',
        ];

        foreach ($classifications as $classification) {
            EmploymentClassification::firstOrCreate([
                'name' => $classification
            ]);
        }
    }
}
