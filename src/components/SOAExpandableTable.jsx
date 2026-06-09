import { useState, useMemo, Fragment } from "react";

export default function SOAExpandableTable({ transactions }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Group transactions by supplier
  const groupedData = useMemo(() => {
    const map = {};

    transactions.forEach((txn) => {
      if (!map[txn.supplier_id]) {
        map[txn.supplier_id] = {
          supplier_id: txn.supplier_id,
          supplier_name: txn.supplier_name || "Unknown",
          total_balance: 0,
          transactions: [],
        };
      }

      // calculate running balance
      const supplier = map[txn.supplier_id];
      const balance = (supplier.total_balance || 0) + (txn.debit - txn.credit);
      supplier.total_balance = balance;

      supplier.transactions.push({
        ...txn,
        balance,
      });
    });

    return Object.values(map);
  }, [transactions]);

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ background: "#f7fafc" }}>
          <th>Supplier</th>
          <th>Total Balance</th>
        </tr>
      </thead>

      <tbody>
        {groupedData.map((supplier) => (
          <Fragment key={supplier.supplier_id}>
            {/* Supplier Row */}
            <tr
              onClick={() => toggle(supplier.supplier_id)}
              style={{ cursor: "pointer", background: "#edf2f7" }}
            >
              <td>{supplier.supplier_name}</td>
              <td>{supplier.total_balance.toFixed(2)}</td>
            </tr>

            {/* Expanded Transactions */}
            {expanded[supplier.supplier_id] && (
              <tr>
                <td colSpan="2">
                  <table style={{ width: "100%", marginTop: "10px" }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Reference</th>
                        <th>Type</th>
                        <th>Debit</th>
                        <th>Credit</th>
                        <th>Balance</th>
                      </tr>
                    </thead>

                    <tbody>
                      {supplier.transactions.map((txn, index) => (
                        <tr key={index}>
                          <td>{txn.date}</td>
                          <td>{txn.reference}</td>
                          <td>{txn.type}</td>
                     <td>{Number(txn.debit).toFixed(2)}</td>
                      <td>{Number(txn.credit).toFixed(2)}</td>
                      <td>{Number(txn.balance).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}