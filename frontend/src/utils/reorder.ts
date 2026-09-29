// ids with `id` moved next to `targetId`: after it if `after`, else before
export const moveId = (
  ids: string[],
  id: string,
  targetId: string,
  after: boolean,
) => {
  if (id === targetId || !ids.includes(id) || !ids.includes(targetId)) {
    return ids;
  }
  const rest = ids.filter((i) => i !== id);
  const at = rest.indexOf(targetId) + (after ? 1 : 0);
  return [...rest.slice(0, at), id, ...rest.slice(at)];
};

// ids with `id` moved one place towards the start (-1) or end (1)
export const shiftId = (ids: string[], id: string, by: -1 | 1) => {
  const from = ids.indexOf(id);
  const to = from + by;
  if (from === -1 || to < 0 || to >= ids.length) return ids;
  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
};

export const sameOrder = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id, i) => id === b[i]);
