const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Enter a valid administrator token." });
  const role = req.user.role;
  if (
    role?.status !== "ACTIVE" ||
    role.id !== process.env.SYSTEM_ADMIN_ROLE_ID ||
    role.branchScope !== "ALL_BRANCHES"
  ) {
    return res
      .status(403)
      .json({
        message: "An active workspace administrator with access to all branches is required.",
      });
  }
  return next();
};
module.exports = requireAdmin;
