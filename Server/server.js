require("dotenv").config({ quiet: true });
const express = require("express");
const path = require("node:path");
const fs = require("node:fs");
const roleRoutes = require("./src/routes/roleRoutes");
const permissionRoutes = require("./src/routes/permissionRoutes");
const connectDatabase = require("./src/database");
const loadAdministrator = require("./src/middleware/loadAdministrator");
const requireAdmin = require("./src/middleware/requireAdmin");
const { getWorkspace, assignRole, checkAccess } = require("./src/controllers/workspaceController");
const app = express();
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.set("Access-Control-Allow-Origin", process.env.CLIENT_ORIGIN || "http://localhost:5173");
  res.set("X-Content-Type-Options", "nosniff");
  if (_req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json({ limit: "64kb" }));
// Concurrent requests share one database startup on each server instance.
let databaseReady;
const ensureDatabase = () => {
  if (!databaseReady) {
    databaseReady = connectDatabase().catch((error) => {
      databaseReady = undefined;
      throw error;
    });
  }
  return databaseReady;
};
const api = express.Router();
api.use(async (_req, _res, next) => {
  await ensureDatabase();
  next();
});
api.get("/health", (_req, res) => res.json({ status: "ok" }));
api.use("/roles", roleRoutes);
api.use("/permissions", permissionRoutes);
api.get("/workspace", getWorkspace);
api.get("/session", loadAdministrator, requireAdmin, (req, res) =>
  res.json({ name: req.user.name }),
);
api.put("/members/:id/role", loadAdministrator, requireAdmin, assignRole);
api.post("/access-check", checkAccess);
app.use("/api", api);
app.use("/", api);
app.use("/api", (_req, res) => res.status(404).json({ message: "API route not found." }));
const client = path.resolve(__dirname, "../Client/dist");
if (fs.existsSync(path.join(client, "index.html"))) {
  app.use(express.static(client));
  app.get("/", (_req, res) => res.sendFile(path.join(client, "index.html")));
}
app.use((error, _req, res, _next) => {
  if (error.code === 11000)
    return res.status(409).json({ message: "A role with this name already exists." });
  if (error.name === "ValidationError")
    return res
      .status(400)
      .json({ message: Object.values(error.errors)[0]?.message || "Invalid role." });
  if (error.name === "CastError" || error.type === "entity.parse.failed")
    return res.status(400).json({ message: "Invalid request." });
  if (error.httpStatus) return res.status(error.httpStatus).json({ message: error.message });
  console.error("Request failed:", error.name, error.code || "");
  res.status(500).json({ message: "The request could not be completed." });
});
const startServer = async () => {
  await ensureDatabase();
  const port = Number(process.env.PORT || 5000);
  const server = app.listen(port, "0.0.0.0", () =>
    console.log("Access Control listening on port " + port),
  );
  server.on("error", (error) => {
    console.error("Listen failed:", error.code);
    process.exit(1);
  });
};
module.exports = app;

if (require.main === module) {
  startServer().catch((error) => {
    console.error(
      "Startup failed:",
      error.name,
      error.code || "",
      error.httpStatus ? error.message : "Check database access and server configuration.",
    );
    process.exit(1);
  });
}
