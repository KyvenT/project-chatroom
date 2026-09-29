import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useWheelScrollsHorizontally } from "../../src/hooks/useWheelScrollsHorizontally";
import { handleWheelWithoutChaining } from "../../src/hooks/usePreventScrollChaining";

// the home page, holding a carousel of cards with scrollable messages
const Page = () => {
  const rowRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLUListElement>(null);
  useWheelScrollsHorizontally(ref, rowRef);
  return (
    <div data-testid="page" style={{ overflowY: "auto" }}>
      <div ref={rowRef}>
        <ul data-testid="carousel" ref={ref} style={{ overflowX: "auto" }}>
          <li>
            <span data-testid="title">Room</span>
            <ul
              data-testid="messages"
              style={{
                display: "flex",
                flexDirection: "column-reverse",
                overflowY: "auto",
              }}
            />
          </li>
        </ul>
        <button>Edit</button>
      </div>
    </div>
  );
};

type Size = "scrollWidth" | "clientWidth" | "scrollHeight" | "clientHeight";

// jsdom has no layout, so give elements scroll sizes by hand
const setSize = (el: HTMLElement, sizes: Partial<Record<Size, number>>) => {
  for (const [key, value] of Object.entries(sizes)) {
    Object.defineProperty(el, key, { configurable: true, value });
  }
};

const setup = () => {
  render(<Page />);
  const page = screen.getByTestId("page");
  const carousel = screen.getByTestId("carousel");
  const messages = screen.getByTestId("messages");
  setSize(page, { scrollHeight: 2000, clientHeight: 800 });
  setSize(carousel, { scrollWidth: 1000, clientWidth: 400 });
  // messages that all fit, so they aren't a scroll area
  setSize(messages, { scrollHeight: 100, clientHeight: 100 });
  return { page, carousel, messages };
};

// fireEvent returns false when the event's default was prevented
const wheel = (el: HTMLElement, init: WheelEventInit) =>
  !fireEvent.wheel(el, init);

describe("mouse wheel scrolling", () => {
  // the app-wide rule that stops scrolls handing over at an end
  // (wheel listeners on the document are passive unless told otherwise)
  beforeEach(() =>
    document.addEventListener("wheel", handleWheelWithoutChaining, {
      passive: false,
    }),
  );
  afterEach(() =>
    document.removeEventListener("wheel", handleWheelWithoutChaining),
  );

  describe("over a carousel that overflows", () => {
    it("scrolls it sideways with the wheel", () => {
      const { carousel } = setup();

      expect(wheel(screen.getByTestId("title"), { deltaY: 120 })).toBe(true);
      expect(carousel.scrollLeft).toBe(120);

      wheel(carousel, { deltaY: -50 });
      expect(carousel.scrollLeft).toBe(70);
    });

    it("scrolls it from elsewhere in its row, like the edit button", () => {
      const { carousel } = setup();

      expect(
        wheel(screen.getByRole("button", { name: "Edit" }), { deltaY: 120 }),
      ).toBe(true);
      expect(carousel.scrollLeft).toBe(120);
    });

    it("converts line-based wheel deltas to pixels", () => {
      const { carousel } = setup();
      wheel(carousel, { deltaY: 3, deltaMode: WheelEvent.DOM_DELTA_LINE });
      expect(carousel.scrollLeft).toBe(48);
    });

    it("stops at either end instead of scrolling the page", () => {
      const { carousel } = setup();

      expect(wheel(carousel, { deltaY: -120 })).toBe(true);
      expect(carousel.scrollLeft).toBe(0);

      carousel.scrollLeft = 600;
      expect(wheel(carousel, { deltaY: 120 })).toBe(true);
      expect(carousel.scrollLeft).toBe(600);
    });

    it("treats a card's messages that all fit as part of the carousel", () => {
      const { carousel, messages } = setup();

      expect(wheel(messages, { deltaY: 120 })).toBe(true);
      expect(carousel.scrollLeft).toBe(120);
    });

    it("leaves sideways swipes to the browser until the carousel's end", () => {
      const { carousel } = setup();

      expect(wheel(carousel, { deltaX: 80 })).toBe(false);
      carousel.scrollLeft = 600;
      expect(wheel(carousel, { deltaX: 80 })).toBe(true);
    });

    it("leaves ctrl-zoom alone", () => {
      const { carousel } = setup();
      expect(wheel(carousel, { deltaY: 120, ctrlKey: true })).toBe(false);
      expect(carousel.scrollLeft).toBe(0);
    });
  });

  describe("over a card's messages that overflow", () => {
    const overflowing = () => {
      const els = setup();
      // scrolled to the newest message (scrollTop 0 in a column-reverse list)
      setSize(els.messages, { scrollHeight: 500, clientHeight: 100 });
      return els;
    };

    it("scrolls the messages, not the carousel", () => {
      const { carousel, messages } = overflowing();

      expect(wheel(messages, { deltaY: -120 })).toBe(false);
      expect(carousel.scrollLeft).toBe(0);
    });

    it("stops at the newest message instead of moving the carousel", () => {
      const { carousel, messages } = overflowing();

      expect(wheel(messages, { deltaY: 120 })).toBe(true);
      expect(carousel.scrollLeft).toBe(0);
    });

    it("stops at the oldest message", () => {
      const { messages } = overflowing();
      messages.scrollTop = -400;
      expect(wheel(messages, { deltaY: -120 })).toBe(true);
    });
  });

  describe("over a carousel whose cards all fit", () => {
    it("scrolls the page, which is the scroll area under the cursor", () => {
      const { carousel, messages } = setup();
      setSize(carousel, { scrollWidth: 400, clientWidth: 400 });

      expect(wheel(carousel, { deltaY: 120 })).toBe(false);
      expect(wheel(messages, { deltaY: 120 })).toBe(false);
      expect(carousel.scrollLeft).toBe(0);
    });

    it("stops when the page reaches its end", () => {
      const { page, carousel } = setup();
      setSize(carousel, { scrollWidth: 400, clientWidth: 400 });
      page.scrollTop = 1200;

      expect(wheel(carousel, { deltaY: 120 })).toBe(true);
    });
  });
});
