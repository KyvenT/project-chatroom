import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import { useMembersStore } from "../../hooks/useStores";
import { useMemo } from "react";
import Button from "../Button";
import type { ChatroomMember } from "../../types/REST-types/ChatroomMember";

interface MemberStatusList {
  status: string;
  onMemberClick: (member: ChatroomMember) => void;
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

const MemberStatusList = ({ status, onMemberClick }: MemberStatusList) => {
  const theme = useTheme();
  const members = useMembersStore((state) => state.members);

  const statusMembersList = useMemo(() => {
    return members.filter((member) => member.member.status === status);
  }, [members]);

  return (
    <div css={[styles, colors(theme)]}>
      <h3>{status}</h3>
      <ul>
        {statusMembersList.map((member) => (
          <li key={member.memberId}>
            <Button
              variant="icon"
              className="memberBtn"
              onClick={() => onMemberClick(member)}
            >
              {member.member.username}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MemberStatusList;
