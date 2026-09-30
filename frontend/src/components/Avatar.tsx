import { css, useTheme, type Theme } from "@emotion/react";
import { UserRound } from "lucide-react";
import { useState } from "react";
import { useAvatarStore } from "../hooks/useAvatarStore";
import { avatarUrl } from "../utils/avatars";
import { statusColor, STATUS_LABELS } from "../utils/status";
import type { Status } from "./chat/ProfileStatus";

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
  // shows a dot in the corner for the user's status
  status?: Status;
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
  status,
  className,
}: AvatarProps) => {
  const theme = useTheme();
  const picture = (
    <AvatarPicture
      userId={userId}
      username={username}
      avatarUpdatedAt={avatarUpdatedAt}
      size={size}
      label={label}
      className={status ? undefined : className}
    />
  );
  if (!status) return picture;

  const dot = Math.max(8, Math.round(size * 0.28));
  return (
    <span
      className={className}
      css={css({
        position: "relative",
        display: "inline-flex",
        flex: "0 0 auto",
        ".statusDot": {
          position: "absolute",
          right: 0,
          bottom: 0,
          width: `${dot}px`,
          height: `${dot}px`,
          borderRadius: "50%",
          backgroundColor: statusColor(theme, status),
          // a ring in the surrounding color separates it from the picture
          boxShadow: `0 0 0 2px var(--avatar-ring, ${theme.colors.dark_grey})`,
        },
      })}
    >
      {picture}
      <span className="statusDot" title={STATUS_LABELS[status]} />
    </span>
  );
};

const AvatarPicture = ({
  userId,
  username,
  avatarUpdatedAt = null,
  size = 32,
  label,
  className,
}: Omit<AvatarProps, "status">) => {
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
