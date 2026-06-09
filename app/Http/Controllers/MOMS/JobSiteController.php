<?php

namespace App\Http\Controllers\MOMS;

use App\Http\Controllers\Controller;
use App\Models\MOMS\JobSite;
use Illuminate\Http\Request;

class JobSiteController extends Controller
{
    /**
     * Display a listing of job sites
     */
    public function index()
    {
        $jobSites = JobSite::where('status', 'Active')
            ->orderBy('name', 'asc')
            ->get();
        
        return response()->json($jobSites);
    }

    /**
     * Store a newly created job site
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:job_sites,name|max:255',
            'location' => 'nullable|string|max:255',
            'code' => 'nullable|string|unique:job_sites,code|max:50',
            'description' => 'nullable|string',
            'status' => 'required|in:Active,Inactive,Completed',
        ]);

        $jobSite = JobSite::create($validated);

        return response()->json([
            'message' => 'Job site created successfully',
            'data' => $jobSite,
        ], 201);
    }

    /**
     * Display the specified job site
     */
    public function show($id)
    {
        $jobSite = JobSite::findOrFail($id);
        
        return response()->json($jobSite);
    }

    /**
     * Update the specified job site
     */
    public function update(Request $request, $id)
    {
        $jobSite = JobSite::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|unique:job_sites,name,' . $id . '|max:255',
            'location' => 'nullable|string|max:255',
            'code' => 'nullable|string|unique:job_sites,code,' . $id . '|max:50',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:Active,Inactive,Completed',
        ]);

        $jobSite->update($validated);

        return response()->json([
            'message' => 'Job site updated successfully',
            'data' => $jobSite,
        ]);
    }

    /**
     * Remove the specified job site
     */
    public function destroy($id)
    {
        $jobSite = JobSite::findOrFail($id);
        $jobSite->delete();

        return response()->json([
            'message' => 'Job site deleted successfully',
        ]);
    }
}