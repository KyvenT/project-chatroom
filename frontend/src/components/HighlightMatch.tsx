import { css, useTheme, type Theme } from "@emotion/react";
import { splitMatches } from "../utils/search";

const markStyles = (theme: Theme) =>
  css({
    color: "inherit",
    backgroundColor: theme.colors.accentSoft,
    borderRadius: "2px",
    boxShadow: `0 0 0 1px ${theme.colors.accentSoft}`,
  });

// text with the parts matching a (normalized) search query marked
export const HighlightMatch = ({
  text,
  query = "",
}: {
  text: string;
  query?: string;
}) => {
  const theme = useTheme();
  return (
    <>
      {splitMatches(text, query).map((part, i) =>
        part.match ? (
          <mark key={i} css={markStyles(theme)}>
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </>
  );
};
