// Choices shown on the Add Role form. Each new role starts with no boxes checked.
const standardActions = ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT"];

const permissionOptions = [
  { module: "DASHBOARD", actions: ["VIEW"] },
  { module: "CUSTOMER", actions: ["VIEW", "CREATE", "EDIT", "DELETE", "EXPORT"] },
  { module: "MEMBERSHIP", actions: standardActions },
  { module: "SAVINGS", actions: standardActions },
  { module: "RD", actions: standardActions },
  { module: "LOAN", actions: standardActions },
  { module: "CHITTY", actions: standardActions },
  { module: "REPORTS", actions: ["VIEW", "EXPORT"] },
];

const branches = [
  { id: "central", name: "Central Office" },
  { id: "north", name: "North Branch" },
  { id: "south", name: "South Branch" },
];

module.exports = { permissionOptions, branches };
