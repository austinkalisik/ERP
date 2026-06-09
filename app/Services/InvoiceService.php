<?php


namespace App\Services;

use App\Models\AIMS\Invoice;
use App\Models\AIMS\PaymentTerm;
use App\Models\AIMS\Subledger;
use App\Models\AIMS\RequestOrder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InvoiceService
{
    public function store(array $data): Invoice
    {
        return DB::transaction(function () use ($data) {

            // Fetch the PO based on the provided PO number
            $po = RequestOrder::with('items')
                ->where('po_number', $data['po_number'])
                ->firstOrFail();

    
            // Initialize the total amount
            $subtotalinv = 0;
            $total = 0;
            $discountTotal =0;
            $taxTotal =0;



            //Duedate

            $invoiceDate = Carbon::parse($data['invoice_date']);

            $paymentTerm = PaymentTerm::find($data['payment_term_id']);

            $dueDate = $paymentTerm 
            ? $invoiceDate->copy()->addDays($paymentTerm->days) 
            : $invoiceDate->copy();

            // Create the invoice first (without items)
            $invoice = Invoice::create([
                'invoice_number' => $data['invoice_number'],
                'po_number' => $data['po_number'],
                'request_order_id' => $data['request_order_id'],
                'invoice_date' => $data['invoice_date'],
                'due_date' => $dueDate,
                'payment_term_id' => $data['payment_term_id'],
                'supplier_id' => $data['supplier_id'],
                'remarks' => $data['remarks'] ?? null,
                'subtotal_amount'  => $subtotal ?? 0,   // sum of all line items before tax/discount
                'tax_amount'       => $taxTotal ?? 0,   // total tax for invoice
                'discount_amount'  => $discountTotal ?? 0, // total discount for invoice
                'total_amount'     => $total ?? 0,      // subtotal + tax - discount
            ]);

            // Prepare the items array for saving
            $invoiceItems = [];

            foreach ($data['items'] as $item) {
                // Find the related PO item
                $poItem = $po->items()->where('item_id', $item['request_order_item_id'])->firstOrFail();

             $pox = RequestOrder::with('items')->where('po_number', $data['po_number'])->get();
       
             $poItemQty = $pox->flatMap->items->where('item_id',$item['request_order_item_id'])->sum('quantity');

                // Get the total quantity of the item in the PO (sum across all items)
               // $poItemQty = $po->flatMap->items->where('item_id', $item['item_id'])->sum('quantity');

                // Get already invoiced quantity (sum across all previous invoices)
                $alreadyInvoiced = Invoice::with('items')
                    ->where('po_number', $data['po_number'])
                    ->where('status', '!=', 'cancelled')
                    ->get()
                    ->flatMap->items
                    ->where('request_order_item_id', $item['request_order_item_id'])
                    ->sum('quantity');

                // Remaining quantity in PO
                $remainingQty = $poItemQty - $alreadyInvoiced;

                // Check if the quantity in the invoice exceeds the remaining quantity
                if ($item['quantity'] > $remainingQty) {
                    throw new \Exception("Quantity exceeds remaining PO quantity for item ID: {$item['request_order_item_id']}");
                }

                        // Price match check
              /*   if (bccomp($item['unit_price'], $poItem->unit_cost, 2) !== 0) {
                throw new \Exception("Invoice item price ({$item['unit_price']}) does not match PO price ({$poItem->unit_cost}) for item ID {$poItem->id}.");
                } */

                // Calculate subtotal for this item
                $subtotalline = ($item['quantity'] * $item['unit_price'])  - ($item['discount'] ?? 0)
                                + ($item['tax'] ?? 0);

                $subtotal=$item['quantity'] * $item['unit_price'];

                // Add the item to the invoice
                $invoiceItems[] = [
                    'request_order_item_id' => $poItem->id,
                    'gl_account_id'=> 16, //5020 -Machine Maintenace - Consumables
                    'description'=>'Invoice line items',
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount' => $item['discount'] ?? 0,
                    'tax' => $item['tax'] ?? 0,
                    'subtotal' => $subtotalline,
                ];

                // Add to the total amount of the invoice
                $subtotalinv += $subtotal;
                $total += $subtotalline;
                $discountTotal +=$item['discount'] ??0;
                $taxTotal +=$item['tax']??0 ;
            }

            // Create the invoice items
            foreach ($invoiceItems as $item) {
                $invoice->items()->create($item);
            }

            // Update the invoice total
            $invoice->update(['total_amount' => $total, 'subtotal_amount'=> $subtotalinv, 'discount_amount'=>$discountTotal, 'tax_amount'=> $taxTotal]);

      
             return $invoice->load('items');
        });
    }
}
