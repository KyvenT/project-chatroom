import { css, useTheme, type Theme } from "@emotion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFetchMessageHistory } from "../../hooks/useFetchMessages";
import type { Message } from "../../types/REST-types/Message";
import { Loader } from "../Loader";
import { MessageAttachment } from "./MessageAttachment";
import { DELETED_USER_NAME } from "../../utils/deletedUser";
import { useMessagePermissions } from "../../hooks/useMessagePermissions";
import { usePreferencesStore } from "../../hooks/usePreferencesStore";
import { continuesChain } from "../../utils/messageChains";
import { messageHostStyles } from "../../styles/messageHost";
import {
  DeleteMessageModal,
  MessageEditForm,
  MessageToolbar,
} from "./MessageActions";

// how close to the top (px) the list is scrolled before older messages load
const LOAD_THRESHOLD = 24;

const styles = (theme: Theme) =>
  css({
    listStyle: "none",
    margin: 0,
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column-reverse",
    gap: "2px",
    padding: "6px 0",
    overflowY: "auto",
    backgroundColor: theme.colors.black,
    scrollbarColor: "transparent transparent",

    "&:hover": {
      scrollbarColor: `${theme.colors.borderStrong} transparent`,
    },

    ".previewMessage": {
      padding: "4px 12px",
    },

    ".previewMessage.chained": {
      paddingTop: 0,
    },

    ".visuallyHidden": {
      position: "absolute",
      width: "1px",
      height: "1px",
      overflow: "hidden",
      clip: "rect(0 0 0 0)",
      whiteSpace: "nowrap",
    },

    ".previewMeta": {
      display: "flex",
      alignItems: "baseline",
      gap: "6px",
      minWidth: 0,
    },

    ".previewSender": {
      fontSize: "0.8rem",
      fontWeight: 600,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },

    ".deletedSender": {
      fontStyle: "italic",
      color: theme.colors.light_grey,
    },

    ".previewTime": {
      flex: "0 0 auto",
      fontSize: "0.7rem",
      color: theme.colors.light_grey,
    },

    ".previewContent": {
      fontSize: "0.85rem",
      lineHeight: 1.45,
      color: theme.colors.white,
      overflowWrap: "anywhere",
      whiteSpace: "pre-wrap",
    },

    // long messages can be cut to a few lines
    "&.clamped .previewContent": {
      display: "-webkit-box",
      WebkitBoxOrient: "vertical",
      WebkitLineClamp: 3,
      overflow: "hidden",
    },

    ".history-status": {
      display: "flex",
      justifyContent: "center",
      padding: "8px",
      fontSize: "0.75rem",
      color: theme.colors.light_grey,
    },
  });

// today's messages show the time, older ones the date
const formatPreviewTime = (date: Date) =>
  date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

const NO_PERMISSIONS = { canEdit: false, canDelete: false };

interface HistoryMessageProps {
  message: Message;
  clamp: boolean;
  // shown under the same person's previous message, without a name
  chained: boolean;
  permissions: { canEdit: boolean; canDelete: boolean };
}

const HistoryMessage = ({
  message,
  clamp,
  chained,
  permissions,
}: HistoryMessageProps) => {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const sentAt = new Date(message.createdAt);
  const senderName = message.senderUser?.username ?? DELETED_USER_NAME;

  return (
    <li
      className={chained ? "previewMessage chained" : "previewMessage"}
      css={messageHostStyles}
      title={chained ? sentAt.toLocaleString() : undefined}
    >
      {!editing && (
        <MessageToolbar
          {...permissions}
          compact
          onEdit={() => setEditing(true)}
          onDelete={() => setDeleting(true)}
        />
      )}
      {chained ? (
        <span className="visuallyHidden">
          {senderName}, {formatPreviewTime(sentAt)}
        </span>
      ) : (
        <div className="previewMeta">
          {message.senderUser ? (
            <span className="previewSender">{message.senderUser.username}</span>
          ) : (
            <span className="previewSender deletedSender">
              {DELETED_USER_NAME}
            </span>
          )}
          <time className="previewTime" dateTime={sentAt.toISOString()}>
            {formatPreviewTime(sentAt)}
          </time>
          {message.editedAt && <span className="previewTime">(edited)</span>}
        </div>
      )}
      {editing ? (
        <MessageEditForm
          messageId={message.id}
          content={message.content}
          onDone={() => setEditing(false)}
          compact
        />
      ) : (
        message.content && (
          <p className="previewContent">
            {message.content}
            {chained && message.editedAt && (
              <span className="previewTime"> (edited)</span>
            )}
          </p>
        )
      )}
      {message.attachment && (
        <MessageAttachment attachment={message.attachment} compact={clamp} />
      )}
      {deleting && (
        <DeleteMessageModal
          messageId={message.id}
          preview={
            message.content || message.attachment?.fileName || "This message"
          }
          onClose={() => setDeleting(false)}
        />
      )}
    </li>
  );
};

interface MessageHistoryListProps {
  chatroomId: string;
  firstPageSize: number;
  pageSize: number;
  // messages that arrived after the list opened, newest first
  liveMessages?: Message[];
  // cut long messages to a few lines
  clamp?: boolean;
  // show edit and delete buttons on messages the user may change
  editable?: boolean;
}

// A chatroom's messages, newest at the bottom, loading older ones when
// scrolled to the top
export const MessageHistoryList = ({
  chatroomId,
  firstPageSize,
  pageSize,
  liveMessages = [],
  clamp = false,
  editable = false,
}: MessageHistoryListProps) => {
  const theme = useTheme();
  const permissionsFor = useMessagePermissions(chatroomId);
  const chainMinutes = usePreferencesStore(
    (state) => state.messageChainMinutes,
  );
  const listRef = useRef<HTMLUListElement>(null);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFetchMessageHistory(chatroomId, firstPageSize, pageSize);

  const history = data?.pages.flat() ?? [];
  const historyIds = new Set(history.map((m) => m.id));
  const messages = [
    ...liveMessages.filter((m) => !historyIds.has(m.id)),
    ...history,
  ];

  const loadOlderIfAtTop = useCallback(() => {
    const list = listRef.current;
    if (!list || !hasNextPage || isFetchingNextPage) return;

    // the list is column-reverse, so scrollTop is 0 at the bottom and grows
    // negative towards the oldest message
    const distanceFromTop =
      list.scrollHeight - list.clientHeight + list.scrollTop;
    if (distanceFromTop <= LOAD_THRESHOLD) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // if the loaded messages don't fill the list there's nothing to scroll,
  // so keep loading until it overflows or history runs out
  useEffect(() => {
    loadOlderIfAtTop();
  }, [data, loadOlderIfAtTop]);

  return (
    <ul
      className={clamp ? "messages clamped" : "messages"}
      css={styles(theme)}
      ref={listRef}
      onScroll={loadOlderIfAtTop}
    >
      {messages.map((message, index) => (
        <HistoryMessage
          key={message.id}
          message={message}
          clamp={clamp}
          // newest first, so the message before this one is next
          chained={continuesChain(message, messages[index + 1], chainMinutes)}
          permissions={editable ? permissionsFor(message) : NO_PERMISSIONS}
        />
      ))}
      {/* last in a column-reverse list, so shown above the oldest message */}
      {isFetchingNextPage && (
        <li className="history-status" aria-label="Loading older messages">
          <Loader />
        </li>
      )}
      {data && !hasNextPage && (
        <li className="history-status">
          {messages.length === 0 ? "No messages yet" : "Start of chat"}
        </li>
      )}
    </ul>
  );
};
