import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";

interface MemberStatusList {
  members: string[];
  status: string;
}

const styles = css({
  h3: {
    fontWeight: 500,
    fontSize: ".66rem",
    userSelect: "none",
  },

  ul: {
    padding: 0,
  },

  li: {
    listStyle: "none",
    borderRadius: "2px",
    margin: "4px",
    padding: "2px",
  },
});

const colors = (theme: Theme) =>
  css({
    h3: {
      color: theme.colors.grey,
    },

    li: {
      color: theme.colors.white,
    },

    "li:hover": {
      backgroundColor: theme.colors.dark_grey,
    },
  });

const MemberStatusList = ({ members, status }: MemberStatusList) => {
  const theme = useTheme();

  return (
    <div css={[styles, colors(theme)]}>
      <h3>{status}</h3>
      <ul>
        {members.map((username) => (
          <li key={username}>
            <p>{username}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MemberStatusList;
