import { useRef, useState } from "react";
import {
  emojiForShortcode,
  replaceText,
  searchEmojis,
  type EmojiMatch,
} from "../utils/emoji";

// a shortcode being typed just before the cursor, like ":smi"
const PARTIAL = /(?:^|\s)(:([\p{L}\p{N}_+-]{2,}))$/u;
// a finished one, like ":smile:"
const COMPLETE = /(?:^|\s)(:([\p{L}\p{N}_+-]+):)$/u;

// how many suggestions show at once
const MAX_SUGGESTIONS = 6;

export interface EmojiSuggestionsState {
  matches: EmojiMatch[];
  active: number;
  choose: (index: number) => void;
}

// Emoji shortcodes in a message box: typing ":smi" suggests emojis to pick
// with the arrow keys and Enter or Tab (or a click), and typing ":smile:"
// turns into the emoji straight away.
//
// Call `onInput` when the box's text changes, and `onKeyDown` first in the
// box's key handler; if it returns true, it used the key.
export const useEmojiAutocomplete = (
  inputRef: React.RefObject<HTMLTextAreaElement | null>,
  // the box's new text, after a shortcode is replaced
  onChange: (value: string) => void,
) => {
  const [matches, setMatches] = useState<EmojiMatch[]>([]);
  const [active, setActive] = useState(0);
  // where the shortcode being typed starts and ends
  const range = useRef({ start: 0, end: 0 });
  // so a slow search doesn't show after a newer one
  const latest = useRef(0);

  const close = () => {
    latest.current++;
    setMatches([]);
  };

  const replace = (start: number, end: number, emoji: string) => {
    const input = inputRef.current;
    if (!input) return;
    const value = replaceText(input, start, end, emoji);
    if (value !== null) onChange(value);
  };

  const choose = (index: number) => {
    const match = matches[index];
    if (!match) return;
    replace(range.current.start, range.current.end, match.native);
    close();
    inputRef.current?.focus();
  };

  const onInput = async () => {
    const input = inputRef.current;
    const search = ++latest.current;
    if (!input || input.selectionStart !== input.selectionEnd) {
      setMatches([]);
      return;
    }
    const cursor = input.selectionStart;
    const before = input.value.slice(0, cursor);

    const complete = COMPLETE.exec(before);
    if (complete) {
      const emoji = await emojiForShortcode(complete[2]);
      if (search !== latest.current) return;
      // only if nothing has changed while the emojis loaded
      if (emoji && input.value.slice(0, cursor) === before) {
        replace(cursor - complete[1].length, cursor, emoji.native);
      }
      setMatches([]);
      return;
    }

    const partial = PARTIAL.exec(before);
    if (!partial) {
      setMatches([]);
      return;
    }
    try {
      const found = await searchEmojis(partial[2], MAX_SUGGESTIONS);
      if (search !== latest.current) return;
      range.current = { start: cursor - partial[1].length, end: cursor };
      setMatches(found);
      setActive(0);
    } catch {
      // emojis couldn't load; the text stays as typed
      if (search === latest.current) setMatches([]);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (matches.length === 0) return false;
    switch (event.key) {
      case "ArrowDown":
        setActive((i) => (i + 1) % matches.length);
        break;
      case "ArrowUp":
        setActive((i) => (i - 1 + matches.length) % matches.length);
        break;
      case "Enter":
      case "Tab":
        if (event.shiftKey) return false;
        choose(active);
        break;
      case "Escape":
        // don't also close whatever the box is in
        event.stopPropagation();
        close();
        break;
      default:
        return false;
    }
    event.preventDefault();
    return true;
  };

  const suggestions: EmojiSuggestionsState = { matches, active, choose };
  return { suggestions, onInput, onKeyDown, close };
};
