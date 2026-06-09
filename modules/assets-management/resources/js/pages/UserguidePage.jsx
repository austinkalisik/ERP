import React from 'react';

const setupSteps = [
    ['Create categories', 'Add groups such as Laptops, Printers, Networking, Accessories, Furniture, or Consumables.'],
    ['Create suppliers', 'Add the companies or people who provide your assets and stock.'],
    ['Add inventory', 'Register each asset or bulk item with its name, category, supplier, quantity, and cost.'],
    ['Create departments', 'Add the business areas that receive assets, such as IT, HR, Finance, or Operations.'],
    ['Create receivers', 'Add the staff or teams who will receive assets. Each receiver belongs to a department.'],
    ['Assign and return assets', 'Issue items from inventory, then mark them returned when they come back.'],
];

const inventoryFormRows = [
    ['Tracking Mode', 'Choose Bulk stock for many units in one row. Choose Serialized asset for one unique asset with a serial number.'],
    ['Name', 'The main item name. Example: Dell Latitude 5440, Cisco Catalyst 9200, HP Printer.'],
    ['Brand', 'The manufacturer or product brand. Example: Dell, HP, Cisco.'],
    ['SKU / Bulk Item Code', 'A product or stock code. This is useful for bulk items and supplier codes. It is not the asset tag.'],
    ['Description', 'Extra notes about the item, model, specification, or condition.'],
    ['Initial Quantity', 'The starting stock count. Assignments reduce this number. Returns increase it again.'],
    ['Unit of Measurement', 'The word shown beside quantity. Example: unit, box, roll, set, pack.'],
    ['Reorder Level', 'The minimum level before the system marks the item as Low Stock. Example: 5.'],
    ['Unit Cost', 'The cost for one unit. This helps reports and depreciation calculations.'],
    ['Lifecycle Status', 'Available means it can be assigned. Maintenance, Lost, and Retired stop normal issuing.'],
    ['Depreciation', 'Turn this on only for fixed assets that lose value over time, such as laptops or printers.'],
    ['Category', 'The group this item belongs to. This helps filtering and reporting.'],
    ['Supplier', 'The vendor or source of the item. This connects inventory to procurement records.'],
    ['Asset Tag', 'Your internal tracking number for a physical asset. Example: NGA-0001.'],
    ['Location', 'Where the item is stored or normally used.'],
    ['Purchase Date', 'The date the asset was purchased or received.'],
];

const inventoryColumns = [
    ['Name', 'The asset or stock name. Click the name to open the item report.'],
    ['Asset Tag', 'The internal asset tracking number. Blank is allowed for bulk stock.'],
    ['SKU', 'The stock code or product code. Useful for searching and supplier reference.'],
    ['Brand', 'The product brand or manufacturer.'],
    ['Category', 'The group this item belongs to.'],
    ['Supplier', 'The company or person who supplied the item.'],
    ['Available', 'Quantity still in store and ready to assign.'],
    ['Assigned', 'Quantity currently issued out and not yet returned.'],
    ['Managed', 'Total quantity controlled by the system. Managed equals Available plus Assigned.'],
    ['Unit Cost', 'Cost of one unit in PGK.'],
    ['Stock State', 'Automatic status such as Available, Low Stock, Out of Stock, Maintenance, Lost, or Retired.'],
    ['Date Added', 'When the item was first created in the system.'],
    ['Actions', 'Edit changes details, Delete removes only safe records, Retire disposes an asset while keeping history.'],
];

const assignmentColumns = [
    ['Asset', 'The item that was given out. It may show the name, asset tag, or SKU.'],
    ['Given To', 'The receiver or staff member holding the asset.'],
    ['Department', 'The department responsible for the issued item.'],
    ['Qty', 'How many units were issued.'],
    ['Date Given', 'When the item was assigned.'],
    ['Status', 'Issued out means still active. Returned means it came back into stock.'],
    ['Actions', 'View opens the assignment details. Mark Returned closes the assignment and adds stock back.'],
];

