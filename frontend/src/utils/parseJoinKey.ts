const JOIN_KEY_PATTERN = /^[A-Za-z0-9_-]{16}$/;

// Accepts either a bare join key or a full invite link (".../join/<key>")
// and returns the key, or null if the input isn't a valid key.
export const parseJoinKey = (input: string): string | null => {
  const trimmed = input.trim();
  const fromLink = trimmed.match(/\/join\/([^/?#\s]+)/);
  const candidate = fromLink ? fromLink[1] : trimmed;
  return JOIN_KEY_PATTERN.test(candidate) ? candidate : null;
};
