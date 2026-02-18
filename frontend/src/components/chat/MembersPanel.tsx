import { useAuthStore } from "../../hooks/useStores";
import type { ChatroomMember } from "../../types/REST-types/ChatroomMember";
import { useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { customQuery } from "../../hooks/useCustomQuery";
import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import ProfileStatus from "./ProfileStatus";
import { useQuery } from "@tanstack/react-query";
import { useMembersStore } from "../../hooks/useStores";
import { mq } from "../../styles/breakpoints";
import { MemberInfo } from "./MemberInfoPopup";
import Button from "../Button";
import { API_URL } from "../../env";
import { useIsMobile } from "../../hooks/useIsMobile";

const styles = css(
  mq({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: ["100%", "100%", "25%", "15%"],
    fontSize: ["2rem", "1rem"],
    padding: "4px 2px",

    ul: {
      padding: 0,
    },

    li: {
      listStyle: "none",
      borderRadius: "2px",
      margin: "4px",
      padding: "2px",
    },

    ".memberBtn": {
      fontSize: "1rem",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },

    ".status": {
      fontSize: ".8rem",
      userSelect: "none",
      fontWeight: 500,
    },
  }),
);

const colors = (theme: Theme) =>
  css({
    backgroundColor: theme.colors.black,
    borderLeft: `1px solid ${theme.colors.dark_grey}`,
    borderBottom: `1px solid ${theme.colors.dark_grey}`,

    ".status": {
      color: theme.colors.grey,
    },

    li: {
      color: theme.colors.white,
    },

    "li:hover": {
      backgroundColor: theme.colors.dark_grey,
    },
  });

const membersListStyles = css({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
});

const MembersPanel = () => {
  const user = useAuthStore((state) => state.user);
  const { chatroomId } = useParams();
  const theme = useTheme();
  const members = useMembersStore((state) => state.members);
  const setMembers = useMembersStore((state) => state.setMembers);
  const [clickedMember, setClickedMember] = useState<{
    member: ChatroomMember;
    button: HTMLButtonElement;
  } | null>(null);
  const isMobile = useIsMobile();

  const { data } = useQuery<ChatroomMember[]>({
    queryKey: ["members", user.userId, chatroomId],
    queryFn: () =>
      customQuery<ChatroomMember[]>({
        fetchUrl: `${API_URL}/api/members/${chatroomId}`,
      }),
    enabled: !!user.token,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (!data) {
      setMembers([]);
      return;
    }
    setMembers(data);
  }, [data]);

  const onMemberClick = (
    member: ChatroomMember,
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    setClickedMember({ member, button: event.target as HTMLButtonElement });
  };

  const { statusLists } = useMemo(() => {
    const onlineList = members.filter(
      (member) => member.member.status === "ONLINE",
    );
    const awayList = members.filter(
      (member) => member.member.status === "AWAY",
    );
    const offlineList = members.filter(
      (member) => member.member.status === "OFFLINE",
    );

    return {
      statusLists: [
        { status: "ONLINE", members: onlineList },
        { status: "AWAY", members: awayList },
        { status: "OFFLINE", members: offlineList },
      ],
    };
  }, [members]);

  const status =
    members.find((member) => member.memberId === user.userId)?.member.status ||
    "OFFLINE";

  return (
    <>
      <div css={[styles, colors(theme)]}>
        <div css={membersListStyles}>
          {statusLists.map((statusList) => (
            <>
              {statusList.members.length > 0 && (
                <div key={statusList.status}>
                  <h3 className="status">{statusList.status}</h3>
                  <ul>
                    {statusList.members.map((member) => (
                      <li key={member.memberId}>
                        <Button
                          variant="icon"
                          className="memberBtn"
                          onClick={(event) => onMemberClick(member, event)}
                        >
                          {member.member.username}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ))}
        </div>
        <ProfileStatus status={status} />
      </div>
      {clickedMember && (
        <MemberInfo
          clickedMember={clickedMember}
          onClose={() => setClickedMember(null)}
          position={isMobile ? "RIGHT" : "LEFT"}
        />
      )}
    </>
  );
};

export default MembersPanel;
