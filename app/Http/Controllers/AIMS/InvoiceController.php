<?php



namespace App\Http\Controllers\AIMS;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvoiceRequest;
use App\Models\AIMS\GlAccount;

use App\Models\AIMS\Invoice;
use App\Models\AIMS\InvoiceItem;
use App\Models\AIMS\JournalEntry;
use App\Models\AIMS\JournalEntryLine;
use App\Models\AIMS\RequestOrder;
use App\Models\AIMS\RequestOrderItem;
use App\Models\AIMS\Subledger;
use App\Models\AIMS\SubledgerItem;
use App\Models\AIMS\GeneralLedger;
use App\Models\AIMS\InvoiceApproval;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use SebastianBergmann\Environment\Console;



class InvoiceController extends Controller
{

    protected $service;

    public function __construct(InvoiceService $service)
    {
        $this->service = $service;
    }

    /**
     * Display a listing of the resource.
     */


    public function index()
    {
         return response()->json([
            'data' => Invoice::with('supplier','items.requestOrderItem')
            ->orderBy('created_at', 'desc')
            ->get()
            
        ]);


    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreInvoiceRequest $request)
    {

     $invoice = $this->service->store($request->validated());

        return response()->json([
            'message' => 'Invoice created successfully',
            'data' => $invoice
        ], 201);

    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
           $invoice = Invoice::with([
            'supplier',
            'items.requestOrderItem','items.ItemsInfo'
        ])->findOrFail($id);

        return response()->json([
            'data' => $invoice
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    public function cancel($id)
    {
        $invoice = Invoice::findOrFail($id);

        $invoice->update([
            'status' => 'cancelled',
            'cancelled_by' => auth('sanctum')->user()->id,
            'cancelled_at' => now()
        ]);

        InvoiceApproval::create([
        'invoice_id' => $invoice->id,
        'user_id' =>auth('sanctum')->user()->id,
        'action' => InvoiceApproval::ACTION_CANCELLED,
        'remarks' => 'Cancelled by finance',
         ]);

        return response()->json(['message' => 'Invoice cancelled']);
    }

    public function approve($id)
    {
        $invoice = Invoice::with('items')->findOrFail($id);

        //  duplicate approval
        if ($invoice->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending invoices can be approved.'
            ], 400);
        }

        DB::beginTransaction();

        try {
            // 1. Update invoice status
            $invoice->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => auth('sanctum')->user()->id,
            ]);

           

            InvoiceApproval::create([
            'invoice_id' => $invoice->id,
            'user_id' => auth('sanctum')->user()->id,
            'action' =>InvoiceApproval::ACTION_APPROVED,
            'remarks' => 'Looks good'
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Invoice approved successfully',
                'invoice' => $invoice,
                //'subledger' => $subledger
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Approval failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function post(Invoice $invoice)
    {
        return DB::transaction(function () use ($invoice) {

            if ($invoice->status !== 'approved') {
                throw new \Exception("Invoice must be approved before posting.");
            }

            // Create subledger for invoice
            $subledger = new Subledger([
                'subledger_number' => 'SL-' . Str::upper(Str::random(8)),
                'entry_date' => now(),

                'subtotal_amount' => $invoice->subtotal_amount,
                'tax_amount' => $invoice->tax_amount ?? 0,
                'discount_amount' => $invoice->discount_amount ?? 0,
                'total_amount' => $invoice->total_amount,
                'remarks' => 'Auto-generated from Invoice post',
                'supplier_id' => $invoice->supplier_id,
            ]);

            // Polymorphic relation
            $subledger->transactionable()->associate($invoice);
            $subledger->save();
            
 

            // Create subledger items
           foreach ($invoice->items as $item) {
            
            // Create subledger line item for invoice item
            $subledgerItem = new SubledgerItem();
            $subledgerItem->subledger_id = $subledger->id;
            $subledgerItem->quantity = $item->quantity;
            $subledgerItem->unit_amount = $item->unit_price;
            $subledgerItem->discount = $item->discount ?? 0;
            $subledgerItem->tax = $item->tax ?? 0;
            $subledgerItem->subtotal = ($item->quantity * $item->unit_price)
                                    - ($item->discount ?? 0)
                                    + ($item->tax ?? 0);

            // Optional: link to GL account if available
            $subledgerItem->gl_account_id = $item->gl_account_id ?? null;

            // Polymorphic association to invoice item
            $subledgerItem->transactionItemable()->associate($item);
            $subledgerItem->save();

            }

            // Create Journal Entry
            $journal = JournalEntry::create([
                'reference_no' => $invoice->invoice_number,
                'entry_date'   => $invoice->invoice_date,
                'description'  => 'AP Invoice Posting',
                'created_by'   => auth('sanctum')->user()->id,
            ]);

            // 🔹 CREDIT: Accounts Payable (assume GL code = 2100)
            $apAccount = GlAccount::where('gl_code', '2100')->first();

            JournalEntryLine::create([
                'journal_entry_id' => $journal->id,
                'gl_account_id' => $apAccount->id,
                'debit' => 0,
                'credit' => $invoice->total_amount,
            ]);

            // 🔹 DEBIT: Expense accounts per item
            foreach ($invoice->items as $item) {

                // Example: map item → GL (you can improve this mapping)
                $expenseAccount = GlAccount::where('gl_code', '5020')->first();

                // 1. Expense line (without tax)
                JournalEntryLine::create([
                    'journal_entry_id' => $journal->id,
                    'gl_account_id' => $expenseAccount->id,
                    'debit' =>$item->quantity * $item->unit_price,
                    'credit' => 0,
                ]);


                // 2. Tax line (separate line)
                if (($item->tax ?? 0) > 0) {
                    JournalEntryLine::create([
                        'journal_entry_id' => $journal->id,
                        'gl_account_id' => 26, // GL account for input vat tax
                        'debit' => $item->tax,
                        'credit' => 0,
                        'remarks' => 'Tax for ' . $item->description,
                    ]);
                }
            }


            $totalCredit = 0;

              foreach ($invoice->items as $item) {
                // Debit per invoice item GL account

                       // Example: map item → GL (you can improve this mapping)
                $expenseAccount = GlAccount::where('gl_code', '5020')->first();

                GeneralLedger::create([
                    'gl_id' => $expenseAccount->id, // item-specific GL code
                    'entry_date' => $invoice->invoice_date,
                    'reference_type' => 'Invoice',
                    'reference_id' => $invoice->id,
                    'debit' => $item->quantity * $item->unit_price,
                    'supplier_id'=>$invoice->supplier_id,
                    'credit' => 0,
                    'description' => "Debit for invoice item {$item->id} ({$item->request_order_item_id})"
                ]);

                $totalCredit += $item->quantity * $item->unit_price;
            }

            // Single credit to Accounts Payable
            $apAccount = GlAccount::where('gl_code', '2100')->first();

            GeneralLedger::create([
                'gl_id' => $apAccount->id, // Accounts Payable GL code
                'entry_date' => $invoice->invoice_date,
                'reference_type' => 'Invoice',
                'reference_id' => $invoice->id,
                'debit' => 0,
                'credit' => $totalCredit,
                'description' => "Credit Accounts Payable for invoice {$invoice->invoice_number}"
            ]);


                //
                  $invoice->update([
                'status' => 'posted', 
                 ]);



           // return $journal;
            return response()->json(['message' => 'Invoice posted to GL successfully.']);
        });
    }
}
