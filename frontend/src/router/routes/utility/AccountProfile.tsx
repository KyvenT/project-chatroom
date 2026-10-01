import { useAuthStore } from "../../../hooks/useStores";
import { css, useTheme } from "@emotion/react";
import { mq } from "../../../styles/breakpoints";
import { modalButtonStyles } from "../../../styles/modalForm";
import type { Theme } from "@emotion/react";
import { useRef, useState } from "react";
import { Avatar } from "../../../components/Avatar";
import { useMyDetails } from "../../../hooks/useMyDetails";
import { useAvatarStore } from "../../../hooks/useAvatarStore";
import {
  AVATAR_ACCEPT,
  prepareAvatar,
  removeAvatar,
  uploadAvatar,
} from "../../../utils/avatars";

const styles = (theme: Theme) =>
  css(
    mq({
      ".container": {
        width: "90%",
        backgroundColor: theme.colors.grey,
        padding: "12px",
        margin: "auto",
      },

      ".pictureSection": {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        margin: "12px 0",
      },

      ".pictureControls": {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "6px",
      },

      ".pictureButtons": {
        display: "flex",
        gap: "8px",
      },

      ".pictureNote": {
        fontSize: "0.8rem",
        color: theme.colors.light_grey,
      },

      ".pictureError": {
        fontSize: "0.8rem",
        color: theme.colors.danger,
      },

      h2: {
        fontSize: "1.25rem",
        fontWeight: "600",
        margin: 0,
      },

      ".flex span": {
        fontSize: "1rem",
        fontWeight: "300",
      },

      ".flex": {
        display: "flex",
        gap: "8px",
        alignItems: "center",
      },
    }),
  );

// Shows the user's profile picture and lets them change or remove it
const ProfilePictureSection = ({
  avatarUpdatedAt,
  loaded,
}: {
  avatarUpdatedAt?: string | null;
  loaded: boolean;
}) => {
  const user = useAuthStore((state) => state.user);
  const liveVersion = useAvatarStore((state) => state.versions[user.userId]);
  const hasPicture = !!(liveVersion !== undefined
    ? liveVersion
    : avatarUpdatedAt);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pictureSection">
      <Avatar
        userId={user.userId || null}
        username={user.username}
        avatarUpdatedAt={avatarUpdatedAt}
        size={96}
        label="Your profile picture"
      />
      <div className="pictureControls">
        <h2>Profile picture</h2>
        {user.isGuest ? (
          <p className="pictureNote">
            Sign up for an account to add a profile picture.
          </p>
        ) : (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={AVATAR_ACCEPT}
              hidden
              data-testid="avatar-input"
              onChange={(event) => {
                const file = event.target.files?.[0];
                // cleared so picking the same file again still works
                event.target.value = "";
                if (file) {
                  run(async () =>
                    uploadAvatar(user.userId, await prepareAvatar(file)),
                  );
                }
              }}
            />
            <div className="pictureButtons">
              <button
                type="button"
                className="btn btnPrimary"
                disabled={busy || !loaded}
                onClick={() => inputRef.current?.click()}
              >
                {busy
                  ? "Saving…"
                  : hasPicture
                    ? "Change picture"
                    : "Add picture"}
              </button>
              {hasPicture && (
                <button
                  type="button"
                  className="btn btnSecondary"
                  disabled={busy}
                  onClick={() => run(() => removeAvatar(user.userId))}
                >
                  Remove
                </button>
              )}
            </div>
            <p className="pictureNote">
              PNG, JPEG, WebP or GIF. It's cropped to a square and shown to
              people in your chatrooms.
            </p>
          </>
        )}
        {error && (
          <p className="pictureError" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export const AccountProfilePage = () => {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);

  const { data } = useMyDetails();

  return (
    <div css={[styles(theme), modalButtonStyles(theme)]}>
      <div className="container">
        <h1 className="title">Account Details</h1>
        <ProfilePictureSection
          avatarUpdatedAt={data?.avatarUpdatedAt}
          loaded={!!data}
        />
        <div className="username flex">
          <h2>Username</h2>
          <span>{user.username}</span>
        </div>
        <div className="flex">
          <h2>User ID</h2>
          <span>{user.userId}</span>
        </div>
        <p>{user.isGuest ? "Guest account" : "User account"}</p>
        <p>
          Account created on:{" "}
          {data?.createdAt &&
            new Date(data?.createdAt).toLocaleDateString("en-US")}
        </p>
        {/*<p>{data?.email ? "Email verified" : "Email unverified"}</p>*/}
        {/*<button>Delete account</button>*/}
      </div>
    </div>
  );
};
