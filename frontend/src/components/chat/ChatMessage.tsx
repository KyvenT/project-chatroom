import { css, useTheme, type Theme } from "@emotion/react";
import Button from "../Button";
import { useState } from "react";
import type { ChatroomMember } from "../../types/REST-types/ChatroomMember";
import { useMembersStore } from "../../hooks/useStores";
import { MemberInfo } from "./MemberInfoPopup";
import { MessageAttachment } from "./MessageAttachment";
import { DELETED_USER_NAME } from "../../utils/deletedUser";
import {
  DeleteMessageModal,
  MessageEditForm,
  MessageToolbar,
} from "./MessageActions";
import { messageHostStyles } from "../../styles/messageHost";
import type { Attachment } from "../../types/REST-types/Message";

interface ChatMessageProps {
  id: string;
  content: string;
  attachment?: Attachment | null;
  // null when the sender's account has been deleted
  sender: { id: string; username: string } | null;
  timestamp: Date;
  editedAt?: Date | null;
  canEdit?: boolean;
  canDelete?: boolean;
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

  ".edited": {
    fontSize: "0.7rem",
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

    ".timeStamp, .edited": {
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

    ".deletedSender": {
      fontSize: "0.95rem",
      fontStyle: "italic",
      color: theme.colors.light_grey,
    },
  });

const ChatMessage = ({
  id,
  content,
  attachment,
  sender,
  timestamp,
  editedAt = null,
  canEdit = false,
  canDelete = false,
}: ChatMessageProps) => {
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const members = useMembersStore((state) => state.members);
  const [clickedMember, setClickedMember] = useState<{
    member: ChatroomMember;
    button: HTMLButtonElement;
  } | null>(null);

  const onMemberClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    if (!sender) return;
    const member = members.find((mem) => mem.memberId === sender.id);
    if (!member) return;
    setClickedMember({
      member,
      button: event.currentTarget as HTMLButtonElement,
    });
  };

  return (
    <>
      <div key={id} css={[styles, colors(theme), messageHostStyles]}>
        {!editing && (
          <MessageToolbar
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={() => setEditing(true)}
            onDelete={() => setDeleting(true)}
          />
        )}
        <div className="messageHeader">
          {sender ? (
            <Button
              className="userBtn"
              onClick={(event) => onMemberClick(event)}
            >
              <strong>{sender.username}</strong>
            </Button>
          ) : (
            <strong className="deletedSender">{DELETED_USER_NAME}</strong>
          )}
          <span className="timeStamp">
            {`${timestamp.getFullYear()}/${
              timestamp.getMonth() + 1
            }/${timestamp.getDate()} ${timestamp.toLocaleString("en-US", {
              timeStyle: "short",
              hour12: true,
            })}`}
          </span>
          {editedAt && (
            <span
              className="edited"
              title={`Edited ${editedAt.toLocaleString()}`}
            >
              (edited)
            </span>
          )}
        </div>
        {editing ? (
          <MessageEditForm
            messageId={id}
            content={content}
            onDone={() => setEditing(false)}
          />
        ) : (
          content && <p className="content">{content}</p>
        )}
        {attachment && <MessageAttachment attachment={attachment} />}
      </div>
      {deleting && (
        <DeleteMessageModal
          messageId={id}
          preview={content || attachment?.fileName || "This message"}
          onClose={() => setDeleting(false)}
        />
      )}
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
