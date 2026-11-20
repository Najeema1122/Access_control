import { useState } from "react";
import { Download } from "lucide-react";
import { branchNames, date, exportCSV, limit, title } from "../lib/display";
import Grid from "./Grid";
const Reports = ({ workspace }) => {
  const [report, setReport] = useState("Role summary");
  const reports = ["Role summary", "Permission matrix", "Role assignments", "Inactive roles"];
  let headers, rows;
  if (report === "Permission matrix") {
    headers = ["Role", "Module", "Actions"];
    rows = workspace.roles.flatMap((role) =>
      role.permissions.map((permission) => [role.name, title(permission.module), permission.actions.map(title).join(", ")]),
    );
  } else if (report === "Role assignments") {
    headers = ["User", "Branch", "Role", "Role status"];
    rows = workspace.members.map((member) => {
      const role = workspace.roles.find((role) => role._id === member.roleId);
      return [
        member.name,
        workspace.branches.find((branch) => branch.id === member.branchId)?.name,
        role?.name || "Unassigned",
        role ? title(role.status) : "—",
      ];
    });
  } else {
    headers = [
      "Role",
      "Status",
      "Users",
      "Branch access",
      "Approval level",
      "Approval limit",
      "Created",
    ];
    rows = workspace.roles
      .filter((role) => report !== "Inactive roles" || role.status === "INACTIVE")
      .map((role) => [
        role.name,
        title(role.status),
        role.usersAssigned,
        branchNames(role, workspace.branches),
        role.approvalLevel,
        limit(role.approvalLimit),
        date(role.createdAt),
      ]);
  }
  return (
    <section className="panel">
      <header>
        <label className="field">
          Report
          <select value={report} onChange={(e) => setReport(e.target.value)}>
            {reports.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <button
          className="button"
          onClick={() => exportCSV(report.toLowerCase().replaceAll(" ", "-"), [headers, ...rows])}
        >
          <Download size={16} />
          Export CSV
        </button>
      </header>
      <Grid key={report} headers={headers} rows={rows} />
    </section>
  );
};

export default Reports;
