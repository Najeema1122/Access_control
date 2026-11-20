const mongoose = require("mongoose");
const Role = require("./models/Role");
const { Catalog, Audit, Grants } = require("./models/workspace");
const { saveRole } = require("./services/roleService");
const { permissionOptions } = require("./roleOptions");

// A fresh database needs one administrator before anyone can use Add Role.
const ensureAdministrator = async (adminId) => {
  await mongoose.connection.transaction(async (session) => {
    if (await Role.exists({ _id: adminId }).session(session)) return;

    const role = new Role({
      _id: adminId,
      name: "System Administrator",
      description: "Manages roles and permissions.",
      branchScope: "ALL_BRANCHES",
      approvalLevel: 3,
      permissions: permissionOptions,
    });
    await saveRole({ role, actor: "Workspace setup", action: "Role created", session });
  });
};

const connectDatabase = async () => {
  const adminId = process.env.SYSTEM_ADMIN_ROLE_ID;
  if (!mongoose.isObjectIdOrHexString(adminId) || !process.env.DEMO_ADMIN_TOKEN) {
    throw new Error("Configure the administrator role ID and token.");
  }
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  await Promise.all([Role.init(), Audit.init(), Catalog.init(), Grants.init()]);

  for (const { module, actions } of permissionOptions) {
    await Catalog.updateOne({ _id: module }, { $set: { actions } }, { upsert: true });
  }
  await ensureAdministrator(adminId);
};

module.exports = connectDatabase;
