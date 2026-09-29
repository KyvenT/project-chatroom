import { useState } from "react";
import type React from "react";
import { moveId, sameOrder } from "../utils/reorder";

// our own drag type, so other drop targets (e.g. sidebar folders, which read
// application/json) ignore these drags
const DRAG_TYPE = "application/x-reorder-item";

type DropTarget = { id: string; after: boolean };

// Drag and drop reordering for a list of items identified by id. Spread
// itemProps(id) onto each item and containerProps onto the list. Items only
// drop within the list they were dragged from.
export const useDragReorder = ({
  ids,
  axis,
  onReorder,
}: {
  ids: string[];
  // which way the list runs, to tell "before" from "after" an item
  axis: "x" | "y";
  onReorder: (ids: string[]) => void;
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const reset = () => {
    setDraggingId(null);
    setDropTarget(null);
  };

  const commit = () => {
    if (draggingId && dropTarget) {
      const next = moveId(ids, draggingId, dropTarget.id, dropTarget.after);
      if (!sameOrder(next, ids)) onReorder(next);
    }
    reset();
  };

  const itemProps = (id: string) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      // a nested draggable (e.g. the sidebar) shouldn't also start dragging
      e.stopPropagation();
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(DRAG_TYPE, id);
      setDraggingId(id);
    },
    onDragOver: (e: React.DragEvent) => {
      if (!draggingId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const box = e.currentTarget.getBoundingClientRect();
      const after =
        axis === "x"
          ? e.clientX > box.left + box.width / 2
          : e.clientY > box.top + box.height / 2;
      if (dropTarget?.id !== id || dropTarget.after !== after) {
        setDropTarget({ id, after });
      }
    },
    onDrop: (e: React.DragEvent) => {
      if (!draggingId) return;
      e.preventDefault();
      e.stopPropagation();
      commit();
    },
    onDragEnd: reset,
  });

  // dropping in the gaps between items uses the last item hovered
  const containerProps = {
    onDragOver: (e: React.DragEvent) => {
      if (draggingId) e.preventDefault();
    },
    onDrop: (e: React.DragEvent) => {
      if (!draggingId) return;
      e.preventDefault();
      commit();
    },
  };

  // class names for an item's drag state, for styling
  const itemState = (id: string) =>
    [
      draggingId === id && "dragging",
      dropTarget?.id === id && draggingId !== id
        ? dropTarget.after
          ? "dropAfter"
          : "dropBefore"
        : false,
    ]
      .filter(Boolean)
      .join(" ");

  return { itemProps, containerProps, itemState, draggingId };
};
