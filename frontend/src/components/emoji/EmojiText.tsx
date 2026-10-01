import { Fragment, useMemo, useState } from "react";
import {
  knownShortcode,
  shortcodeForEmoji,
  splitEmojis,
} from "../../utils/emoji";

// An emoji in a message, showing its shortcode on hover. The emoji data is
// only downloaded once an emoji is hovered.
const Emoji = ({ emoji }: { emoji: string }) => {
  const [shortcode, setShortcode] = useState(() => knownShortcode(emoji));

  return (
    <span
      title={shortcode ?? undefined}
      onMouseEnter={() => {
        if (shortcode !== undefined) return;
        shortcodeForEmoji(emoji)
          .then(setShortcode)
          // no tooltip if the emojis can't load
          .catch(() => setShortcode(null));
      }}
    >
      {emoji}
    </span>
  );
};

// Message text, with its emojis' shortcodes shown on hover
export const EmojiText = ({ text }: { text: string }) => {
  const parts = useMemo(() => splitEmojis(text), [text]);

  return parts.map((part, i) =>
    part.emoji ? (
      <Emoji key={i} emoji={part.text} />
    ) : (
      <Fragment key={i}>{part.text}</Fragment>
    ),
  );
};
