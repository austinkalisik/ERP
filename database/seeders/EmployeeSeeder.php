<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |----------------------------------------------------------------------
        | Department IDs (from DepartmentSeeder insert order)
        |   1 = IT          2 = HR
        |   3 = Finance     4 = Operations
        |
        | Shift IDs (assumed from ShiftSeeder)
        |   1 = Day Shift   2 = Night Shift
        |
        | Employment Classification IDs
        |   1 = Regular     2 = Probationary     3 = Contractual
        |
        | Leave Type IDs
        |   1 = Vacation Leave   2 = Sick Leave   3 = Emergency Leave
        |----------------------------------------------------------------------
        */

        $employees = [

            /*
            | ── 1 ── IT ────────────────────────────────────────────────────
            */
            [
                'employee' => [
                    'biometric_id'    => 'BIO-001',
                    'employee_number' => 'EMP-2024-001',
                    'first_name'      => 'James',
                    'middle_name'     => 'Kila',
                    'last_name'       => 'Wanem',
                    'profile_picture' => 'default.png',
                    'qr_code'         => 'QR-BIO-001',
                    'shift_id'        => 1,
                ],
                'employment' => [
                    'department_id'             => 1,
                    'position'                  => 'IT Manager',
                    'department_head'           => 'Robert Teine',
                    'supervisor'                => 'Robert Teine',
                    'job_location'              => 'Port Moresby',
                    'employee_type'             => 'Full-Time',
                    'employment_status'         => 'Active',
                    'employment_classification' => 1,
                    'company_email'             => 'j.wanem@company.com.pg',
                    'rate'                      => 1250.00,
                    'rate_type'                 => 'Fortnightly',
                    'date_started'              => '2021-03-15',
                    'date_ended'                => '2026-03-14',
                ],
                'personal' => [
                    'birthdate'         => '1988-06-12',
                    'age'               => 36,
                    'birthplace'        => 'Lae, Morobe Province',
                    'nationality'       => 'Papua New Guinean',
                    'civil_status'      => 'Married',
                    'religion'          => 'Catholic',
                    'gender'            => 'Male',
                    'present_address'   => 'Section 12, Lot 5, Waigani, NCD',
                    'home_address'      => 'Section 12, Lot 5, Waigani, NCD',
                    'email_address'     => 'james.wanem@gmail.com',
                    'mobile_number'     => '+675 7123 4501',
                    'dependents'        => 3,
                    'lodged'            => 'No',
                    'emergency_contact' => 'Mary Wanem',
                    'emergency_number'  => '+675 7123 4600',
                ],
                'account' => [
                    'nasfund'             => true,
                    'nasfund_number'      => 'NF-100001',
                    'tin_number'          => 'TIN-201-001',
                    'work_permit_number'  => 'WP-LOCAL-001',
                    'work_permit_expiry'  => '2026-12-31',
                    'visa_number'         => 'VS-LOCAL-001',
                    'visa_expiry'         => '2026-12-31',
                    'bsb_code'            => '088-001',
                    'bank_name'           => 'BSP Bank',
                    'account_number'      => '1000100001',
                    'account_name'        => 'James K Wanem',
                ],
                'deminimis' => [
                    ['type' => 'rice',     'amount' => 100.00],
                    ['type' => 'meal',     'amount' => 80.00],
                    ['type' => 'clothing', 'amount' => 150.00],
                ],
                'leave_credits' => [
                    ['leave_type_id' => 1, 'total_days' => 14, 'used_days' => 2, 'remaining_days' => 12],
                    ['leave_type_id' => 2, 'total_days' => 10, 'used_days' => 1, 'remaining_days' => 9],
                    ['leave_type_id' => 3, 'total_days' => 3,  'used_days' => 0, 'remaining_days' => 3],
                ],
            ],

            /*
            | ── 2 ── IT ────────────────────────────────────────────────────
            */
            [
                'employee' => [
                    'biometric_id'    => 'BIO-002',
                    'employee_number' => 'EMP-2024-002',
                    'first_name'      => 'Michael',
                    'middle_name'     => 'Peni',
                    'last_name'       => 'Buka',
                    'profile_picture' => 'default.png',
                    'qr_code'         => 'QR-BIO-002',
                    'shift_id'        => 1,
                ],
                'employment' => [
                    'department_id'             => 1,
                    'position'                  => 'Systems Administrator',
                    'department_head'           => 'James Wanem',
                    'supervisor'                => 'James Wanem',
                    'job_location'              => 'Port Moresby',
                    'employee_type'             => 'Full-Time',
                    'employment_status'         => 'Active',
                    'employment_classification' => 1,
                    'company_email'             => 'm.buka@company.com.pg',
                    'rate'                      => 1050.00,
                    'rate_type'                 => 'Fortnightly',
                    'date_started'              => '2020-07-01',
                    'date_ended'                => '2026-06-30',
                ],
                'personal' => [
                    'birthdate'         => '1985-03-08',
                    'age'               => 39,
                    'birthplace'        => 'Kokopo, East New Britain',
                    'nationality'       => 'Papua New Guinean',
                    'civil_status'      => 'Married',
                    'religion'          => 'Seventh Day Adventist',
                    'gender'            => 'Male',
                    'present_address'   => 'Top Town, Lae',
                    'home_address'      => 'Top Town, Lae',
                    'email_address'     => 'michael.buka@gmail.com',
                    'mobile_number'     => '+675 7345 6703',
                    'dependents'        => 4,
                    'lodged'            => 'Company House',
                    'emergency_contact' => 'Susan Buka',
                    'emergency_number'  => '+675 7345 6800',
                ],
                'account' => [
                    'nasfund'             => true,
                    'nasfund_number'      => 'NF-100002',
                    'tin_number'          => 'TIN-201-002',
                    'work_permit_number'  => 'WP-LOCAL-002',
                    'work_permit_expiry'  => '2026-12-31',
                    'visa_number'         => 'VS-LOCAL-002',
                    'visa_expiry'         => '2026-12-31',
                    'bsb_code'            => '055-001',
                    'bank_name'           => 'Kina Bank',
                    'account_number'      => '2000200001',
                    'account_name'        => 'Michael Buka',
                ],
                'deminimis' => [
                    ['type' => 'rice',     'amount' => 100.00],
                    ['type' => 'meal',     'amount' => 80.00],
                    ['type' => 'clothing', 'amount' => 150.00],
                ],
                'leave_credits' => [
                    ['leave_type_id' => 1, 'total_days' => 14, 'used_days' => 0, 'remaining_days' => 14],
                    ['leave_type_id' => 2, 'total_days' => 10, 'used_days' => 2, 'remaining_days' => 8],
                    ['leave_type_id' => 3, 'total_days' => 3,  'used_days' => 0, 'remaining_days' => 3],
                ],
            ],

            /*
            | ── 3 ── HR ────────────────────────────────────────────────────
            */
            [
                'employee' => [
                    'biometric_id'    => 'BIO-003',
                    'employee_number' => 'EMP-2024-003',
                    'first_name'      => 'Grace',
                    'middle_name'     => 'Naiwo',
                    'last_name'       => 'Taupa',
                    'profile_picture' => 'default.png',
                    'qr_code'         => 'QR-BIO-003',
                    'shift_id'        => 1,
                ],
                'employment' => [
                    'department_id'             => 2,
                    'position'                  => 'HR Manager',
                    'department_head'           => 'Anna Kevau',
                    'supervisor'                => 'Anna Kevau',
                    'job_location'              => 'Port Moresby',
                    'employee_type'             => 'Full-Time',
                    'employment_status'         => 'Active',
                    'employment_classification' => 1,
                    'company_email'             => 'g.taupa@company.com.pg',
                    'rate'                      => 1100.00,
                    'rate_type'                 => 'Fortnightly',
                    'date_started'              => '2022-01-10',
                    'date_ended'                => '2026-01-09',
                ],
                'personal' => [
                    'birthdate'         => '1993-11-25',
                    'age'               => 31,
                    'birthplace'        => 'Goroka, Eastern Highlands',
                    'nationality'       => 'Papua New Guinean',
                    'civil_status'      => 'Single',
                    'religion'          => 'United Church',
                    'gender'            => 'Female',
                    'present_address'   => 'Tokarara, NCD',
                    'home_address'      => 'Tokarara, NCD',
                    'email_address'     => 'grace.taupa@gmail.com',
                    'mobile_number'     => '+675 7234 5602',
                    'dependents'        => 1,
                    'lodged'            => 'No',
                    'emergency_contact' => 'Peter Taupa',
                    'emergency_number'  => '+675 7234 5700',
                ],
                'account' => [
                    'nasfund'             => true,
                    'nasfund_number'      => 'NF-100003',
                    'tin_number'          => 'TIN-201-003',
                    'work_permit_number'  => 'WP-LOCAL-003',
                    'work_permit_expiry'  => '2026-12-31',
                    'visa_number'         => 'VS-LOCAL-003',
                    'visa_expiry'         => '2026-12-31',
                    'bsb_code'            => '088-001',
                    'bank_name'           => 'BSP Bank',
                    'account_number'      => '1000100003',
                    'account_name'        => 'Grace N Taupa',
                ],
                'deminimis' => [
                    ['type' => 'rice',     'amount' => 100.00],
                    ['type' => 'meal',     'amount' => 80.00],
                    ['type' => 'clothing', 'amount' => 150.00],
                ],
                'leave_credits' => [
                    ['leave_type_id' => 1, 'total_days' => 14, 'used_days' => 5, 'remaining_days' => 9],
                    ['leave_type_id' => 2, 'total_days' => 10, 'used_days' => 3, 'remaining_days' => 7],
                    ['leave_type_id' => 3, 'total_days' => 3,  'used_days' => 1, 'remaining_days' => 2],
                ],
            ],

            /*
            | ── 4 ── HR ────────────────────────────────────────────────────
            */
            [
                'employee' => [
                    'biometric_id'    => 'BIO-004',
                    'employee_number' => 'EMP-2024-004',
                    'first_name'      => 'Patricia',
                    'middle_name'     => 'Teine',
                    'last_name'       => 'Vagi',
                    'profile_picture' => 'default.png',
                    'qr_code'         => 'QR-BIO-004',
                    'shift_id'        => 1,
                ],
                'employment' => [
                    'department_id'             => 2,
                    'position'                  => 'HR Officer',
                    'department_head'           => 'Anna Kevau',
                    'supervisor'                => 'Grace Taupa',
                    'job_location'              => 'Port Moresby',
                    'employee_type'             => 'Full-Time',
                    'employment_status'         => 'Active',
                    'employment_classification' => 2,
                    'company_email'             => 'p.vagi@company.com.pg',
                    'rate'                      => 750.00,
                    'rate_type'                 => 'Fortnightly',
                    'date_started'              => '2023-11-13',
                    'date_ended'                => '2025-11-12',
                ],
                'personal' => [
                    'birthdate'         => '1999-02-14',
                    'age'               => 25,
                    'birthplace'        => 'Madang, Madang Province',
                    'nationality'       => 'Papua New Guinean',
                    'civil_status'      => 'Single',
                    'religion'          => 'Catholic',
                    'gender'            => 'Female',
                    'present_address'   => 'Konedobu, NCD',
                    'home_address'      => 'Konedobu, NCD',
                    'email_address'     => 'patricia.vagi@gmail.com',
                    'mobile_number'     => '+675 7890 1208',
                    'dependents'        => 0,
                    'lodged'            => 'No',
                    'emergency_contact' => 'John Vagi',
                    'emergency_number'  => '+675 7890 1300',
                ],
                'account' => [
                    'nasfund'             => true,
                    'nasfund_number'      => 'NF-100004',
                    'tin_number'          => 'TIN-201-004',
                    'work_permit_number'  => 'WP-LOCAL-004',
                    'work_permit_expiry'  => '2026-12-31',
                    'visa_number'         => 'VS-LOCAL-004',
                    'visa_expiry'         => '2026-12-31',
                    'bsb_code'            => '088-001',
                    'bank_name'           => 'BSP Bank',
                    'account_number'      => '1000100004',
                    'account_name'        => 'Patricia T Vagi',
                ],
                'deminimis' => [
                    ['type' => 'rice',     'amount' => 100.00],
                    ['type' => 'meal',     'amount' => 80.00],
                    ['type' => 'clothing', 'amount' => 150.00],
                ],
                'leave_credits' => [
                    ['leave_type_id' => 1, 'total_days' => 10, 'used_days' => 2, 'remaining_days' => 8],
                    ['leave_type_id' => 2, 'total_days' => 7,  'used_days' => 1, 'remaining_days' => 6],
                    ['leave_type_id' => 3, 'total_days' => 3,  'used_days' => 0, 'remaining_days' => 3],
                ],
            ],

            /*
            | ── 5 ── Finance ───────────────────────────────────────────────
            */
            [
                'employee' => [
                    'biometric_id'    => 'BIO-005',
                    'employee_number' => 'EMP-2024-005',
                    'first_name'      => 'Sarah',
                    'middle_name'     => 'Wagi',
                    'last_name'       => 'Mondo',
                    'profile_picture' => 'default.png',
                    'qr_code'         => 'QR-BIO-005',
                    'shift_id'        => 1,
                ],
                'employment' => [
                    'department_id'             => 3,
                    'position'                  => 'Finance Manager',
                    'department_head'           => 'Chris Kaupa',
                    'supervisor'                => 'Chris Kaupa',
                    'job_location'              => 'Port Moresby',
                    'employee_type'             => 'Full-Time',
                    'employment_status'         => 'Active',
                    'employment_classification' => 1,
                    'company_email'             => 's.mondo@company.com.pg',
                    'rate'                      => 1400.00,
                    'rate_type'                 => 'Fortnightly',
                    'date_started'              => '2023-02-20',
                    'date_ended'                => '2026-02-19',
                ],
                'personal' => [
                    'birthdate'         => '1995-08-30',
                    'age'               => 29,
                    'birthplace'        => 'Mount Hagen, Western Highlands',
                    'nationality'       => 'Papua New Guinean',
                    'civil_status'      => 'Single',
                    'religion'          => 'Catholic',
                    'gender'            => 'Female',
                    'present_address'   => 'Boroko, NCD',
                    'home_address'      => 'Boroko, NCD',
                    'email_address'     => 'sarah.mondo@gmail.com',
                    'mobile_number'     => '+675 7456 7804',
                    'dependents'        => 0,
                    'lodged'            => 'No',
                    'emergency_contact' => 'Tom Mondo',
                    'emergency_number'  => '+675 7456 7900',
                ],
                'account' => [
                    'nasfund'             => true,
                    'nasfund_number'      => 'NF-100005',
                    'tin_number'          => 'TIN-201-005',
                    'work_permit_number'  => 'WP-LOCAL-005',
                    'work_permit_expiry'  => '2026-12-31',
                    'visa_number'         => 'VS-LOCAL-005',
                    'visa_expiry'         => '2026-12-31',
                    'bsb_code'            => '088-001',
                    'bank_name'           => 'BSP Bank',
                    'account_number'      => '1000100005',
                    'account_name'        => 'Sarah W Mondo',
                ],
                'deminimis' => [
                    ['type' => 'rice',     'amount' => 100.00],
                    ['type' => 'meal',     'amount' => 80.00],
                    ['type' => 'clothing', 'amount' => 150.00],
                ],
                'leave_credits' => [
                    ['leave_type_id' => 1, 'total_days' => 14, 'used_days' => 4, 'remaining_days' => 10],
                    ['leave_type_id' => 2, 'total_days' => 10, 'used_days' => 0, 'remaining_days' => 10],
                    ['leave_type_id' => 3, 'total_days' => 3,  'used_days' => 0, 'remaining_days' => 3],
                ],
            ],

            /*
            | ── 6 ── Finance ───────────────────────────────────────────────
            */
            [
                'employee' => [
                    'biometric_id'    => 'BIO-006',
                    'employee_number' => 'EMP-2024-006',
                    'first_name'      => 'Linda',
                    'middle_name'     => 'Kenu',
                    'last_name'       => 'Bosip',
                    'profile_picture' => 'default.png',
                    'qr_code'         => 'QR-BIO-006',
                    'shift_id'        => 1,
                ],
                'employment' => [
                    'department_id'             => 3,
                    'position'                  => 'Accountant',
                    'department_head'           => 'Chris Kaupa',
                    'supervisor'                => 'Sarah Mondo',
                    'job_location'              => 'Port Moresby',
                    'employee_type'             => 'Full-Time',
                    'employment_status'         => 'Active',
                    'employment_classification' => 1,
                    'company_email'             => 'l.bosip@company.com.pg',
                    'rate'                      => 1300.00,
                    'rate_type'                 => 'Fortnightly',
                    'date_started'              => '2022-04-04',
                    'date_ended'                => '2026-04-03',
                ],
                'personal' => [
                    'birthdate'         => '1990-10-19',
                    'age'               => 34,
                    'birthplace'        => 'Daru, Western Province',
                    'nationality'       => 'Papua New Guinean',
                    'civil_status'      => 'Married',
                    'religion'          => 'Catholic',
                    'gender'            => 'Female',
                    'present_address'   => 'Waigani, NCD',
                    'home_address'      => 'Waigani, NCD',
                    'email_address'     => 'linda.bosip@gmail.com',
                    'mobile_number'     => '+675 7012 3410',
                    'dependents'        => 2,
                    'lodged'            => 'No',
                    'emergency_contact' => 'Paul Bosip',
                    'emergency_number'  => '+675 7012 3500',
                ],
                'account' => [
                    'nasfund'             => true,
                    'nasfund_number'      => 'NF-100006',
                    'tin_number'          => 'TIN-201-006',
                    'work_permit_number'  => 'WP-LOCAL-006',
                    'work_permit_expiry'  => '2026-12-31',
                    'visa_number'         => 'VS-LOCAL-006',
                    'visa_expiry'         => '2026-12-31',
                    'bsb_code'            => '088-001',
                    'bank_name'           => 'BSP Bank',
                    'account_number'      => '1000100006',
                    'account_name'        => 'Linda K Bosip',
                ],
                'deminimis' => [
                    ['type' => 'rice',     'amount' => 100.00],
                    ['type' => 'meal',     'amount' => 80.00],
                    ['type' => 'clothing', 'amount' => 150.00],
                ],
                'leave_credits' => [
                    ['leave_type_id' => 1, 'total_days' => 14, 'used_days' => 3, 'remaining_days' => 11],
                    ['leave_type_id' => 2, 'total_days' => 10, 'used_days' => 2, 'remaining_days' => 8],
                    ['leave_type_id' => 3, 'total_days' => 3,  'used_days' => 0, 'remaining_days' => 3],
                ],
            ],

            /*
            | ── 7 ── Operations ────────────────────────────────────────────
            */
            [
                'employee' => [
                    'biometric_id'    => 'BIO-007',
                    'employee_number' => 'EMP-2024-007',
                    'first_name'      => 'David',
                    'middle_name'     => 'Peni',
                    'last_name'       => 'Aihi',
                    'profile_picture' => 'default.png',
                    'qr_code'         => 'QR-BIO-007',
                    'shift_id'        => 2,
                ],
                'employment' => [
                    'department_id'             => 4,
                    'position'                  => 'Operations Supervisor',
                    'department_head'           => 'Robert Teine',
                    'supervisor'                => 'Robert Teine',
                    'job_location'              => 'Lae, Morobe',
                    'employee_type'             => 'Full-Time',
                    'employment_status'         => 'Active',
                    'employment_classification' => 1,
                    'company_email'             => 'd.aihi@company.com.pg',
                    'rate'                      => 1150.00,
                    'rate_type'                 => 'Fortnightly',
                    'date_started'              => '2021-05-10',
                    'date_ended'                => '2026-05-09',
                ],
                'personal' => [
                    'birthdate'         => '1986-04-17',
                    'age'               => 38,
                    'birthplace'        => 'Wewak, East Sepik',
                    'nationality'       => 'Papua New Guinean',
                    'civil_status'      => 'Married',
                    'religion'          => 'Lutheran',
                    'gender'            => 'Male',
                    'present_address'   => 'Eriku, Lae',
                    'home_address'      => 'Eriku, Lae',
                    'email_address'     => 'david.aihi@gmail.com',
                    'mobile_number'     => '+675 7567 8905',
                    'dependents'        => 3,
                    'lodged'            => 'Company House',
                    'emergency_contact' => 'Paul Aihi',
                    'emergency_number'  => '+675 7567 9000',
                ],
                'account' => [
                    'nasfund'             => true,
                    'nasfund_number'      => 'NF-100007',
                    'tin_number'          => 'TIN-201-007',
                    'work_permit_number'  => 'WP-LOCAL-007',
                    'work_permit_expiry'  => '2026-12-31',
                    'visa_number'         => 'VS-LOCAL-007',
                    'visa_expiry'         => '2026-12-31',
                    'bsb_code'            => '055-001',
                    'bank_name'           => 'Kina Bank',
                    'account_number'      => '2000200007',
                    'account_name'        => 'David P Aihi',
                ],
                'deminimis' => [
                    ['type' => 'rice',     'amount' => 100.00],
                    ['type' => 'meal',     'amount' => 80.00],
                    ['type' => 'clothing', 'amount' => 150.00],
                ],
                'leave_credits' => [
                    ['leave_type_id' => 1, 'total_days' => 14, 'used_days' => 6, 'remaining_days' => 8],
                    ['leave_type_id' => 2, 'total_days' => 10, 'used_days' => 2, 'remaining_days' => 8],
                    ['leave_type_id' => 3, 'total_days' => 3,  'used_days' => 0, 'remaining_days' => 3],
                ],
            ],

            /*
            | ── 8 ── Operations ────────────────────────────────────────────
            */
            [
                'employee' => [
                    'biometric_id'    => 'BIO-008',
                    'employee_number' => 'EMP-2024-008',
                    'first_name'      => 'Joseph',
                    'middle_name'     => 'Lavu',
                    'last_name'       => 'Opa',
                    'profile_picture' => 'default.png',
                    'qr_code'         => 'QR-BIO-008',
                    'shift_id'        => 2,
                ],
                'employment' => [
                    'department_id'             => 4,
                    'position'                  => 'Plant Operator',
                    'department_head'           => 'Robert Teine',
                    'supervisor'                => 'David Aihi',
                    'job_location'              => 'Lae, Morobe',
                    'employee_type'             => 'Full-Time',
                    'employment_status'         => 'Active',
                    'employment_classification' => 2,
                    'company_email'             => 'j.opa@company.com.pg',
                    'rate'                      => 900.00,
                    'rate_type'                 => 'Fortnightly',
                    'date_started'              => '2024-01-08',
                    'date_ended'                => '2026-01-07',
                ],
                'personal' => [
                    'birthdate'         => '1998-07-22',
                    'age'               => 26,
                    'birthplace'        => 'Kimbe, West New Britain',
                    'nationality'       => 'Papua New Guinean',
                    'civil_status'      => 'Single',
                    'religion'          => 'Catholic',
                    'gender'            => 'Male',
                    'present_address'   => 'Bumbu, Lae',
                    'home_address'      => 'Bumbu, Lae',
                    'email_address'     => 'joseph.opa@gmail.com',
                    'mobile_number'     => '+675 7789 0107',
                    'dependents'        => 1,
                    'lodged'            => 'Company House',
                    'emergency_contact' => 'Mary Opa',
                    'emergency_number'  => '+675 7789 0200',
                ],
                'account' => [
                    'nasfund'             => true,
                    'nasfund_number'      => 'NF-100008',
                    'tin_number'          => 'TIN-201-008',
                    'work_permit_number'  => 'WP-LOCAL-008',
                    'work_permit_expiry'  => '2026-12-31',
                    'visa_number'         => 'VS-LOCAL-008',
                    'visa_expiry'         => '2026-12-31',
                    'bsb_code'            => '055-001',
                    'bank_name'           => 'Kina Bank',
                    'account_number'      => '2000200008',
                    'account_name'        => 'Joseph L Opa',
                ],
                'deminimis' => [
                    ['type' => 'rice',     'amount' => 100.00],
                    ['type' => 'meal',     'amount' => 80.00],
                    ['type' => 'clothing', 'amount' => 150.00],
                ],
                'leave_credits' => [
                    ['leave_type_id' => 1, 'total_days' => 7,  'used_days' => 0, 'remaining_days' => 7],
                    ['leave_type_id' => 2, 'total_days' => 5,  'used_days' => 0, 'remaining_days' => 5],
                    ['leave_type_id' => 3, 'total_days' => 3,  'used_days' => 0, 'remaining_days' => 3],
                ],
            ],

            /*
            | ── 9 ── Operations ────────────────────────────────────────────
            */
            [
                'employee' => [
                    'biometric_id'    => 'BIO-009',
                    'employee_number' => 'EMP-2024-009',
                    'first_name'      => 'Andrew',
                    'middle_name'     => 'Mana',
                    'last_name'       => 'Silas',
                    'profile_picture' => 'default.png',
                    'qr_code'         => 'QR-BIO-009',
                    'shift_id'        => 2,
                ],
                'employment' => [
                    'department_id'             => 4,
                    'position'                  => 'Machine Operator',
                    'department_head'           => 'Robert Teine',
                    'supervisor'                => 'David Aihi',
                    'job_location'              => 'Port Moresby',
                    'employee_type'             => 'Full-Time',
                    'employment_status'         => 'Active',
                    'employment_classification' => 1,
                    'company_email'             => 'a.silas@company.com.pg',
                    'rate'                      => 780.00,
                    'rate_type'                 => 'Fortnightly',
                    'date_started'              => '2021-08-23',
                    'date_ended'                => '2026-08-22',
                ],
                'personal' => [
                    'birthdate'         => '1987-09-05',
                    'age'               => 37,
                    'birthplace'        => 'Mendi, Southern Highlands',
                    'nationality'       => 'Papua New Guinean',
                    'civil_status'      => 'Married',
                    'religion'          => 'Evangelical',
                    'gender'            => 'Male',
                    'present_address'   => 'Gordons, NCD',
                    'home_address'      => 'Gordons, NCD',
                    'email_address'     => 'andrew.silas@gmail.com',
                    'mobile_number'     => '+675 7901 2309',
                    'dependents'        => 5,
                    'lodged'            => 'No',
                    'emergency_contact' => 'Ruth Silas',
                    'emergency_number'  => '+675 7901 2400',
                ],
                'account' => [
                    'nasfund'             => true,
                    'nasfund_number'      => 'NF-100009',
                    'tin_number'          => 'TIN-201-009',
                    'work_permit_number'  => 'WP-LOCAL-009',
                    'work_permit_expiry'  => '2026-12-31',
                    'visa_number'         => 'VS-LOCAL-009',
                    'visa_expiry'         => '2026-12-31',
                    'bsb_code'            => '088-001',
                    'bank_name'           => 'BSP Bank',
                    'account_number'      => '1000100009',
                    'account_name'        => 'Andrew M Silas',
                ],
                'deminimis' => [
                    ['type' => 'rice',     'amount' => 100.00],
                    ['type' => 'meal',     'amount' => 80.00],
                    ['type' => 'clothing', 'amount' => 150.00],
                ],
                'leave_credits' => [
                    ['leave_type_id' => 1, 'total_days' => 14, 'used_days' => 6, 'remaining_days' => 8],
                    ['leave_type_id' => 2, 'total_days' => 10, 'used_days' => 5, 'remaining_days' => 5],
                    ['leave_type_id' => 3, 'total_days' => 3,  'used_days' => 1, 'remaining_days' => 2],
                ],
            ],

            /*
            | ── 10 ── Operations ───────────────────────────────────────────
            */
            [
                'employee' => [
                    'biometric_id'    => 'BIO-010',
                    'employee_number' => 'EMP-2024-010',
                    'first_name'      => 'Rachel',
                    'middle_name'     => 'Wagi',
                    'last_name'       => 'Kona',
                    'profile_picture' => 'default.png',
                    'qr_code'         => 'QR-BIO-010',
                    'shift_id'        => 1,
                ],
                'employment' => [
                    'department_id'             => 4,
                    'position'                  => 'Quality Controller',
                    'department_head'           => 'Robert Teine',
                    'supervisor'                => 'David Aihi',
                    'job_location'              => 'Port Moresby',
                    'employee_type'             => 'Full-Time',
                    'employment_status'         => 'Active',
                    'employment_classification' => 3,
                    'company_email'             => 'r.kona@company.com.pg',
                    'rate'                      => 850.00,
                    'rate_type'                 => 'Fortnightly',
                    'date_started'              => '2024-06-01',
                    'date_ended'                => '2025-05-31',
                ],
                'personal' => [
                    'birthdate'         => '1991-12-03',
                    'age'               => 33,
                    'birthplace'        => 'Popondetta, Oro Province',
                    'nationality'       => 'Papua New Guinean',
                    'civil_status'      => 'Married',
                    'religion'          => 'Anglican',
                    'gender'            => 'Female',
                    'present_address'   => 'Hohola, NCD',
                    'home_address'      => 'Hohola, NCD',
                    'email_address'     => 'rachel.kona@gmail.com',
                    'mobile_number'     => '+675 7678 9006',
                    'dependents'        => 2,
                    'lodged'            => 'No',
                    'emergency_contact' => 'Kevin Kona',
                    'emergency_number'  => '+675 7678 9100',
                ],
                'account' => [
                    'nasfund'             => true,
                    'nasfund_number'      => 'NF-100010',
                    'tin_number'          => 'TIN-201-010',
                    'work_permit_number'  => 'WP-LOCAL-010',
                    'work_permit_expiry'  => '2026-12-31',
                    'visa_number'         => 'VS-LOCAL-010',
                    'visa_expiry'         => '2026-12-31',
                    'bsb_code'            => '088-001',
                    'bank_name'           => 'BSP Bank',
                    'account_number'      => '1000100010',
                    'account_name'        => 'Rachel W Kona',
                ],
                'deminimis' => [
                    ['type' => 'rice',     'amount' => 100.00],
                    ['type' => 'meal',     'amount' => 80.00],
                    ['type' => 'clothing', 'amount' => 150.00],
                ],
                'leave_credits' => [
                    ['leave_type_id' => 1, 'total_days' => 7,  'used_days' => 0, 'remaining_days' => 7],
                    ['leave_type_id' => 2, 'total_days' => 5,  'used_days' => 1, 'remaining_days' => 4],
                    ['leave_type_id' => 3, 'total_days' => 3,  'used_days' => 0, 'remaining_days' => 3],
                ],
            ],

        ];

        $year = now()->year;

        foreach ($employees as $data) {

            // ── Skip if already seeded ─────────────────────────────────────
            $existing = DB::table('employees')
                ->where('biometric_id', $data['employee']['biometric_id'])
                ->first();

            if ($existing) {
                continue;
            }

            // ── employees ──────────────────────────────────────────────────
            $employeeId = DB::table('employees')->insertGetId(array_merge(
                $data['employee'],
                ['created_at' => now(), 'updated_at' => now()]
            ));

            // ── employment_information ─────────────────────────────────────
            DB::table('employment_information')->insertOrIgnore(array_merge(
                $data['employment'],
                ['employee_id' => $employeeId, 'created_at' => now(), 'updated_at' => now()]
            ));

            // ── personal_information ───────────────────────────────────────
            DB::table('personal_information')->insertOrIgnore(array_merge(
                $data['personal'],
                ['employee_id' => $employeeId, 'created_at' => now(), 'updated_at' => now()]
            ));

            // ── account_information ────────────────────────────────────────
            DB::table('account_information')->insertOrIgnore(array_merge(
                $data['account'],
                ['employee_id' => $employeeId, 'created_at' => now(), 'updated_at' => now()]
            ));

            // ── deminimis ──────────────────────────────────────────────────
            foreach ($data['deminimis'] as $allowance) {
                DB::table('deminimis')->insertOrIgnore(array_merge(
                    $allowance,
                    ['employee_id' => $employeeId, 'created_at' => now(), 'updated_at' => now()]
                ));
            }

            // ── leave_credit_details ───────────────────────────────────────
            foreach ($data['leave_credits'] as $credit) {
                DB::table('leave_credit_details')->insertOrIgnore(array_merge(
                    $credit,
                    ['employee_id' => $employeeId, 'year' => $year, 'created_at' => now(), 'updated_at' => now()]
                ));
            }
        }
    }
}