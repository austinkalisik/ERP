<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
      public function rules()
    {
        return [
          'invoice_number'   => 'required|unique:invoices,invoice_number',
    'po_number'        => 'required|string|max:255',
    'request_order_id' => 'required|exists:request_orders,id',
    'invoice_date'     => 'required|date',
    'supplier_id'      => 'required|exists:suppliers,id',
    'remarks'          => 'nullable|string',
    'due_date' => 'nullable|date|after_or_equal:invoice_date',
    'payment_term_id' => 'nullable|exists:payment_terms,id',

    
    'items'                => 'required|array|min:1',
    'items.*.request_order_item_id' => ['required', 'distinct'],
    'items.*.description'  => ['nullable', 'string'],
    'items.*.quantity'     => ['required', 'integer', 'min:1'],
    'items.*.unit_price'   => ['required', 'numeric', 'min:0'],
    'items.*.discount'     => ['nullable', 'numeric', 'min:0'],
    'items.*.tax'          => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages()
    {
        return [
            'items.*.item_id.required' => 'Select item from the list.',
            'items.*.item_id.distinct' => 'The item has already been added to this list.',
        ];
    }
}