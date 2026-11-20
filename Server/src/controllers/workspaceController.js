const mongoose = require("mongoose");
const { branches } = require("../roleOptions");
const User = require("../models/User");
const { Audit, Catalog } = require("../models/workspace");
const { findRole, fail, isProtectedRole } = require("../services/roleService");
const getWorkspace = async (_req, res) => {
  const [members, activity] = await Promise.all([
    User.find().select("name branchId roleId").sort({ name: 1 }).lean(),
    Audit.find().sort({ createdAt: -1, _id: -1 }).limit(100).lean(),
  ]);
  res.json({ branches, members, activity, adminRoleId: process.env.SYSTEM_ADMIN_ROLE_ID });
};
const assignRole = async (req, res) => {
  const member = await mongoose.connection.transaction(async (session) => {
    const target = await User.findById(req.params.id).select("name branchId roleId").session(session);
    if (!target) fail(404, "User not found.");
    if (isProtectedRole(target.roleId))
      fail(409, "The active administrator assignment is protected.");
    const role = await findRole(req.body?.roleId, session);
    if (role.status !== "ACTIVE") fail(409, "An inactive role cannot be assigned.");
    if (isProtectedRole(role._id))
      fail(409, "The System Administrator role is reserved.");
    const previous = target.roleId;
    // Write the role in the same transaction so a simultaneous deactivation conflicts.
    await role.constructor.updateOne(
      { _id: role._id },
      { $inc: { __v: 1 } },
      { session, timestamps: false },
    );
    target.roleId = role._id;
    await target.save({ session });
    await Audit.create(
      [
        {
          actor: req.user.name,
          action: "Role assigned",
          target: target.name,
          roleId: role._id,
          before: { roleId: previous },
          after: { roleId: role._id, roleName: role.name },
        },
      ],
      { session },
    );
    return target;
  });
  res.json({ success: true, member });
};
const checkAccess = async (req, res) => {
  const { userId, module: moduleKey, action, branchId, amount, requiredLevel } = req.body || {};
  const member = await User.findById(userId);
  if (!member) fail(400, "Select an existing user.");
  const catalog = await Catalog.findById(moduleKey);
  if (!catalog?.actions.includes(action) || !branches.some((branch) => branch.id === branchId))
    fail(400, "Select a valid module, action and branch.");
  if (
    action === "APPROVE" &&
    (!Number.isFinite(amount) ||
      amount < 0 ||
      !Number.isSafeInteger(requiredLevel) ||
      requiredLevel < 0)
  )
    fail(400, "Provide a nonnegative approval amount and level.");
  const deny = (reason) => res.json({ allowed: false, reason });
  if (!member.roleId) return deny("This user has no assigned role.");
  const role = await findRole(member.roleId);
  if (role.status !== "ACTIVE") return deny("The assigned role is inactive.");
  if (role.branchScope === "ASSIGNED_BRANCH" && member.branchId !== branchId)
    return deny("This role is limited to the user’s assigned branch.");
  if (role.branchScope === "SELECTED_BRANCHES" && !role.branchIds.includes(branchId))
    return deny("This branch is outside the role’s selected branches.");
  // Use the current role document for both scope and grants in one consistent read.
  if (!role.permissions.some((p) => p.module === moduleKey && p.actions.includes(action)))
    return deny("The role does not grant this action.");
  if (
    action === "APPROVE" &&
    (role.approvalLevel < requiredLevel ||
      (role.approvalLimit !== null && amount > role.approvalLimit))
  )
    return deny("The request exceeds the role’s approval authority.");
  return res.json({
    allowed: true,
    reason: "The current role grants this action at the selected branch.",
  });
};
module.exports = { getWorkspace, assignRole, checkAccess };
