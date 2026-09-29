import { useState } from "react";

const load = (storageKey: string): Set<string> => {
  try {
    const stored = localStorage.getItem(storageKey);
    return new Set(stored ? (JSON.parse(stored) as string[]) : []);
  } catch {
    return new Set();
  }
};

// Ids of collapsed sections, remembered per browser under storageKey
export const useCollapsedIds = (storageKey: string) => {
  const [collapsedIds, setCollapsedIds] = useState(() => load(storageKey));

  const toggleCollapsed = (id: string) =>
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        // storage unavailable; the section just won't stay collapsed on reload
      }
      return next;
    });

  return {
    isCollapsed: (id: string) => collapsedIds.has(id),
    toggleCollapsed,
  };
};
