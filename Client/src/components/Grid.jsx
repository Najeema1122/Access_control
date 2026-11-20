import PaginatedTable from "./PaginatedTable";

const Grid = ({ headers, rows }) => (
  <PaginatedTable
    headers={headers}
    rows={rows}
    emptyMessage="No matching records."
    renderRow={(row, index) => (
      <tr key={index}>
        {row.map((cell, column) => <td key={column}>{cell}</td>)}
      </tr>
    )}
  />
);

export default Grid;
