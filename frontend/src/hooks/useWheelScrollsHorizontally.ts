import { useEffect, type RefObject } from "react";
import { closestScrollArea, overflows } from "../utils/scrollAreas";

// px per wheel "line" when the browser reports deltas in lines
const LINE_HEIGHT = 16;

const wheelDeltaPx = (e: WheelEvent, pageSize: number) =>
  e.deltaMode === WheelEvent.DOM_DELTA_LINE
    ? e.deltaY * LINE_HEIGHT
    : e.deltaMode === WheelEvent.DOM_DELTA_PAGE
      ? e.deltaY * pageSize
      : e.deltaY;

// Turns vertical mouse wheel scrolling over a horizontal scroller into
// sideways scrolling, stopping at either end. A vertical scroll area inside
// it (e.g. a card's messages) keeps the wheel when the cursor is over it,
// and a scroller whose content all fits leaves the wheel alone. Pass area to
// also take the wheel over things around the scroller (e.g. its row).
// usePreventScrollChaining handles stopping at the ends of everything else.
export const useWheelScrollsHorizontally = (
  ref: RefObject<HTMLElement | null>,
  areaRef: RefObject<HTMLElement | null> = ref,
) => {
  useEffect(() => {
    const el = ref.current;
    const area = areaRef.current;
    if (!el || !area) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.shiftKey) return;
      // sideways swipes scroll sideways natively
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      // nothing to scroll sideways, so it isn't a scroll area
      if (!overflows(el, "x")) return;
      // the cursor is over a vertical scroll area inside the carousel
      if (closestScrollArea(e.target as Element | null, "y", area)) return;

      e.preventDefault();
      const max = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft + wheelDeltaPx(e, el.clientWidth);
      el.scrollLeft = Math.min(max, Math.max(0, next));
    };

    // not passive, so the page doesn't also scroll
    area.addEventListener("wheel", handleWheel, { passive: false });
    return () => area.removeEventListener("wheel", handleWheel);
  }, [ref, areaRef]);
};
