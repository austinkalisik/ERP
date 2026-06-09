export default function DataTable({ columns, empty = 'No records found.', rows }) {
    return (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                        <tr>
                            {columns.map((column) => <th className="px-4 py-3" key={column.key}>{column.label}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.length === 0 && <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={columns.length}>{empty}</td></tr>}
                        {rows.map((row) => (
                            <tr className="hover:bg-slate-50" key={row.id}>
                                {columns.map((column) => <td className="px-4 py-3 align-top" key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
