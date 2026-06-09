<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Aims\PaymentTerm;

class PaymentTermsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $paymentTerms = [
            ['name' => 'Net 15', 'days' => 15],
            ['name' => 'Net 30', 'days' => 30],
            ['name' => 'Net 45', 'days' => 45],
            ['name' => 'Net 60', 'days' => 60],
        ];

        foreach ($paymentTerms as $term) {
            PaymentTerm::create($term);
        }
    }
}
