import { ChevronDown, History } from "lucide-react";
import { date, scopes, title, limit } from "../lib/display";

const clock = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

// Turn a stored role or assignment into the same labels used on the forms.
const describeRecord = (record, workspace) => {
  const fields = {};
  if (!record) return fields;

  if ("source" in record) fields["Copied from"] = record.source;
  if ("name" in record) fields["Role name"] = record.name;
  if ("description" in record) fields.Description = record.description || "No description";
  if (record.status) fields.Status = title(record.status);
  if (record.branchScope) fields["Branch scope"] = scopes[record.branchScope] || record.branchScope;
  if (record.branchIds?.length) {
    fields.Branches = record.branchIds.map((id) =>
      workspace.branches.find((branch) => branch.id === id)?.name || id
    ).sort().join(", ");
  }
  if ("approvalLevel" in record) fields["Approval level"] = String(record.approvalLevel);
  if ("approvalLimit" in record) fields["Approval limit"] = limit(record.approvalLimit);
  if ("roleId" in record || "roleName" in record) {
    const role = workspace.roles.find((item) => item._id === record.roleId);
    fields["Assigned role"] = record.roleName || role?.name || record.roleId || "Unassigned";
  }

  for (const row of record.permissions || []) {
    fields[title(row.module) + " permissions"] = [...row.actions].sort().map(title).join(", ");
  }
  return fields;
};

const ChangeDetails = ({ event, workspace }) => {
  const before = describeRecord(event.before, workspace);
  const after = describeRecord(event.after, workspace);
  const fields = Object.keys({ ...before, ...after }).filter((key) => before[key] !== after[key]);

  if (!fields.length) return <p className="audit-empty-detail">No field changes recorded.</p>;

  return (
    <dl className="audit-changes">
      {fields.map((field) => (
        <div key={field}>
          <dt>{field}</dt>
          <dd>
            {field in before && field in after && (
              <><span className="audit-previous">{before[field]}</span><span aria-label="changed to"> → </span></>
            )}
            {after[field] ?? (field === "Copied from" ? before[field] : "Removed (" + before[field] + ")")}
          </dd>
        </div>
      ))}
    </dl>
  );
};

const Activity = ({ workspace }) => {
  const days = new Map();
  for (const event of workspace.activity) {
    const day = date(event.createdAt);
    if (!days.has(day)) days.set(day, []);
    days.get(day).push(event);
  }

  return (
    <section className="panel audit-panel">
      <header>
        <h2>Recent changes</h2>
        <small>{workspace.activity.length === 100 ? "Latest 100 events" : workspace.activity.length + (workspace.activity.length === 1 ? " event" : " events")}</small>
      </header>
      {days.size === 0 && <p className="empty">Role changes will appear here when you save them.</p>}
      {Array.from(days, ([day, events]) => (
        <section className="audit-day" key={day} aria-label={day}>
          <h3>{day}</h3>
          {events.map((event) => (
            <details key={event._id} className="audit-entry">
              <summary>
                <History className="audit-icon" size={18} aria-hidden="true" />
                <span className="audit-event">
                  <strong>{event.target || "Workspace"}</strong>
                  <span>{event.action} · {event.actor || "Unknown actor"}</span>
                </span>
                <time dateTime={event.createdAt}>{clock.format(new Date(event.createdAt))}</time>
                <ChevronDown className="audit-chevron" size={16} aria-hidden="true" />
              </summary>
              <ChangeDetails event={event} workspace={workspace} />
            </details>
          ))}
        </section>
      ))}
    </section>
  );
};
export default Activity;
