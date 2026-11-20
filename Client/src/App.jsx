import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity as ActivityIcon,
  Building2,
  CheckCircle2,
  ClipboardList,
  Fingerprint,
  Grid2X2,
  Layers,
  LockKeyhole,
  LogOut,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  loadWorkspace,
  verifyAdmin,
  setStatus,
  errorMessage,
} from "./services/accessControlService";
import Directory from "./components/Directory";
import Dialog from "./components/Dialog";
import CreateRoleForm from "./components/CreateRoleForm";
import RoleDetails from "./components/RoleDetails";
import Assignments from "./components/Assignments";
import Reports from "./components/Reports";
import Approvals from "./components/Approvals";
import Activity from "./components/Activity";
import MatrixPage from "./components/MatrixPage";

const pages = [
  ["Roles", Layers, "Manage reusable roles and their access across the workspace."],
  ["Permission matrix", Grid2X2, "Review and change the actions each role can perform."],
  ["Approval levels", ShieldCheck, "Review approval levels and financial limits by role."],
  ["Assignments", Users, "Assign active roles and check what a user can access."],
  ["Reports", ClipboardList, "Review and export access records."],
  ["Activity", ActivityIcon, "Inspect changes to roles, permissions and assignments."],
];
const initialPage = () =>
  pages.find(
    ([n]) => n.toLowerCase().replaceAll(" ", "-") === window.location.hash.slice(1),
  )?.[0] || "Roles";

