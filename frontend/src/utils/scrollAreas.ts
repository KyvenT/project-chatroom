// Helpers for finding what the mouse wheel would scroll

const scrollsInAxis = (el: Element, axis: "x" | "y") => {
  const style = getComputedStyle(el);
  const overflow = axis === "y" ? style.overflowY : style.overflowX;
  return overflow === "auto" || overflow === "scroll";
};

// whether el has more content than fits in that axis
export const overflows = (el: Element, axis: "x" | "y") =>
  axis === "y"
    ? el.scrollHeight - el.clientHeight > 1
    : el.scrollWidth - el.clientWidth > 1;

// a scroll area the user can scroll in that axis right now
export const isScrollArea = (el: Element, axis: "x" | "y") =>
  scrollsInAxis(el, axis) && overflows(el, axis);

// whether el can move any further in the direction of delta;
// column-reverse lists count scrollTop from the bottom (0) up into negative
// numbers, and row-reverse ones count scrollLeft the same way
export const canScrollFurther = (
  el: Element,
  axis: "x" | "y",
  delta: number,
) => {
  const style = getComputedStyle(el);
  const [max, pos, reversed] =
    axis === "y"
      ? [
          el.scrollHeight - el.clientHeight,
          el.scrollTop,
          style.flexDirection === "column-reverse",
        ]
      : [
          el.scrollWidth - el.clientWidth,
          el.scrollLeft,
          style.flexDirection === "row-reverse",
        ];
  const fromStart = reversed ? max + pos : pos;
  return delta > 0 ? fromStart < max - 1 : fromStart > 1;
};

// the innermost scroll area at or above target, stopping before `until`
export const closestScrollArea = (
  target: Element | null,
  axis: "x" | "y",
  until: Element | null = document.documentElement,
) => {
  for (let el = target; el && el !== until; el = el.parentElement) {
    if (isScrollArea(el, axis)) return el;
  }
  return null;
};
