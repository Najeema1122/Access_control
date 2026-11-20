export const scopes = {
  ASSIGNED_BRANCH: "Assigned branch",
  SELECTED_BRANCHES: "Selected branches",
  ALL_BRANCHES: "All branches",
};
export const actions = ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"];
export const title = (value) =>
  value === "RD" ? "RD" : value.charAt(0) + value.slice(1).toLowerCase();
export const date = (value) =>
  new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(value),
  );
export const limit = (value) =>
  value == null ? "No limit set" : new Intl.NumberFormat("en").format(value);
export const branchNames = (role, branches) =>
  role.branchScope === "SELECTED_BRANCHES"
    ? branches
        .filter((b) => role.branchIds.includes(b.id))
        .map((b) => b.name)
        .join(", ")
    : scopes[role.branchScope];
export const exportCSV = (filename, rows) => {
  const cell = (value) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text) || /^[\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const blob = new Blob(["\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename + ".csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
