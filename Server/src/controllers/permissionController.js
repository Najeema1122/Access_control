const { permissionOptions } = require("../roleOptions");
const { Catalog } = require("../models/workspace");
const getPermissions = async (_req, res) => {
  const rows = await Catalog.find().lean();
  const byModule = new Map(rows.map((row) => [row._id, row.actions]));
  res.json(permissionOptions.map(({ module }) => ({ module, actions: byModule.get(module) || [] })));
};
module.exports = { getPermissions };
