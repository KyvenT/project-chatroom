// Emoji data and search, from emoji-mart. Both are big, so they're only
// downloaded the first time something needs them.

export interface EmojiMatch {
  id: string;
  name: string;
  native: string;
}

interface EmojiMartEmoji {
  id: string;
  name: string;
  skins: { native: string }[];
}

interface EmojiMartData {
  emojis: Record<string, EmojiMartEmoji>;
  aliases: Record<string, string>;
}

let loading: Promise<{
  emojiMart: typeof import("emoji-mart");
  data: EmojiMartData;
}> | null = null;

// emoji-mart, set up with its data
export const loadEmojiMart = () => {
  loading ??= Promise.all([
    import("emoji-mart"),
    import("@emoji-mart/data"),
  ]).then(async ([emojiMart, { default: data }]) => {
    await emojiMart.init({ data });
    return { emojiMart, data: data as EmojiMartData };
  });
  // a failed download can be tried again
  loading.catch(() => {
    loading = null;
  });
  return loading;
};

const toMatch = (emoji: EmojiMartEmoji): EmojiMatch => ({
  id: emoji.id,
  name: emoji.name,
  native: emoji.skins[0].native,
});

// Emojis whose name or keywords match, best first
export const searchEmojis = async (
  query: string,
  maxResults = 8,
): Promise<EmojiMatch[]> => {
  const { emojiMart } = await loadEmojiMart();
  const results: EmojiMartEmoji[] | null | undefined =
    await emojiMart.SearchIndex.search(query, { maxResults, caller: null });
  return (results ?? []).map(toMatch);
};

// The emoji a shortcode like "smile" or "+1" names, if any
export const emojiForShortcode = async (shortcode: string) => {
  const { data } = await loadEmojiMart();
  const id = shortcode.toLowerCase();
  const emoji = data.emojis[id] ?? data.emojis[data.aliases[id]];
  return emoji ? toMatch(emoji) : null;
};

// each emoji's shortcode, by the emoji itself, made once the data loads
let shortcodes: Map<string, string> | null = null;

// The shortcode for an emoji, like ":+1:" for 👍 or ":+1::skin-tone-3:" for
// 👍🏼, if it has one
export const shortcodeForEmoji = async (native: string) => {
  const { data } = await loadEmojiMart();
  if (!shortcodes) {
    shortcodes = new Map();
    for (const emoji of Object.values(data.emojis)) {
      emoji.skins.forEach((skin, i) =>
        shortcodes!.set(
          skin.native,
          `:${emoji.id}:` + (i === 0 ? "" : `:skin-tone-${i + 1}:`),
        ),
      );
    }
  }
  return shortcodes.get(native) ?? null;
};

// The same, without waiting: undefined until shortcodeForEmoji has loaded
// them
export const knownShortcode = (native: string) =>
  shortcodes ? (shortcodes.get(native) ?? null) : undefined;

// emoji characters: pictographs (😀, ❤), flag letters and keycaps (1️⃣)
const EMOJI_PART = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20E3/u;
const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

// Text split into its emojis and the text between them
export const splitEmojis = (text: string) => {
  const parts: { text: string; emoji: boolean }[] = [];
  // plain ASCII has no emojis, which is most messages
  if (!/[^\p{ASCII}]/u.test(text)) return [{ text, emoji: false }];

  for (const { segment } of graphemes.segment(text)) {
    const emoji = EMOJI_PART.test(segment);
    const last = parts[parts.length - 1];
    if (!emoji && last && !last.emoji) last.text += segment;
    else parts.push({ text: segment, emoji });
  }
  return parts;
};

// Replaces part of a text box's text, leaving the cursor after the new text;
// returns the box's new value, or null if it wouldn't fit in the box
export const replaceText = (
  input: HTMLTextAreaElement,
  start: number,
  end: number,
  text: string,
) => {
  const length = input.value.length - (end - start) + text.length;
  if (input.maxLength >= 0 && length > input.maxLength) return null;
  input.setRangeText(text, start, end, "end");
  return input.value;
};

// Puts text where the cursor is (over any selected text)
export const insertAtCursor = (input: HTMLTextAreaElement, text: string) =>
  replaceText(input, input.selectionStart, input.selectionEnd, text);
