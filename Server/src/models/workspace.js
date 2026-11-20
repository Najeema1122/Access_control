const { Schema, model } = require("mongoose");
const permissionRowSchema = require("./permissionRowSchema");

// One catalog entry lists all actions available for a module. Its ID is the module name.
const catalogSchema = new Schema(
  {
    _id: String,
    actions: [String],
  },
  { versionKey: false },
);

// One document per role, keyed by the role's ID.
const grantsSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,
    permissions: [permissionRowSchema],
  },
  { versionKey: false },
);

// One history entry per change. The before and after values depend on what changed.
const auditSchema = new Schema(
  {
    actor: { type: String, required: true },
    action: { type: String, required: true }, // e.g. ROLE_CREATED, PERMISSION_MODIFIED
    target: String,
    roleId: { type: Schema.Types.ObjectId, index: true },
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false },
);

module.exports = {
  Grants: model("Grants", grantsSchema, "role_permissions"),
  Catalog: model("Catalog", catalogSchema, "permissions"),
  Audit: model("Audit", auditSchema, "audit_logs"),
};