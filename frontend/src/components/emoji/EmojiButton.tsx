import { useTheme } from "@emotion/react";
import { Smile } from "lucide-react";
import { useState } from "react";
import { iconBtnStyles } from "../../styles/iconButton";
import { insertAtCursor } from "../../utils/emoji";
import { EmojiPicker } from "./EmojiPicker";

interface EmojiButtonProps {
  // the text box emojis are put in, where its cursor is
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  // the text box's new text, after an emoji is put in
  onChange: (value: string) => void;
  size?: string;
}

// Opens an emoji picker for a message box
export const EmojiButton = ({
  inputRef,
  onChange,
  size = "2.25rem",
}: EmojiButtonProps) => {
  const theme = useTheme();
  // the button, while its picker is open
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const insert = (emoji: string) => {
    const input = inputRef.current;
    if (!input) return;
    const value = insertAtCursor(input, emoji);
    setAnchor(null);
    input.focus();
    if (value !== null) onChange(value);
  };

  return (
    <>
      <button
        type="button"
        css={[
          iconBtnStyles(theme),
          { width: size, height: size, flex: "0 0 auto" },
        ]}
        aria-label="Add an emoji"
        aria-expanded={!!anchor}
        onClick={(event) => {
          const button = event.currentTarget;
          setAnchor((open) => (open ? null : button));
        }}
      >
        <Smile size="1.15rem" />
      </button>
      {anchor && (
        <EmojiPicker
          anchor={anchor}
          onSelect={insert}
          onClose={() => setAnchor(null)}
        />
      )}
    </>
  );
};
