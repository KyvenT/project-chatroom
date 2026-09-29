import { useEffect } from "react";
import { canScrollFurther, closestScrollArea } from "../utils/scrollAreas";

// The mouse wheel only scrolls the innermost scroll area under the cursor
// that can scroll that way. When that area reaches its end the wheel stops
// there, instead of the browser moving on to the area around it. Areas whose
// content all fits aren't scroll areas, so they're skipped over.
export const handleWheelWithoutChaining = (e: WheelEvent) => {
  // already handled (e.g. a carousel), or pinch/ctrl zoom
  if (e.defaultPrevented || e.ctrlKey) return;

  const horizontal = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
  const axis = horizontal ? "x" : "y";
  const delta = horizontal ? e.deltaX || e.deltaY : e.deltaY;
  if (!delta) return;

  const area = closestScrollArea(e.target as Element | null, axis);
  // nothing inside the page can scroll that way; the page handles it
  if (!area) return;

  if (!canScrollFurther(area, axis, delta)) e.preventDefault();
};

export const usePreventScrollChaining = () => {
  useEffect(() => {
    // not passive, so it can stop the browser scrolling the outer area
    document.addEventListener("wheel", handleWheelWithoutChaining, {
      passive: false,
    });
    return () =>
      document.removeEventListener("wheel", handleWheelWithoutChaining);
  }, []);
};
