import { css, useTheme, type Theme } from "@emotion/react";
import Button from "../Button";
import { useState } from "react";
import type { ChatroomMember } from "../../types/REST-types/ChatroomMember";
import { useMembersStore } from "../../hooks/useStores";
import { MemberInfo } from "./MemberInfoPopup";

interface ChatMessageProps {
  id: string;
  content: string;
  sender: { id: string; username: string };
  timestamp: Date;
}

const styles = css({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "auto",
  padding: "8px 24px",
  gap: "2px",

  strong: {
    fontWeight: 600,
  },

  ".content": {
    width: "100%",
    overflowWrap: "break-word",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
  },

  ".userBtn": {
    backgroundColor: "transparent",
    border: 0,
    textAlign: "left",
    fontSize: "0.95rem",
    padding: 0,
    cursor: "pointer",
  },

  ".userBtn:hover": {
    textDecoration: "underline",
  },

  ".timeStamp": {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: "0.75rem",
    alignSelf: "center",
  },

});

const colors = (theme: Theme) =>
  css({
    backgroundColor: "inherit",
    color: theme.colors.white,
    borderColor: "transparent",

    "&:hover": {
      backgroundColor: theme.colors.dark_grey,
    },

    ".content": {
      color: theme.colors.white,
    },

    ".timeStamp": {
      color: theme.colors.light_grey,
    },

    ".messageHeader": {
      display: "flex",
      gap: "8px",
      alignItems: "baseline",
    },

    ".userBtn": {
      color: theme.colors.white,
    },
  });

const ChatMessage = ({ id, content, sender, timestamp }: ChatMessageProps) => {
  const theme = useTheme();
  const members = useMembersStore((state) => state.members);
  const [clickedMember, setClickedMember] = useState<{
    member: ChatroomMember;
    button: HTMLButtonElement;
  } | null>(null);

  const onMemberClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    const member = members.find((mem) => mem.memberId === sender.id);
    if (!member) return;
    setClickedMember({
      member,
      button: event.currentTarget as HTMLButtonElement,
    });
  };

  return (
    <>
      <div key={id} css={[styles, colors(theme)]}>
        <div className="messageHeader">
          <Button className="userBtn" onClick={(event) => onMemberClick(event)}>
            <strong>{sender.username}</strong>
          </Button>
          <span className="timeStamp">
            {`${timestamp.getFullYear()}/${
              timestamp.getMonth() + 1
            }/${timestamp.getDate()} ${timestamp.toLocaleString("en-US", {
              timeStyle: "short",
              hour12: true,
            })}`}
          </span>
        </div>
        <p className="content">{content}</p>
      </div>
      {clickedMember && (
        <MemberInfo
          clickedMember={clickedMember}
          onClose={() => setClickedMember(null)}
          position="RIGHT"
        />
      )}
    </>
  );
};

export default ChatMessage;
