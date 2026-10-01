import { useTheme, type Theme } from "@emotion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { loadEmojiMart } from "../../utils/emoji";
import { Loader } from "../Loader";

// space (px) kept between the picker and its button, and the window's edges
const GAP = 6;
const EDGE = 8;
// the size of each emoji's button in the picker, and the picker's padding
// beside them, for fitting it in narrow windows
const EMOJI_BUTTON_SIZE = 36;
const SIDE_PADDING = 40;

// "#rrggbb" as the "r, g, b" emoji-mart's colors are set with
const rgb = (hex: string) => {
  const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  return match
    ? match
        .slice(1)
        .map((part) => parseInt(part, 16))
        .join(", ")
    : null;
};

// the picker in the app's colors, which the user can change
const applyTheme = (picker: HTMLElement, theme: Theme) => {
  const vars: Record<string, string | null> = {
    "--rgb-background": rgb(theme.colors.dark_grey),
    "--rgb-color": rgb(theme.colors.white),
    "--rgb-accent": rgb(theme.colors.accent),
    "--rgb-input": rgb(theme.colors.black),
    "--color-border": theme.colors.border,
    "--color-border-over": theme.colors.borderStrong,
  };
  Object.entries(vars).forEach(
    ([name, value]) => value && picker.style.setProperty(name, value),
  );
};

interface EmojiPickerProps {
  // the button that opened the picker, which it shows beside
  anchor: HTMLElement;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

// A searchable emoji picker, shown above (or below) the button that opened
// it. Closes on Escape or a click outside it.
export const EmojiPicker = ({
  anchor,
  onSelect,
  onClose,
}: EmojiPickerProps) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  // where emoji-mart's picker goes, apart from what React renders
  const mountRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [position, setPosition] = useState({ top: -9999, left: -9999 });
  // the latest handlers, without making the picker again when they change
  const onSelectRef = useRef(onSelect);
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onSelectRef.current = onSelect;
    onCloseRef.current = onClose;
  });

  // pop-outs can be in another window, so it's the button's window that counts
  const doc = anchor.ownerDocument;
  const win = doc.defaultView ?? window;

  useEffect(() => {
    let cancelled = false;
    let picker: HTMLElement | null = null;

    loadEmojiMart()
      .then(({ emojiMart, data }) => {
        if (cancelled || !mountRef.current) return;
        const perLine = Math.max(
          6,
          Math.min(
            9,
            Math.floor(
              (win.innerWidth - 2 * EDGE - SIDE_PADDING) / EMOJI_BUTTON_SIZE,
            ),
          ),
        );
        picker = new emojiMart.Picker({
          data,
          onEmojiSelect: (emoji: { native: string }) =>
            onSelectRef.current(emoji.native),
          autoFocus: true,
          // shows the hovered emoji's name and shortcode
          previewPosition: "bottom",
          skinTonePosition: "search",
          perLine,
          emojiButtonSize: EMOJI_BUTTON_SIZE,
          theme: "dark",
        }) as unknown as HTMLElement;
        applyTheme(picker, theme);
        mountRef.current.appendChild(picker);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      picker?.remove();
    };
    // made once; the theme and window stay the same while it's open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // above the button if there's room, otherwise below, kept in the window
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const place = () => {
      const button = anchor.getBoundingClientRect();
      const { width, height } = container.getBoundingClientRect();
      const above = button.top - GAP - height;
      const top =
        above >= EDGE || button.bottom + GAP + height > win.innerHeight
          ? Math.max(EDGE, above)
          : button.bottom + GAP;
      const left = Math.min(
        Math.max(EDGE, button.right - width),
        win.innerWidth - width - EDGE,
      );
      setPosition({ top, left: Math.max(EDGE, left) });
    };

    place();
    // the observer from the picker's own window, which may be a pop-out
    const observer = new win.ResizeObserver(place);
    observer.observe(container);
    win.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      win.removeEventListener("resize", place);
    };
  }, [anchor, win]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      // the button toggles the picker itself
      if (containerRef.current?.contains(target) || anchor.contains(target)) {
        return;
      }
      onCloseRef.current();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // don't also close whatever the picker is in
      event.stopPropagation();
      onCloseRef.current();
      anchor.focus();
    };

    doc.addEventListener("mousedown", onMouseDown);
    doc.addEventListener("keydown", onKeyDown, true);
    return () => {
      doc.removeEventListener("mousedown", onMouseDown);
      doc.removeEventListener("keydown", onKeyDown, true);
    };
  }, [anchor, doc]);

  return createPortal(
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Choose an emoji"
      data-testid="emoji-picker"
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 1000,
        borderRadius: theme.radius.md,
        boxShadow: theme.shadow.popup,
        // empty until the picker has loaded
        ...(!loaded && {
          padding: "16px",
          border: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.dark_grey,
          color: theme.colors.light_grey,
          fontSize: "0.8rem",
        }),
      }}
    >
      {!loaded && (failed ? "Couldn't load emojis" : <Loader />)}
      <div ref={mountRef} />
    </div>,
    doc.body,
  );
};
