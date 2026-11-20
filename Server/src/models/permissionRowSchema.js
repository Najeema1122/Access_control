const { Schema } = require("mongoose");

// One row of the permission matrix, such as CUSTOMER with VIEW and EDIT.
const permissionRowSchema = new Schema(
  {
    module: { type: String, required: true, trim: true, uppercase: true },
    actions: [{ type: String, trim: true, uppercase: true }],
  },
  { _id: false },
);

module.exports = permissionRowSchema;