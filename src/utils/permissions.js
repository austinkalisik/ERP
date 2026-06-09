export const can = (permissions, permission) => {
  if (!permissions) return false;
  if (permissions.includes("*")) return true;
  return permissions.includes(permission);
};
