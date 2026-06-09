export default function EmploymentStatusTable({
  data,
  onEdit,
  onDelete,
}) {
  return (
    <div style={{ maxWidth: 900 }} className="table-responsive">
      <table className="table table-bordered align-middle">
        <thead style={{ backgroundColor: "#f3f4f6" }}>
          <tr>
            <th style={{ fontWeight: 600 }}>Status Name</th>
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
                colSpan="2"
                className="text-center text-muted"
                style={{ padding: "32px 0" }}
              >
                No employment statuses available
              </td>
            </tr>
          )}

          {data.map((item) => (
            <tr key={item.id}>
              <td style={{ fontWeight: 500 }}>{item.name}</td>

              <td className="text-end">
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => onEdit(item)}
                >
                  Edit
                </button>

                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(item.id)}
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
