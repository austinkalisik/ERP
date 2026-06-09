export default function LeaveTypesTable({ data, onEdit, onDelete }) {
  return (
    <div className="table-responsive">
      <table className="table table-bordered align-middle">
        <thead style={{ backgroundColor: "#f3f4f6" }}>
          <tr>
            <th style={{ fontWeight: 600 }}>Leave Type</th>
            <th style={{ fontWeight: 600, width: 140 }}>Code</th>
            <th style={{ fontWeight: 600, width: 140 }}>Hours Paid</th>
            <th style={{ fontWeight: 600, width: 160 }} className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center text-muted" style={{ padding: "32px 0" }}>
                No leave types found
              </td>
            </tr>
          ) : (
            data.map((lt) => (
              <tr key={lt.id}>
                <td style={{ fontWeight: 500 }}>{lt.leave_type}</td>
                <td>
                  <span className="badge bg-primary">{lt.leave_code}</span>
                </td>
                <td>{parseFloat(lt.num_hours).toFixed(2)} hrs</td>
                <td className="text-end">
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() => onEdit(lt)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => onDelete(lt.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}