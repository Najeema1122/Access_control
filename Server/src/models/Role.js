const mongoose = require("mongoose");
const permissionRowSchema = require("./permissionRowSchema");
const { permissionOptions, branches } = require("../roleOptions");

const branchIds = branches.map((branch) => branch.id);

const roleSchema = new mongoose.Schema(
  {
    // Details shown on the Add Role form.
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      // No "unique: true" here. The case-insensitive index below handles it.
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      required: true,
    },

    // Protected roles (for example System Administrator) cannot be deleted or deactivated.
    isSystem: { type: Boolean, default: false, immutable: true },

    // Where the role applies and what it can do.
    branchScope: {
      type: String,
      enum: ["ASSIGNED_BRANCH", "SELECTED_BRANCHES", "ALL_BRANCHES"],
      default: "ASSIGNED_BRANCH",
      required: true,
    },
    branchIds: [{ type: String, enum: branchIds }],
    permissions: [permissionRowSchema],

    // Level 0 means no approval authority.
    approvalLevel: {
      type: Number,
      default: 0,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
    // A null limit means there is no amount cap.
    approvalLimit: {
      type: Number,
      default: null,
      min: 0,
      validate: (amount) => amount === null || Number.isFinite(amount),
    },
  },
  { timestamps: true, optimisticConcurrency: true },
);

// A role name must be unique even when capitalization differs.
roleSchema.index(
  { name: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
    name: "unique_role_name_case_insensitive",
  },
);

// Helps filtering the Role List by status.
roleSchema.index({ status: 1 });

const hasValidPermissions = (rows) => {
  if (!rows || rows.length === 0) return false;

  const usedModules = new Set();
  for (const row of rows) {
    if (!row || usedModules.has(row.module)) return false;
    usedModules.add(row.module);

    const moduleRules = permissionOptions.find((entry) => entry.module === row.module);
    if (!moduleRules || !row.actions?.length) return false;

    const usedActions = new Set();
    for (const action of row.actions) {
      if (!moduleRules.actions.includes(action) || usedActions.has(action)) return false;
      usedActions.add(action);
    }
  }
  return true;
};

roleSchema.path("permissions").validate(
  hasValidPermissions,
  "Select at least one valid permission. Each module and action may appear once.",
);

roleSchema.pre("validate", function checkSelectedBranches() {
  // In this Mongoose hook, "this" is the role being checked.
  if (this.branchScope !== "SELECTED_BRANCHES") {
    this.branchIds = [];
    return;
  }
  if (!this.branchIds?.length) {
    this.invalidate("branchIds", "Choose at least one branch.");
    return;
  }
  this.branchIds = [...new Set(this.branchIds)];
});

// Business rule: a protected role cannot be deactivated.
roleSchema.pre("save", function protectSystemRole() {
  if (this.isSystem && this.status === "INACTIVE") {
    this.invalidate("status", "A protected role cannot be deactivated.");
  }
});

// Business rule: a protected role cannot be deleted.
roleSchema.pre("deleteOne", { document: true, query: false }, function protectFromDelete() {
  if (this.isSystem) throw new Error("A protected role cannot be deleted.");
});

module.exports = mongoose.model("Role", roleSchema);