export function computeProjectHours(timeEntries, projects) {
  const hoursById = {};
  for (const e of timeEntries) {
    hoursById[e.projectId] = (hoursById[e.projectId] || 0) + e.hours;
  }
  return projects
    .map(p => ({ id: p.id, name: p.name, hours: Math.round((hoursById[p.id] || 0) * 100) / 100 }))
    .filter(p => p.hours > 0)
    .sort((a, b) => b.hours - a.hours);
}

export function slicesForChart(projectHours, maxSlices = 8) {
  const total = projectHours.reduce((s, p) => s + p.hours, 0);
  if (total === 0) return [];
  const shown = projectHours.slice(0, maxSlices);
  const rest = projectHours.slice(maxSlices);
  const otherHours = Math.round(rest.reduce((s, p) => s + p.hours, 0) * 100) / 100;
  const items = otherHours > 0 ? [...shown, { id: '__other__', name: 'Other', hours: otherHours }] : shown;
  return items.map(p => ({ ...p, pct: p.hours / total }));
}
