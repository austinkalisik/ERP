<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    protected function currentUserPayload($user): array
    {
        return array_merge($user->fresh()->toArray(), [
            'is_impersonating' => session()->has('impersonator_id'),
            'impersonator_id' => session('impersonator_id'),
        ]);
    }

    public function apiMe(Request $request)
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json($this->currentUserPayload($user));
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'current_password' => ['nullable', 'string'],
            'password' => ['nullable', 'confirmed', Password::min(6)],
            'profile_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if (! empty($validated['password'])) {
            if (empty($validated['current_password']) || ! Hash::check($validated['current_password'], $user->password)) {
                return response()->json(['message' => 'Current password is incorrect.'], 422);
            }

            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        unset($validated['current_password']);

        if (($validated['email'] ?? null) !== $user->email) {
            $validated['email_verified_at'] = null;
        }

        if ($request->hasFile('profile_photo')) {
            if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
                Storage::disk('public')->delete($user->profile_photo);
            }

            $validated['profile_photo'] = $request->file('profile_photo')->store('profile-photos', 'public');
        }

        $user->update($validated);

        if (! $request->expectsJson() && ! $request->is('api/*')) {
            return redirect()->route('profile.edit')->with('status', 'profile-updated');
        }

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $this->currentUserPayload($user),
        ]);
    }

    public function destroy(Request $request)
    {
        $request->validateWithBag('userDeletion', [
            'password' => ['required', 'current_password'],
        ]);

        $user = Auth::user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    public function deletePhoto()
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
            Storage::disk('public')->delete($user->profile_photo);
        }

        $user->update([
            'profile_photo' => null,
        ]);

        return response()->json([
            'message' => 'Profile photo deleted successfully.',
            'user' => $this->currentUserPayload($user),
        ]);
    }

    public function showPhoto(User $user)
    {
        if (! $user->profile_photo || ! Storage::disk('public')->exists($user->profile_photo)) {
            abort(404);
        }

        $path = Storage::disk('public')->path($user->profile_photo);
        $mime = mime_content_type($path) ?: 'application/octet-stream';

        return response()->file($path, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
