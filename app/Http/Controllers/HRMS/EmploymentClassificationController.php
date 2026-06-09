<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use App\Models\HRMS\EmploymentClassification;
use Illuminate\Http\Request;

class EmploymentClassificationController extends Controller
{
    public function index()
    {
        return response()->json(
            EmploymentClassification::orderBy('name')->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:employment_classifications,name'
        ]);

        return EmploymentClassification::create($request->all());
    }

    public function show($id)
    {
        return EmploymentClassification::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $classification = EmploymentClassification::findOrFail($id);

        $request->validate([
            'name' => 'required|string|unique:employment_classifications,name,' . $id
        ]);

        $classification->update($request->all());

        return $classification;
    }

    public function destroy($id)
    {
        EmploymentClassification::destroy($id);

        return response()->json(['message' => 'Deleted successfully']);
    }
}
