import Grid from "./Grid";
import { branchNames, limit } from "../lib/display";
const Approvals = ({ workspace, onEdit }) => (
  <section className="panel">
    <header>
      <h2>Approval authority</h2>
    </header>
    <Grid
      headers={["Role", "Approval level", "Approval limit", "Branch access", "Actions"]}
      rows={workspace.roles.map((role) => [
        role.name,
        role.approvalLevel,
        limit(role.approvalLimit),
        branchNames(role, workspace.branches),
        <button className="button" onClick={() => onEdit(role)}>
          Edit
        </button>,
      ])}
    />
  </section>
);

export default Approvals;
