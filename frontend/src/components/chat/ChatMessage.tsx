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
import { Avatar } from "../Avatar";
import type { Attachment, Reaction } from "../../types/REST-types/Message";
import { MessageReactions } from "./MessageReactions";
import { EmojiText } from "../emoji/EmojiText";
import { useReactions } from "../../hooks/useReactions";

interface ChatMessageProps {
  id: string;
  content: string;
  attachment?: Attachment | null;
  // null when the sender's account has been deleted
  sender: {
    id: string;
    username: string;
    avatarUpdatedAt?: string | null;
  } | null;
  timestamp: Date;
  editedAt?: Date | null;
  reactions?: Reaction[];
  canReact?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  // sent soon after the same person's previous message, so shown under it
  // without a name
  chained?: boolean;
}

// how big (px) the sender's picture is beside their messages
const AVATAR_SIZE = 36;

const styles = css({
  display: "flex",
  alignItems: "flex-start",
  width: "100%",
  height: "auto",
  padding: "8px 24px",
  gap: "12px",

  ".messageBody": {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  ".avatarSlot": {
    flex: "0 0 auto",
    marginTop: "2px",
    cursor: "pointer",
  },

  // chained messages line up with the text of the one they follow
  ".avatarGutter": {
    flex: `0 0 ${AVATAR_SIZE}px`,
  },

  "&.chained": {
    paddingTop: "2px",
    paddingBottom: "2px",
  },

  // a chained message's time shows in its row while it's hovered
  ".chainTime": {
    position: "absolute",
    top: "50%",
    right: "24px",
    transform: "translateY(-50%)",
    fontSize: "0.7rem",
    opacity: 0,
    pointerEvents: "none",
  },

  // clear of the react, edit and delete toolbar, which shows at the same time
  "&.hasToolbar .chainTime": {
    right: "120px",
  },

  "&:hover .chainTime, &:focus-within .chainTime": {
    opacity: 1,
  },

  ".visuallyHidden": {
    position: "absolute",
    width: "1px",
    height: "1px",
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
  },

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

    ".timeStamp, .edited, .chainTime": {
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
  reactions = [],
  canReact = false,
  canEdit = false,
  canDelete = false,
  chained = false,
}: ChatMessageProps) => {
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const reacting = useReactions(id, reactions);

  const shortTime = timestamp.toLocaleString("en-US", {
    timeStyle: "short",
    hour12: true,
  });
  const fullTime = `${timestamp.getFullYear()}/${
    timestamp.getMonth() + 1
  }/${timestamp.getDate()} ${shortTime}`;
  const senderName = sender?.username ?? DELETED_USER_NAME;
  const editedLabel = editedAt && (
    <span className="edited" title={`Edited ${editedAt.toLocaleString()}`}>
      (edited)
    </span>
  );
  const members = useMembersStore((state) => state.members);
  const [clickedMember, setClickedMember] = useState<{
    member: ChatroomMember;
    button: HTMLButtonElement;
  } | null>(null);

  // from the name, or the picture beside it
  const onMemberClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
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
      <div
        key={id}
        className={
          [
            chained && "chained",
            (canReact || canEdit || canDelete) && !editing && "hasToolbar",
            reacting.pickerOpen && "reacting",
          ]
            .filter(Boolean)
            .join(" ") || undefined
        }
        css={[styles, colors(theme), messageHostStyles]}
      >
        {!editing && (
          <MessageToolbar
            canReact={canReact}
            canEdit={canEdit}
            canDelete={canDelete}
            onReact={reacting.openPicker}
            onEdit={() => setEditing(true)}
            onDelete={() => setDeleting(true)}
          />
        )}
        {chained ? (
          <span className="avatarGutter" />
        ) : (
          <span className="avatarSlot" onClick={onMemberClick}>
            <Avatar
              userId={sender?.id ?? null}
              username={sender?.username}
              avatarUpdatedAt={sender?.avatarUpdatedAt}
              size={AVATAR_SIZE}
            />
          </span>
        )}
        <div className="messageBody">
          {chained ? (
            <>
              <span className="visuallyHidden">
                {senderName}, {fullTime}
              </span>
              <time
                className="chainTime"
                dateTime={timestamp.toISOString()}
                title={fullTime}
                aria-hidden
              >
                {shortTime}
              </time>
            </>
          ) : (
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
              <span className="timeStamp">{fullTime}</span>
              {editedLabel}
            </div>
          )}
          {editing ? (
            <MessageEditForm
              messageId={id}
              content={content}
              onDone={() => setEditing(false)}
            />
          ) : (
            content && (
              <p className="content">
                <EmojiText text={content} />
                {/* with no header, the edited mark goes after the text */}
                {chained && <> {editedLabel}</>}
              </p>
            )
          )}
          {attachment && <MessageAttachment attachment={attachment} />}
          <MessageReactions
            reactions={reactions}
            reacting={reacting}
            canReact={canReact}
          />
        </div>
      </div>
      {reacting.picker}
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
