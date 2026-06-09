<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class LocationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'building' => fake()->randomElement(['Main Tower', 'Training Block', 'Warehouse']),
            'floor' => fake()->randomElement(['Ground', 'Level 1', 'Level 2']),
            'room' => fake()->bothify('Room ##'),
            'zone' => fake()->randomElement(['Public', 'IT', 'Mechanical', 'Perimeter']),
        ];
    }
}