const pageGuides = [
    {
        title: 'Dashboard',
        text: 'Use this page first when you want a quick overview of the system.',
        points: [
            'Shows important stock and activity information in one place.',
            'Helps managers see recent records and alerts without opening every module.',
            'Use it to identify low stock, out-of-stock items, and recent system actions.',
        ],
    },
    {
        title: 'Inventory',
        text: 'This is the main asset register. Every assignable item must be created here first.',
        points: [
            'Use Add Inventory Item to create a new item.',
            'Use Search and Filters to find records by name, tag, SKU, category, supplier, or stock state.',
            'Use Export to download inventory reports.',
            'Use Edit to update details or correct available quantity. Quantity edits are saved as stock adjustments.',
            'Use Retire when an asset is disposed, damaged beyond use, sold, or removed from service.',
        ],
    },
    {
        title: 'Assignments',
        text: 'This page is for giving assets to staff or departments and confirming returns.',
        points: [
            'Give Out Asset records a handover from store stock to a receiver.',
            'The system will not allow a user to give out more than the available quantity.',
            'Mark Returned closes the active assignment and puts the quantity back into inventory.',
            'Use tabs such as Issued Out, Returned, By Receiver, Stock Check, and Full History to review records.',
        ],
    },
    {
        title: 'Suppliers',
        text: 'Suppliers are the vendors or sources connected to inventory items.',
        points: [
            'Add supplier name, contact details, and address where available.',
            'Supplier records help users know where an item came from.',
            'Inventory reports can show which supplier is linked to each item.',
        ],
    },
    {
        title: 'Categories',
        text: 'Categories keep inventory organized and easier to report.',
        points: [
            'Create clear groups before adding inventory.',
            'Examples are Laptops, Printers, Networking, Accessories, Furniture, and Consumables.',
            'Categories are used in inventory filters and reports.',
        ],
    },
    {
        title: 'Departments',
        text: 'Departments show which business area is responsible for assigned assets.',
        points: [
            'Examples are IT Support, HR, Finance, Admin, Operations, and Networking.',
            'Assignments must choose a department.',
            'Department records help management see where assets are currently issued.',
        ],
    },
    {
        title: 'Receivers',
        text: 'Receivers are the people or teams who receive assets.',
        points: [
            'Each receiver belongs to a department.',
            'Choose the receiver during assignment so the system knows who is holding the item.',
            'Receiver reports show active, returned, and total issued quantities.',
        ],
    },
    {
        title: 'Notifications',
        text: 'Notifications tell users about important system events.',
        points: [
            'Examples are new assets, assignments, low stock, returns, maintenance, and retired assets.',
            'Use notifications to know what needs attention.',
            'Mark notifications as read after reviewing them.',
        ],
    },
    {
        title: 'Activity Logs',
        text: 'Activity Logs are for accountability.',
        points: [
            'Use this page to check who created, updated, assigned, returned, or retired an item.',
            'It helps management review important actions after they happen.',
            'This is useful when investigating stock changes.',
        ],
    },
];

const commonQuestions = [
    ['What should I create first?', 'Create Categories and Suppliers first. Then add Inventory. After that, create Departments and Receivers before using Assignments.'],
    ['Why did available quantity go down?', 'A user assigned the item, retired it, or adjusted the quantity. Check Assignments and Activity Logs.'],
    ['Why can I not assign more quantity?', 'The system only allows issuing what is currently available in inventory.'],
    ['What is Managed quantity?', 'Managed quantity is everything the system controls. It is Available quantity plus Assigned quantity.'],
    ['When should I use Asset Tag?', 'Use Asset Tag for a physical asset you want to track individually, such as a laptop or printer.'],
    ['When should I use SKU?', 'Use SKU for product codes, stock codes, or bulk item codes.'],
    ['When should I retire instead of delete?', 'Retire an item when it has history or has been used. Delete should only be for records created by mistake with no important history.'],
    ['When should depreciation be enabled?', 'Enable depreciation for fixed assets that lose value over time. Leave it off for normal consumables or bulk stock.'],
];

