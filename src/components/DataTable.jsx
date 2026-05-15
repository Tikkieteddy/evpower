// tikkieteddielab: shared responsive data table.
export default function DataTable({ columns, rows, emptyText = "ยังไม่มีข้อมูล" }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--blonde-line)] bg-white shadow-sm">
      <table className="min-w-full divide-y divide-[var(--blonde-line)] text-sm">
        <thead className="bg-[var(--blonde-soft)]">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-4 py-3 text-left font-bold text-[var(--marine-muted)]">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--blonde-line)]">
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-[var(--marine-muted)]" colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={row.id || row.routeName || row.date || rowIndex} className="hover:bg-[var(--sea-soft)]">
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-4 py-3 text-[var(--marine-ink)]">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
