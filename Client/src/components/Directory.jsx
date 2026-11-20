import PaginatedTable from "./PaginatedTable";
import { useState } from "react";
import {
  Eye,
  Pencil,
  Copy,
  Power,
  Download,
  Search,
  ShieldCheck,
  Users,
  Layers,
  ListChecks,
} from "lucide-react";
import { date, scopes, title, exportCSV } from "../lib/display";
const Directory = ({ workspace, onAction }) => {
  const { roles, members } = workspace;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(""),
    [scope, setScope] = useState("");
  const [sort, setSort] = useState("name");
  const matchesFilters = (role) => {
    const matchesName = role.name.toLowerCase().includes(query.trim().toLowerCase());
    return (
      matchesName && (!status || role.status === status) && (!scope || role.branchScope === scope)
    );
  };
  const compareRoles = (first, second) => {
    if (sort === "date") return new Date(second.createdAt) - new Date(first.createdAt);
    if (sort === "count" && first.usersAssigned !== second.usersAssigned)
      return second.usersAssigned - first.usersAssigned;
    return first.name.localeCompare(second.name);
  };
  const filtered = roles.filter(matchesFilters).sort(compareRoles);
  const csv = () =>
    exportCSV("roles", [
      ["Role name", "Description", "Users assigned", "Status", "Branch scope", "Created"],
      ...filtered.map((role) => [
        role.name,
        role.description,
        role.usersAssigned,
        title(role.status),
        scopes[role.branchScope],
        date(role.createdAt),
      ]),
    ]);
  return (
    <>
      <div className="stats">
        {[
          ["Total roles", roles.length, Layers],
          ["Active roles", roles.filter((role) => role.status === "ACTIVE").length, ShieldCheck],
          ["Assigned users", members.filter((member) => member.roleId).length, Users],
          ["Business modules", workspace.catalog.length, ListChecks],
        ].map(([label, value, Icon]) => (
          <div className="stat" key={label}>
            <div className="stat-head">
              <span>{label}</span>
              <Icon size={17} />
            </div>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <section className="panel">
        <header>
          <h2>Role directory</h2>
          <button className="button secondary" onClick={csv}>
            <Download size={16} />
            Export CSV
          </button>
        </header>
        <div className="toolbar">
          <label className="searchbox">
            <Search size={16} />
            <input
              type="search"
              aria-label="Search role names"
              placeholder="Search role names"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            aria-label="Filter by branch scope"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            <option value="">All scopes</option>
            {Object.entries(scopes).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select aria-label="Sort roles" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name">Name A–Z</option>
            <option value="date">Newest first</option>
            <option value="count">Most users</option>
          </select>
        </div>
        <PaginatedTable
          key={JSON.stringify([query, status, scope, sort])}
          headers={["Role", "Users", "Branch scope", "Status", "Created", "Actions"]}
          rows={filtered}
          emptyMessage="No roles match your search."
          renderRow={(role) => (
            <tr key={role._id}>
              <td>
                <strong>{role.name}</strong>
                <small>{role.description || "—"}</small>
              </td>
              <td>{role.usersAssigned}</td>
              <td>{scopes[role.branchScope]}</td>
              <td>
                <span className={"badge " + role.status.toLowerCase()}>
                  {title(role.status)}
                </span>
              </td>
              <td className="nowrap">{date(role.createdAt)}</td>
              <td>
                <div className="row-actions">
                  {[
                    ["View", Eye],
                    ["Edit", Pencil],
                    ["Clone", Copy],
                    [role.status === "ACTIVE" ? "Deactivate" : "Activate", Power],
                  ].map(([action, Icon]) => (
                    <button
                      key={action}
                      title={action + " " + role.name}
                      aria-label={action + " " + role.name}
                      disabled={action === "Deactivate" && role.protected}
                      onClick={() => onAction(action, role)}
                    >
                      <Icon size={15} />
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          )}
        />
        <footer>
          <small>
            {filtered.length} of {roles.length} roles
          </small>
        </footer>
      </section>
    </>
  );
};
export default Directory;
