import axios from "axios";
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "/api"),
  timeout: 20000,
});
const auth = (token) => ({ headers: { Authorization: "Bearer " + token } });
export const loadWorkspace = async () => {
  const [roles, permissions, workspace] = await Promise.all([
    api.get("/roles"),
    api.get("/permissions"),
    api.get("/workspace"),
  ]);
  return { ...workspace.data, roles: roles.data, catalog: permissions.data };
};
export const verifyAdmin = async (token) => (await api.get("/session", auth(token))).data;
export const getRoleById = async (id) => (await api.get("/roles/" + id)).data;
export const createRole = async (body, token) =>
  (await api.post("/roles", body, auth(token))).data.role;
export const updateRole = async (id, body, token) =>
  (await api.put("/roles/" + id, body, auth(token))).data.role;
export const cloneRole = async (id, name, token) =>
  (await api.post("/roles/" + id + "/clone", { name }, auth(token))).data.role;
export const setStatus = async (id, status, token) =>
  (await api.patch("/roles/" + id + "/status", { status }, auth(token))).data.role;
export const setPermissions = async (id, permissions, token) =>
  (await api.put("/roles/" + id + "/permissions", { permissions }, auth(token))).data.role;
export const assignRole = async (id, roleId, token) =>
  (await api.put("/members/" + id + "/role", { roleId }, auth(token))).data.member;
export const checkAccess = async (body) => (await api.post("/access-check", body)).data;
export const errorMessage = (error) =>
  error.response?.data?.message || "The server could not be reached. Please try again.";
