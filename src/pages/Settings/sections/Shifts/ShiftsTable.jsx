export default function ShiftsTable({ data, onEdit, onDelete }) {
  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
      }}
      className="table-responsive"
    >
      <table className="table table-bordered align-middle">
        <thead style={{ backgroundColor: "#f3f4f6" }}>
          <tr>
            <th style={{ fontWeight: 600 }}>Shift Name</th>
            <th style={{ fontWeight: 600, width: 260 }}>
              Schedule
            </th>
            <th
              style={{ fontWeight: 600, width: 160 }}
              className="text-end"
            >
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 && (
            <tr>
              <td
                colSpan="3"
                className="text-center text-muted"
                style={{ padding: "32px 0" }}
              >
                No shifts available
              </td>
            </tr>
          )}

          {data.map((shift) => (
            <tr key={shift.id}>
              <td style={{ fontWeight: 500 }}>
                {shift.shift_name}
              </td>

              <td>
                {shift.start_time} – {shift.end_time}
              </td>

              <td className="text-end">
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => onEdit(shift)}
                >
                  Edit
                </button>

                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(shift.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
