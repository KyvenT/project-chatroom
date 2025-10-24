import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import { useMembersStore } from "../../hooks/useStores";
import { useMemo } from "react";
import { MemberInfo } from "./MemberInfoPopup";
import Button from "../Button";

interface MemberStatusList {
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

const MemberStatusList = ({ status }: MemberStatusList) => {
  const theme = useTheme();
  const members = useMembersStore((state) => state.members);

  const onlineList = useMemo(() => {
    return members.filter((member) => member.member.status === status);
  }, [members]);

  const onMemberClick = () => {};

  return (
    <div css={[styles, colors(theme)]}>
      <h3>{status}</h3>
      <ul>
        {onlineList.map((member) => (
          <li key={member.memberId}>
            <Button variant="icon" className="memberBtn">
              {member.member.username}
            </Button>
            <MemberInfo member={member}></MemberInfo>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MemberStatusList;
