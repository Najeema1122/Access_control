const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    branchId: String,
    // Indexed because we count users per role and block deleting assigned roles.
    roleId: { type: Schema.Types.ObjectId, ref: "Role", default: null, index: true },
  },
  { versionKey: false, autoCreate: false },
);

module.exports = model("User", userSchema, "users");