import { css, useTheme, type Theme } from "@emotion/react";
import { UserRound } from "lucide-react";
import { useState } from "react";
import { useAvatarStore } from "../hooks/useAvatarStore";
import { avatarUrl } from "../utils/avatars";

const styles = (theme: Theme, size: number) =>
  css({
    flex: "0 0 auto",
    width: `${size}px`,
    height: `${size}px`,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    overflow: "hidden",
    fontSize: `${Math.round(size * 0.45)}px`,
    fontWeight: 600,
    lineHeight: 1,
    color: "#fff",
    backgroundColor: theme.colors.grey,
    userSelect: "none",

    img: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },

    "&.deleted": { color: theme.colors.light_grey },
  });

// the same color for a user every time, from their id
const colorFor = (userId: string) => {
  let hash = 0;
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return `hsl(${Math.abs(hash) % 360} 45% 40%)`;
};

interface AvatarProps {
  // null for a deleted user
  userId: string | null;
  username?: string | null;
  // the version the picture was loaded with; a newer one from the avatar
  // store takes its place
  avatarUpdatedAt?: string | null;
  size?: number;
  // what a screen reader says; left out where the name is already next to it
  label?: string;
  className?: string;
}

// A user's profile picture, or the first letter of their name when they
// haven't added one
export const Avatar = ({
  userId,
  username,
  avatarUpdatedAt = null,
  size = 32,
  label,
  className,
}: AvatarProps) => {
  const theme = useTheme();
  const liveVersion = useAvatarStore((state) =>
    userId ? state.versions[userId] : undefined,
  );
  const version = liveVersion !== undefined ? liveVersion : avatarUpdatedAt;
  const src = userId && version ? avatarUrl(userId, version) : null;
  // a picture that fails to load shows the letter instead
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const a11y = label
    ? { role: "img", "aria-label": label }
    : { "aria-hidden": true };

  if (!userId) {
    return (
      <span
        css={styles(theme, size)}
        className={["deleted", className].filter(Boolean).join(" ")}
        {...a11y}
      >
        <UserRound size={Math.round(size * 0.6)} />
      </span>
    );
  }

  if (src && src !== failedSrc) {
    return (
      <span css={styles(theme, size)} className={className} {...a11y}>
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          onError={() => setFailedSrc(src)}
        />
      </span>
    );
  }

  return (
    <span
      css={[styles(theme, size), css({ backgroundColor: colorFor(userId) })]}
      className={className}
      {...a11y}
    >
      {(username ?? "?").charAt(0).toUpperCase()}
    </span>
  );
};
