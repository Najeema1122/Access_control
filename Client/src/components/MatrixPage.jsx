import { useState } from "react";
import PermissionMatrix from "./PermissionMatrix";
import { setPermissions, errorMessage } from "../services/accessControlService";
const MatrixEditor = ({ role, catalog, token, onAdmin, onSaved }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(role.permissions),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await setPermissions(role._id, draft, token);
      setEditing(false);
      onSaved("Permissions saved for " + role.name + ".");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PermissionMatrix
        catalog={catalog}
        value={editing ? draft : role.permissions}
        onChange={editing ? setDraft : undefined}
      />
      <footer>
        <small>
          {role.protected
            ? "The built-in administrator has protected permissions."
            : "Checked actions are granted to this role."}
        </small>
        <div className="actions">
          {editing ? (
            <>
              <button
                className="button"
                disabled={busy}
                onClick={() => {
                  setEditing(false);
                  setError("");
                }}
              >
                Cancel
              </button>
              <button className="button primary" disabled={busy || !draft.length} onClick={save}>
                Save permissions
              </button>
            </>
          ) : (
            <button
              className="button"
              disabled={role.protected}
              onClick={() =>
                onAdmin(() => {
                  setDraft(role.permissions);
                  setEditing(true);
                })
              }
            >
              Edit permissions
            </button>
          )}
        </div>
      </footer>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </>
  );
};
const MatrixPage = ({ workspace, token, onAdmin, onSaved }) => {
  const [id, setId] = useState("");
  const role =
    workspace.roles.find((entry) => entry._id === id) ||
    workspace.roles.find((entry) => !entry.protected) ||
    workspace.roles[0];
  return (
    <section className="panel">
      <header>
        <h2>Module permissions</h2>
        {role && (
          <select aria-label="Matrix role" value={role._id} onChange={(e) => setId(e.target.value)}>
            {workspace.roles.map((entry) => (
              <option key={entry._id} value={entry._id}>
                {entry.name}
              </option>
            ))}
          </select>
        )}
      </header>
      {role && (
        <MatrixEditor
          key={role._id}
          role={role}
          catalog={workspace.catalog}
          token={token}
          onAdmin={onAdmin}
          onSaved={onSaved}
        />
      )}
    </section>
  );
};

export default MatrixPage;
