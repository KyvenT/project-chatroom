import { useState } from "react";
import { EmojiPicker } from "../components/emoji/EmojiPicker";
import type { Reaction } from "../types/REST-types/Message";
import { setReaction } from "../utils/messageChanges";
import { useAuthStore } from "./useStores";

// Reacting to a message: toggling an emoji, and a picker for a new one
export const useReactions = (messageId: string, reactions: Reaction[]) => {
  const userId = useAuthStore((state) => state.user.userId);
  // the button the picker opened from, while it's open
  const [pickerAnchor, setPickerAnchor] = useState<HTMLElement | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMine = (emoji: string) =>
    reactions.some((r) => r.emoji === emoji && r.userId === userId);

  const toggle = async (emoji: string, react = !isMine(emoji)) => {
    setPending(true);
    setError(null);
    try {
      await setReaction(messageId, emoji, react);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't react");
    } finally {
      setPending(false);
    }
  };

  const picker = pickerAnchor && (
    <EmojiPicker
      anchor={pickerAnchor}
      onSelect={(emoji) => {
        setPickerAnchor(null);
        // picking one you've already used keeps it
        if (!isMine(emoji)) toggle(emoji, true);
      }}
      onClose={() => setPickerAnchor(null)}
    />
  );

  return {
    userId,
    isMine,
    toggle,
    pending,
    error,
    picker,
    pickerOpen: !!pickerAnchor,
    openPicker: setPickerAnchor,
  };
};
