const mongoose = require("mongoose");
const Role = require("../models/Role");
const User = require("../models/User");
const { Audit, Grants } = require("../models/workspace");
const roleFields = [
  "name",
  "description",
  "status",
  "branchScope",
  "branchIds",
  "approvalLevel",
  "approvalLimit",
  "permissions",
];
const protectedFields = ["name", "status", "branchScope", "branchIds", "permissions"];
const auditGroups = [
  { action: "Permissions modified", fields: ["permissions"] },
  { action: "Branch scope changed", fields: ["branchScope", "branchIds"] },
  { action: "Approval settings changed", fields: ["approvalLevel", "approvalLimit"] },
];

const fail = (status, message) => {
  const error = new Error(message);
  error.httpStatus = status;
  throw error;
};
const isProtectedRole = (id) => String(id) === process.env.SYSTEM_ADMIN_ROLE_ID;
const findRole = async (id, session = null) => {
  if (!mongoose.isObjectIdOrHexString(id)) fail(400, "Invalid role ID.");
  const role = await Role.findById(id).session(session);
  if (!role) fail(404, "Role not found.");
  return role;
};
const toRoleResponse = (role, usersAssigned = 0) => ({
  ...role.toObject(),
  usersAssigned,
  protected: isProtectedRole(role.id),
});
const selectFields = (source, fields) => {
  const result = {};
  for (const field of fields) {
    if (Object.hasOwn(source, field)) result[field] = source[field];
  }
  return result;
};
const readRoleFields = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) fail(400, "Provide role details.");
  const values = selectFields(body, roleFields);
  if (!Object.keys(values).length) fail(400, "Provide at least one role field.");
  if (Object.hasOwn(values, "approvalLevel") && !Number.isSafeInteger(values.approvalLevel))
    fail(400, "Approval level must be a whole number.");
  if (values.approvalLimit != null && !Number.isFinite(values.approvalLimit))
    fail(400, "Enter a numeric approval limit.");
  return values;
};
const snapshot = (role) => selectFields(role.toObject(), roleFields);

// Save the role, its grants, and the audit trail together. A failed write rolls them all back.
const saveRole = async ({ role, actor, action, before = null, session }) => {
  await role.save({ session });
  await Grants.updateOne(
    { _id: role.id },
    { $set: { permissions: role.permissions } },
    { upsert: true, session },
  );
  const after = snapshot(role);
  const events = [{ actor, action, target: role.name, roleId: role.id, before, after }];
  if (before && action !== "Role cloned") {
    for (const group of auditGroups) {
      const previousValues = selectFields(before, group.fields);
      const newValues = selectFields(after, group.fields);
      if (action !== group.action && JSON.stringify(previousValues) !== JSON.stringify(newValues)) {
        events.push({
          actor,
          action: group.action,
          target: role.name,
          roleId: role.id,
          before: previousValues,
          after: newValues,
        });
      }
    }
  }
  await Audit.insertMany(events, { session });
  const count = await User.countDocuments({ roleId: role.id }).session(session);
  return toRoleResponse(role, count);
};
const editRole = async (id, values, actor, action = "Role updated") =>
  mongoose.connection.transaction(async (session) => {
    const role = await findRole(id, session);
    const before = snapshot(role);
    role.set(values);
    if (isProtectedRole(role.id) && protectedFields.some((field) => role.isModified(field))) {
      fail(409, "The built-in System Administrator must stay active with its original access.");
    }
    if (role.isModified("status"))
      action = role.status === "ACTIVE" ? "Role activated" : "Role deactivated";
    return saveRole({ role, actor, action, before, session });
  });

module.exports = {
  findRole,
  fail,
  isProtectedRole,
  toRoleResponse,
  readRoleFields,
  snapshot,
  saveRole,
  editRole,
};
