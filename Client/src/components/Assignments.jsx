import { useState } from "react";
import { assignRole, checkAccess, errorMessage } from "../services/accessControlService";
import { title } from "../lib/display";
import Grid from "./Grid";
import Dialog from "./Dialog";
const AssignmentDialog = ({ user, roles, token, onClose, onSaved }) => {
  const available = roles.filter((role) => role.status === "ACTIVE" && !role.protected);
  const [id, setId] = useState(available.find((role) => role._id === user.roleId) ? user.roleId : "");
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await assignRole(user._id, id, token);
      onSaved("Role assignment saved for " + user.name + ".");
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog title={"Assign role to " + user.name} busy={busy} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="dialog-body">
          <label className="field">
            Active role
            <select required value={id} onChange={(e) => setId(e.target.value)}>
              <option value="">Select a role</option>
              {available.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
        <footer className="dialog-foot">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={busy}>
            Save assignment
          </button>
        </footer>
      </form>
    </Dialog>
  );
};
const AccessCheck = ({ workspace }) => {
  const [module, setModule] = useState(workspace.catalog[0].module);
  const [action, setAction] = useState("VIEW"),
    [result, setResult] = useState(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const run = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setResult(null);
    setError("");
    try {
      setResult(
        await checkAccess({
          ...body,
          amount: Number(body.amount || 0),
          requiredLevel: Number(body.requiredLevel || 0),
        }),
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel">
      <header>
        <h2>Check effective access</h2>
      </header>
      <form
        className="stack"
        onSubmit={run}
        onChange={() => {
          setResult(null);
          setError("");
        }}
      >
        <fieldset disabled={busy} className="form-grid plain-fieldset">
          <label className="field">
            User
            <select name="userId">
              {workspace.members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Target branch
            <select name="branchId">
              {workspace.branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Module
            <select
              name="module"
              value={module}
              onChange={(e) => {
                setModule(e.target.value);
                setAction("VIEW");
              }}
            >
              {workspace.catalog.map((permission) => (
                <option key={permission.module} value={permission.module}>
                  {title(permission.module)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Action
            <select name="action" value={action} onChange={(e) => setAction(e.target.value)}>
              {workspace.catalog
                .find((permission) => permission.module === module)
                .actions.map((a) => (
                  <option key={a} value={a}>
                    {title(a)}
                  </option>
                ))}
            </select>
          </label>
          {action === "APPROVE" && (
            <>
              <label className="field">
                Amount
                <input name="amount" type="number" min="0" step="any" defaultValue="0" required />
              </label>
              <label className="field">
                Required level
                <input
                  name="requiredLevel"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue="1"
                  required
                />
              </label>
            </>
          )}
        </fieldset>
        <div>
          <button className="button" disabled={busy}>
            Check access
          </button>
        </div>
        {result && (
          <p role="status" className={result.allowed ? "notice" : "error"}>
            <strong>{result.allowed ? "Allowed. " : "Denied. "}</strong>
            {result.reason}
          </p>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </form>
    </section>
  );
};
const Assignments = ({ workspace, token, onAdmin, onSaved }) => {
  const [user, setUser] = useState(null);
  return (
    <>
      <section className="panel">
        <header>
          <h2>Users</h2>
          <small>{workspace.members.length} users</small>
        </header>
        <Grid
          headers={["User", "Assigned branch", "Role", "Actions"]}
          rows={workspace.members.map((member) => [
            member.name,
            workspace.branches.find((branch) => branch.id === member.branchId)?.name,
            workspace.roles.find((role) => role._id === member.roleId)?.name || "Unassigned",
            <button
              className="button"
              disabled={member.roleId === workspace.adminRoleId}
              onClick={() => onAdmin(() => setUser(member))}
            >
              Assign role
            </button>,
          ])}
        />
      </section>
      {workspace.members.length > 0 && <AccessCheck workspace={workspace} />}
      {user && (
        <AssignmentDialog
          user={user}
          roles={workspace.roles}
          token={token}
          onClose={() => setUser(null)}
          onSaved={onSaved}
        />
      )}
    </>
  );
};
export default Assignments;
