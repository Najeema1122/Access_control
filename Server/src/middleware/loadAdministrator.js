const { timingSafeEqual } = require("node:crypto");
const Role = require("../models/Role");
const loadAdministrator = async (req, res, next) => {
  const token = process.env.DEMO_ADMIN_TOKEN;
  if (!token) return next();
  const actual = Buffer.from(req.get("Authorization") || "");
  const expected = Buffer.from("Bearer " + token);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return next();
  req.user = {
    name: "System Administrator",
    role: await Role.findById(process.env.SYSTEM_ADMIN_ROLE_ID),
  };
  return next();
};
module.exports = loadAdministrator;
