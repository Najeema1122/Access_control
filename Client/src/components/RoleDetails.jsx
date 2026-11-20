import { useState, useEffect } from "react";
import { getRoleById, errorMessage } from "../services/accessControlService";
import { branchNames, limit, title, date } from "../lib/display";
import Dialog from "./Dialog";
import PermissionMatrix from "./PermissionMatrix";
const RoleDetails = ({ id, workspace, onClose, onEdit }) => {
  const [role, setRole] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let current = true;
    getRoleById(id)
      .then((r) => {
        if (current) setRole(r);
      })
      .catch((e) => {
        if (current) setError(errorMessage(e));
      });
    return () => {
      current = false;
    };
  }, [id]);
  return (
    <Dialog title="Role details" onClose={onClose}>
      <div className="dialog-body">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {!role && !error && <p>Loading role…</p>}
        {role && (
          <>
            <h2>{role.name}</h2>
            <p className="muted">{role.description || "No description provided."}</p>
            <dl className="detail-grid">
              {[
                ["Status", title(role.status)],
                ["Branch access", branchNames(role, workspace.branches)],
                ["Approval level", role.approvalLevel],
                ["Approval limit", limit(role.approvalLimit)],
                ["Created", date(role.createdAt)],
                ["Users assigned", role.usersAssigned],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <h3>Module permissions</h3>
            <PermissionMatrix catalog={workspace.catalog} value={role.permissions} />
          </>
        )}
      </div>
      <footer className="dialog-foot">
        <button onClick={onClose}>Close</button>
        {role && (
          <button className="primary" onClick={() => onEdit(role)}>
            Edit role
          </button>
        )}
      </footer>
    </Dialog>
  );
};
export default RoleDetails;