const App = () => {
  const [page, setPage] = useState(initialPage);
  const [workspace, setWorkspace] = useState(null),
    [problem, setProblem] = useState("");
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState(""),
    [token, setToken] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const continuation = useRef(null);
  const load = useCallback(() => {
    return loadWorkspace()
      .then((data) => {
        setWorkspace(data);
        setProblem("");
      })
      .catch((error) => setProblem(errorMessage(error)));
  }, []);
  useEffect(() => {
    load();
    const changePage = () => {
      setPage(initialPage());
      setDialog(null);
      setError("");
    };
    window.addEventListener("hashchange", changePage);
    return () => window.removeEventListener("hashchange", changePage);
  }, [load]);
  const close = () => {
    setDialog(null);
    setError("");
    continuation.current = null;
  };
  const onAdmin = (fn) => {
    if (token) {
      fn();
      return;
    }
    continuation.current = fn;
    setError("");
    setDialog({ type: "Unlock" });
  };
  const onAction = (type, role) => {
    const open = () => {
      setError("");
      setDialog({ type, role });
    };
    if (type === "View") open();
    else onAdmin(open);
  };
  const saved = (message) => {
    close();
    setNotice(message);
    load();
  };
  const unlock = async (e) => {
    e.preventDefault();
    const key = String(new FormData(e.currentTarget).get("key")).trim();
    setBusy(true);
    setError("");
    try {
      await verifyAdmin(key);
      setToken(key);
      const next = continuation.current;
      close();
      next?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const changeStatus = async () => {
    setBusy(true);
    setError("");
    try {
      const role = dialog.role;
      const active = dialog.type === "Activate";
      await setStatus(role._id, active ? "ACTIVE" : "INACTIVE", token);
      saved(role.name + " was " + (active ? "activated." : "deactivated."));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="lockup">
          <span className="brandmark">
            <Fingerprint size={27} />
          </span>
          <span className="wordmark">Access Desk</span>
        </div>
        <div className="nav-label">Workspace</div>
        <nav aria-label="Workspace">
          {pages.map(([name, Icon]) => (
            <a
              key={name}
              href={"#" + name.toLowerCase().replaceAll(" ", "-")}
              aria-current={page === name ? "page" : undefined}
              onClick={() => setNotice("")}
            >
              <Icon size={18} />
              {name}
            </a>
          ))}
        </nav>
        <footer className="sidebar-foot">
          <Building2 size={18} />
          <span>ERP workspace</span>
        </footer>
      </aside>
      <main className="main">
        <div className="topbar">
          <span>
            Settings <span className="divider">/</span> <strong>Access control</strong>
          </span>
          <button
            className="button secondary"
            onClick={() => {
              if (token) {
                setToken("");
                close();
                window.location.hash = "roles";
                setNotice("Administrator session ended.");
              } else onAdmin(() => {});
            }}
          >
            {token ? <LogOut size={15} /> : <LockKeyhole size={15} />}{" "}
            {token ? "End admin session" : "Administrator access"}
          </button>
        </div>
        <div className="page">
          <header className="page-head">
            <div>
              <p className="eyebrow">Access control</p>
              <h1>{page}</h1>
              <p>{pages.find(([name]) => name === page)[2]}</p>
            </div>
            {page === "Roles" && workspace && (
              <button className="button primary" onClick={() => onAction("Create", null)}>
                <Plus size={16} />
                Create role
              </button>
            )}
          </header>
          {notice && (
            <div className="notice notice-row" role="status">
              <CheckCircle2 size={17} />
              {notice}
              <button aria-label="Dismiss notification" onClick={() => setNotice("")}>
                ×
              </button>
            </div>
          )}
          {problem && (
            <div className="error" role="alert">
              {problem}{" "}
              <button className="button" onClick={load}>
                Retry
              </button>
            </div>
          )}
          {!workspace && !problem && <p role="status">Loading workspace…</p>}
          {workspace && (
            <>
              {page === "Roles" && <Directory workspace={workspace} onAction={onAction} />}
              {page === "Permission matrix" && (
                <MatrixPage workspace={workspace} token={token} onAdmin={onAdmin} onSaved={saved} />
              )}
              {page === "Approval levels" && (
                <Approvals workspace={workspace} onEdit={(r) => onAction("Edit", r)} />
              )}
              {page === "Assignments" && (
                <Assignments
                  workspace={workspace}
                  token={token}
                  onAdmin={onAdmin}
                  onSaved={saved}
                />
              )}
              {page === "Reports" && <Reports workspace={workspace} />}
              {page === "Activity" && <Activity workspace={workspace} />}
            </>
          )}
        </div>
      </main>
      {dialog?.type === "Unlock" && (
        <Dialog title="Administrator access" busy={busy} onClose={close}>
          <form onSubmit={unlock}>
            <div className="dialog-body">
              <label className="field">
                Administrator token
                <input name="key" type="password" required autoFocus autoComplete="off" />
              </label>
              <p className="help">
                Use the administrator token supplied by the workspace owner.
              </p>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
            </div>
            <footer className="dialog-foot">
              <button type="button" disabled={busy} onClick={close}>
                Cancel
              </button>
              <button className="primary" disabled={busy}>
                Unlock workspace
              </button>
            </footer>
          </form>
        </Dialog>
      )}
      {dialog?.type === "View" && (
        <RoleDetails
          id={dialog.role._id}
          workspace={workspace}
          onClose={close}
          onEdit={(role) => onAction("Edit", role)}
        />
      )}
      {["Create", "Clone", "Edit"].includes(dialog?.type) && (
        <CreateRoleForm
          key={dialog.type + (dialog.role?._id || "")}
          mode={dialog.type}
          role={dialog.role}
          token={token}
          catalog={workspace.catalog}
          branches={workspace.branches}
          onClose={close}
          onSaved={saved}
        />
      )}
      {["Activate", "Deactivate"].includes(dialog?.type) && (
        <Dialog title={dialog.type + " role"} busy={busy} onClose={close}>
          <div className="dialog-body">
            <p>
              <strong>{dialog.role.name}</strong>{" "}
              {dialog.type === "Activate"
                ? "will become available for assignment."
                : "will stop granting access to its assigned users."}
            </p>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </div>
          <footer className="dialog-foot">
            <button disabled={busy} onClick={close}>
              Cancel
            </button>
            <button disabled={busy} className="primary" onClick={changeStatus}>
              {dialog.type} role
            </button>
          </footer>
        </Dialog>
      )}
    </div>
  );
};
export default App;
