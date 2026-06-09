<?php

namespace App\Http\Controllers\AIMS;

use App\Http\Controllers\Controller;
use App\Models\AIMS\PaymentTerm;
use Illuminate\Http\Request;


class PaymentTermController extends Controller
{
    public function index()
    {
        $paymentTerms = PaymentTerm::all();

        return response()->json([
            'success' => true,
            'data' => $paymentTerms
        ]);
    }
}
