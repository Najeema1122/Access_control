import PaginatedTable from "./PaginatedTable";
import { Check, Minus } from "lucide-react";
import { actions, title } from "../lib/display";
const PermissionMatrix = ({ catalog, value, onChange }) => {
  const toggle = (module, action) => {
    const current = value.find((p) => p.module === module)?.actions || [];
    let selectedActions;
    if (!action) {
      // Enabling a whole module starts with its View permission.
      selectedActions = current.length ? [] : ["VIEW"];
    } else if (current.includes(action)) {
      selectedActions = current.filter((selected) => selected !== action);
    } else {
      selectedActions = [...current, action];
    }
    const nextPermissions = value.filter((entry) => entry.module !== module);
    if (selectedActions.length) nextPermissions.push({ module, actions: selectedActions });
    onChange(nextPermissions);
  };
  return (
    <PaginatedTable
      className="matrix"
      headers={["Module", ...actions.map(title)]}
      rows={catalog}
      renderRow={({ module, actions: supported }) => {
        const grants = value.find((p) => p.module === module)?.actions || [];
        return (
          <tr key={module}>
            <th scope="row">
              {onChange ? (
                <label className="inline-check">
                  <input
                    type="checkbox"
                    checked={grants.length > 0}
                    onChange={() => toggle(module)}
                    aria-label={"Enable " + title(module)}
                  />
                  {title(module)}
                </label>
              ) : (
                title(module)
              )}
            </th>
            {actions.map((a) => (
              <td key={a}>
                {!supported.includes(a) ? (
                  <span className="muted" aria-label="Unavailable">
                    —
                  </span>
                ) : onChange ? (
                  <input
                    type="checkbox"
                    aria-label={title(module) + " " + title(a)}
                    checked={grants.includes(a)}
                    onChange={() => toggle(module, a)}
                  />
                ) : grants.includes(a) ? (
                  <Check className="grant" size={18} aria-label="Granted" />
                ) : (
                  <Minus size={13} aria-label="Not granted" />
                )}
              </td>
            ))}
          </tr>
        );
      }}
    />
  );
};
export default PermissionMatrix;
