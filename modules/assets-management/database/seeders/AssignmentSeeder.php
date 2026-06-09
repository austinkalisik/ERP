<?php

namespace Database\Seeders;

use App\Models\Assignment;
use App\Models\Department;
use App\Models\Item;
use App\Models\Receiver;
use App\Models\User;
use Illuminate\Database\Seeder;

class AssignmentSeeder extends Seeder
{
    public function run(): void
    {
        $item = Item::where('asset_tag', 'NGA-0003')->first();
        $user = User::where('email', 'support@nextgen.local')->first();
        $department = Department::where('name', 'Networking')->first();

        if ($item && $user && $department) {
            $receiver = Receiver::updateOrCreate(
                [
                    'department_id' => $department->id,
                    'name' => $user->name,
                ],
                [
                    'email' => $user->email,
                    'is_active' => true,
                ]
            );

            Assignment::updateOrCreate(
                [
                    'item_id' => $item->id,
                    'user_id' => $user->id,
                    'department_id' => $department->id,
                ],
                [
                    'receiver_id' => $receiver->id,
                    'receiver_name' => $receiver->name,
                    'assigned_at' => now()->subDays(7),
                    'returned_at' => null,
                ]
            );
        }
    }
}
