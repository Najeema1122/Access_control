const mongoose = require("mongoose");
const Role = require("../models/Role");
const User = require("../models/User");
const {
  findRole,
  fail,
  toRoleResponse,
  readRoleFields,
  snapshot,
  saveRole,
  editRole,
} = require("../services/roleService");

const getRoles = async (_req, res) => {
  const roles = await Role.find().sort({ createdAt: -1 });
  const counts = await User.aggregate([{ $group: { _id: "$roleId", total: { $sum: 1 } } }]);
  const usersByRole = new Map(counts.map(({ _id, total }) => [String(_id), total]));
  res.json(roles.map((role) => toRoleResponse(role, usersByRole.get(role.id) || 0)));
};
const getRoleById = async (req, res) => {
  const role = await findRole(req.params.id);
  const count = await User.countDocuments({ roleId: role.id });
  res.json(toRoleResponse(role, count));
};
const createRole = async (req, res) => {
  const values = readRoleFields(req.body);
  const role = await mongoose.connection.transaction((session) =>
    saveRole({ role: new Role(values), actor: req.user.name, action: "Role created", session }),
  );
  res.status(201).json({ success: true, role });
};
const cloneRole = async (req, res) => {
  const name = req.body?.name;
  if (typeof name !== "string" || !name.trim()) fail(400, "Give the copy a unique name.");
  const role = await mongoose.connection.transaction(async (session) => {
    const source = await findRole(req.params.id, session);
    const copy = new Role({ ...snapshot(source), name });
    return saveRole({
      role: copy,
      actor: req.user.name,
      action: "Role cloned",
      before: { source: source.name },
      session,
    });
  });
  res.status(201).json({ success: true, role });
};
const updateRole = async (req, res) => {
  const values = readRoleFields(req.body);
  const role = await editRole(req.params.id, values, req.user.name);
  res.json({ success: true, role });
};
const setStatus = async (req, res) => {
  const status = req.body?.status;
  if (!["ACTIVE", "INACTIVE"].includes(status)) fail(400, "Choose Active or Inactive.");
  const role = await editRole(req.params.id, { status }, req.user.name);
  res.json({ success: true, role });
};
const setPermissions = async (req, res) => {
  const permissions = req.body?.permissions;
  if (!Array.isArray(permissions)) fail(400, "Provide module permissions.");
  const role = await editRole(
    req.params.id,
    { permissions },
    req.user.name,
    "Permissions modified",
  );
  res.json({ success: true, role });
};
module.exports = {
  getRoles,
  getRoleById,
  createRole,
  cloneRole,
  updateRole,
  setStatus,
  setPermissions,
};
