import { useState } from "react";
import PermissionMatrix from "./PermissionMatrix";
import Dialog from "./Dialog";
import { scopes } from "../lib/display";
import { createRole, updateRole, cloneRole, errorMessage } from "../services/accessControlService";
const CreateRoleForm = ({ mode, role, catalog, branches, token, onClose, onSaved }) => {
  const copying = mode === "Clone";
  const protectedRole = mode === "Edit" && role.protected;
  const [values, setValues] = useState({
    name: copying ? role.name + " (copy)" : role?.name || "",
    description: role?.description || "",
    branchScope: role?.branchScope || "ASSIGNED_BRANCH",
    branchIds: role?.branchIds || [],
    status: role?.status || "ACTIVE",
    permissions: role?.permissions || [],
    approvalLevel: role?.approvalLevel ?? 0,
    approvalLimit: role?.approvalLimit ?? "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!values.name.trim()) return setError("Enter a role name.");
    if (!values.permissions.length) return setError("Select at least one permission.");
    if (values.branchScope === "SELECTED_BRANCHES" && !values.branchIds.length)
      return setError("Choose at least one branch.");
    setBusy(true);
    try {
      const body = {
        ...values,
        name: values.name.trim(),
        branchIds: values.branchScope === "SELECTED_BRANCHES" ? values.branchIds : [],
        approvalLevel: Number(values.approvalLevel),
        approvalLimit: values.approvalLimit === "" ? null : Number(values.approvalLimit),
      };
      let saved;
      if (copying) {
        saved = await cloneRole(role._id, body.name, token);
      } else if (mode === "Edit") {
        const editableFields = protectedRole
          ? {
              description: body.description,
              approvalLevel: body.approvalLevel,
              approvalLimit: body.approvalLimit,
            }
          : body;
        saved = await updateRole(role._id, editableFields, token);
      } else {
        saved = await createRole(body, token);
      }
      onSaved(saved.name + (copying ? " was cloned." : " was saved."));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog title={mode + " role"} busy={busy} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="dialog-body">
          <div className="form-grid">
            <label className="field">
              Role name
              <input
                required
                maxLength={100}
                value={values.name}
                disabled={protectedRole}
                onChange={(e) => change("name", e.target.value)}
                autoFocus
              />
            </label>
            <label className="field">
              Status
              <select
                value={values.status}
                disabled={copying || protectedRole}
                onChange={(e) => change("status", e.target.value)}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
            <label className="field wide">
              Description
              <textarea
                maxLength={500}
                value={values.description}
                disabled={copying}
                onChange={(e) => change("description", e.target.value)}
              />
            </label>
            <label className="field wide">
              Branch scope
              <select
                value={values.branchScope}
                disabled={copying || protectedRole}
                onChange={(e) => change("branchScope", e.target.value)}
              >
                {Object.entries(scopes).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            {values.branchScope === "SELECTED_BRANCHES" && (
              <fieldset className="wide">
                <legend>Selected branches</legend>
                <div className="actions">
                  {branches.map((b) => (
                    <label className="inline-check" key={b.id}>
                      <input
                        type="checkbox"
                        checked={values.branchIds.includes(b.id)}
                        disabled={copying || protectedRole}
                        onChange={(e) =>
                          change(
                            "branchIds",
                            e.target.checked
                              ? [...values.branchIds, b.id]
                              : values.branchIds.filter((id) => id !== b.id),
                          )
                        }
                      />
                      {b.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <label className="field">
              Approval level
              <input
                type="number"
                min="0"
                step="1"
                required
                disabled={copying}
                value={values.approvalLevel}
                onChange={(e) => change("approvalLevel", e.target.value)}
              />
            </label>
            <label className="field">
              Approval limit (optional)
              <input
                type="number"
                min="0"
                step="any"
                placeholder="No limit set"
                disabled={copying}
                value={values.approvalLimit}
                onChange={(e) => change("approvalLimit", e.target.value)}
              />
            </label>
          </div>
          <h3>Module permissions</h3>
          <PermissionMatrix
            catalog={catalog}
            value={values.permissions}
            onChange={
              copying || protectedRole ? undefined : (value) => change("permissions", value)
            }
          />
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </div>
        <footer className="dialog-foot">
          <button type="button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Saving…" : copying ? "Clone role" : "Save role"}
          </button>
        </footer>
      </form>
    </Dialog>
  );
};
export default CreateRoleForm;
