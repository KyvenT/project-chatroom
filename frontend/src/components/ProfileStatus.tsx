import { css, useTheme } from "@emotion/react";
import useAuthContext from "../hooks/useAuthContext";
import type { Theme } from "@emotion/react";

const STATUS_COLORS = {
  ONLINE: "green",
  AWAY: "orange",
  OFFLINE: "grey",
};

const styles = css({
  display: "flex",

  ".status": {
    borderRadius: "50%",
    aspectRatio: 1,
    width: "1.2rem",
    appearance: "none",
  },
});

const colors = (theme: Theme) =>
  css({
    color: theme.colors.white,

    ".status": {},
  });

interface ProfileStatusProps {
  status: string;
}

const ProfileStatus = ({ status }: ProfileStatusProps) => {
  const theme = useTheme();
  const { user, isLoggedIn } = useAuthContext();

  return (
    <div css={[styles, colors(theme)]}>
      <select className="status">
        <option className="statusOption"></option>
      </select>
      <p>{user.username}</p>
    </div>
  );
};

export default ProfileStatus;
