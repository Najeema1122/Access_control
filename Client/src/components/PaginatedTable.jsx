import { useState } from "react";

const rowsPerPage = 10;

const PaginatedTable = ({ headers, rows, renderRow, className = "data-table", emptyMessage }) => {
  const [selectedPage, setSelectedPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const page = Math.min(selectedPage, pageCount);
  const start = (page - 1) * rowsPerPage;
  const visibleRows = rows.slice(start, start + rowsPerPage);

  return (
    <>
      <div className="table-scroll">
        <table className={className}>
          <thead>
            <tr>
              {headers.map((header) => <th key={header} scope="col">{header}</th>)}
            </tr>
          </thead>
          <tbody>{visibleRows.map((row, index) => renderRow(row, start + index))}</tbody>
        </table>
      </div>
      {!rows.length && emptyMessage && <p className="empty">{emptyMessage}</p>}
      {pageCount > 1 && (
        <nav className="table-pagination" aria-label="Table pages">
          <small aria-live="polite">
            Rows {start + 1}–{start + visibleRows.length} of {rows.length}
          </small>
          <div className="actions">
            <button type="button" className="button" disabled={page === 1} onClick={() => setSelectedPage(page - 1)}>
              Previous
            </button>
            <button type="button" className="button" disabled={page === pageCount} onClick={() => setSelectedPage(page + 1)}>
              Next
            </button>
          </div>
        </nav>
      )}
    </>
  );
};

export default PaginatedTable;
