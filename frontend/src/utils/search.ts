// Case-insensitive "contains" search on titles

export const normalizeQuery = (query: string) =>
  query.trim().toLocaleLowerCase();

// query should already be normalized
export const matchesQuery = (text: string, query: string) =>
  query === "" || text.toLocaleLowerCase().includes(query);

// text split into the parts that match the query and the parts that don't
export const splitMatches = (text: string, query: string) => {
  if (!query) return [{ text, match: false }];
  const lower = text.toLocaleLowerCase();
  const parts: { text: string; match: boolean }[] = [];
  let from = 0;
  for (
    let at = lower.indexOf(query);
    at !== -1;
    at = lower.indexOf(query, from)
  ) {
    if (at > from) parts.push({ text: text.slice(from, at), match: false });
    parts.push({ text: text.slice(at, at + query.length), match: true });
    from = at + query.length;
  }
  if (from < text.length) parts.push({ text: text.slice(from), match: false });
  return parts;
};
