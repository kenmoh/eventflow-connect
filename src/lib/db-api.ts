export const internal_loadCatalog = async () => {
  const { dbLoadCatalog } = await import('./db.server');
  return dbLoadCatalog();
};

export const internal_loadEmployees = async () => {
  const { dbLoadEmployees } = await import('./db.server');
  return dbLoadEmployees();
};

export const internal_loadActivity = async () => {
  const { dbLoadActivity } = await import('./db.server');
  return dbLoadActivity();
};