function GuidePanel({ title, description, children }) {
    return (
        <section className="p-5 bg-white border shadow-sm rounded-2xl border-slate-200">
            <div>
                <h2 className="text-lg font-bold text-slate-950">{title}</h2>
                {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
            </div>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function SimpleList({ items }) {
    return (
        <ul className="space-y-2 text-sm leading-6 text-slate-600">
            {items.map((item) => (
                <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

function DefinitionGrid({ rows }) {
    return (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {rows.map(([label, text]) => (
                <div key={label} className="p-4 border rounded-xl border-slate-200 bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-950">{label}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </div>
            ))}
        </div>
    );
}

export default function UserguidePage() {
    return (
        <div className="space-y-6">
            <div className="page-header">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100 rounded-full bg-blue-50">
                        User Support
                    </div>
                    <h1 className="mt-4 page-title">User guide</h1>
                    <p className="page-subtitle">
                        Simple guide for using Nextgen Assets Management System from setup to daily asset handover.
                    </p>
                </div>
            </div>

            <GuidePanel
                title="What This System Does"
                description="Use this system to record assets, control stock quantity, issue items to staff, confirm returns, and keep a history of important actions."
            >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="p-4 border rounded-xl border-emerald-200 bg-emerald-50">
                        <h3 className="font-bold text-emerald-800">Inventory</h3>
                        <p className="mt-2 text-sm leading-6 text-emerald-700">Stores the master list of assets and stock items.</p>
                    </div>
                    <div className="p-4 border border-blue-200 rounded-xl bg-blue-50">
                        <h3 className="font-bold text-blue-800">Assignments</h3>
                        <p className="mt-2 text-sm leading-6 text-blue-700">Records who received an item and reduces available stock.</p>
                    </div>
                    <div className="p-4 border rounded-xl border-slate-200 bg-slate-50">
                        <h3 className="font-bold text-slate-900">Reports</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Show stock, receiver, department, and activity information.</p>
                    </div>
                </div>
            </GuidePanel>

            <GuidePanel title="Recommended Setup Order" description="Follow this order when setting up the system for the first time.">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {setupSteps.map(([title, text], index) => (
                        <div key={title} className="p-4 border rounded-xl border-slate-200 bg-slate-50">
                            <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white bg-blue-600 rounded-lg">
                                {index + 1}
                            </div>
                            <h3 className="mt-3 text-sm font-bold text-slate-950">{title}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                        </div>
                    ))}
                </div>
            </GuidePanel>

            <GuidePanel title="How To Add Inventory" description="Use Add Inventory Item when a new asset or stock item must be recorded.">
                <SimpleList
                    items={[
                        'Click Add Inventory Item on the Inventory page.',
                        'Choose the Tracking Mode. Use Bulk stock for many units. Use Serialized asset for one unique item.',
                        'Fill in the basic item details such as Name, Brand, SKU, and Description.',
                        'Enter the starting quantity, unit of measurement, reorder level, unit cost, and lifecycle status.',
                        'Enable depreciation only when the item is a fixed asset that loses value over time.',
                        'Select the Category and Supplier. These fields are required because they connect the item to reports.',
                        'Enter Asset Tag, Location, and Purchase Date if available.',
                        'Click Create Inventory Item to save the record.',
                    ]}
                />
            </GuidePanel>

            <GuidePanel title="Inventory Form Fields" description="This explains what each field means in simple words.">
                <DefinitionGrid rows={inventoryFormRows} />
            </GuidePanel>

            <GuidePanel title="Inventory Table Columns" description="This explains the table shown below the inventory form.">
                <DefinitionGrid rows={inventoryColumns} />
            </GuidePanel>

            <GuidePanel title="Inventory Quantity Meaning">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="p-4 border rounded-xl border-emerald-200 bg-emerald-50">
                        <h3 className="font-bold text-emerald-800">Available</h3>
                        <p className="mt-2 text-sm leading-6 text-emerald-700">Quantity still in store and ready to assign.</p>
                    </div>
                    <div className="p-4 border border-blue-200 rounded-xl bg-blue-50">
                        <h3 className="font-bold text-blue-800">Assigned</h3>
                        <p className="mt-2 text-sm leading-6 text-blue-700">Quantity currently issued to receivers or departments.</p>
                    </div>
                    <div className="p-4 border rounded-xl border-slate-200 bg-slate-50">
                        <h3 className="font-bold text-slate-900">Managed</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Total controlled quantity. Managed equals Available plus Assigned.</p>
                    </div>
                </div>
            </GuidePanel>

            <GuidePanel title="How To Give Out An Asset" description="Use Assignments when an item leaves the store and is handed to a person or department.">
                <SimpleList
                    items={[
                        'Open the Assignments page.',
                        'Click Give Out Asset.',
                        'Choose the item from inventory.',
                        'Choose the receiver and department.',
                        'Enter the quantity to give out.',
                        'Save the assignment. The system reduces Available quantity automatically.',
                        'When the item comes back, click Mark Returned. The system adds the quantity back to inventory.',
                    ]}
                />
            </GuidePanel>

            <GuidePanel title="Assignments Table Columns" description="This explains the table on the Assignments page.">
                <DefinitionGrid rows={assignmentColumns} />
            </GuidePanel>

            <GuidePanel title="Page By Page Guide" description="Use this section when a user is not sure what each page is for.">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {pageGuides.map((section) => (
                        <div key={section.title} className="p-4 border rounded-xl border-slate-200 bg-slate-50">
                            <h3 className="text-base font-bold text-slate-950">{section.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{section.text}</p>
                            <div className="mt-3">
                                <SimpleList items={section.points} />
                            </div>
                        </div>
                    ))}
                </div>
            </GuidePanel>

            <GuidePanel title="Common Questions" description="Quick answers for new users.">
                <DefinitionGrid rows={commonQuestions} />
            </GuidePanel>
        </div>
    );
}
