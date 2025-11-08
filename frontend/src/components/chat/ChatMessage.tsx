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
  padding: "10px",
  borderRadius: "0 8px 8px 0",
  backgroundClip: "padding-box",

  strong: {
    fontWeight: "500",
  },

  ".content": {
    width: "100%",
    overflowWrap: "break-word",
  },

  ".userBtn": {
    backgroundColor: "transparent",
    border: 0,
    textAlign: "left",
    fontSize: "1rem",
    padding: 0,
    cursor: "pointer",
  },

  ".userBtn:hover": {
    textDecoration: "underline",
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

    ".timeStamp": {
      color: theme.colors.light_grey,
    },

    ".messageHeader": {
      display: "flex",
      gap: "4px",
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
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
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
