import { css, useTheme, type Theme } from "@emotion/react";
import { useCallback, useEffect, useRef } from "react";
import { useFetchMessageHistory } from "../../hooks/useFetchMessages";
import type { Message } from "../../types/REST-types/Message";
import { Loader } from "../Loader";
import { MessageAttachment } from "./MessageAttachment";
import { DELETED_USER_NAME } from "../../utils/deletedUser";

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

interface MessageHistoryListProps {
  chatroomId: string;
  firstPageSize: number;
  pageSize: number;
  // messages that arrived after the list opened, newest first
  liveMessages?: Message[];
  // cut long messages to a few lines
  clamp?: boolean;
}

// A chatroom's messages, newest at the bottom, loading older ones when
// scrolled to the top
export const MessageHistoryList = ({
  chatroomId,
  firstPageSize,
  pageSize,
  liveMessages = [],
  clamp = false,
}: MessageHistoryListProps) => {
  const theme = useTheme();
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
      {messages.map((message) => {
        const sentAt = new Date(message.createdAt);
        return (
          <li key={message.id} className="previewMessage">
            <div className="previewMeta">
              {message.senderUser ? (
                <span className="previewSender">
                  {message.senderUser.username}
                </span>
              ) : (
                <span className="previewSender deletedSender">
                  {DELETED_USER_NAME}
                </span>
              )}
              <time className="previewTime" dateTime={sentAt.toISOString()}>
                {formatPreviewTime(sentAt)}
              </time>
            </div>
            {message.content && (
              <p className="previewContent">{message.content}</p>
            )}
            {message.attachment && (
              <MessageAttachment
                attachment={message.attachment}
                compact={clamp}
              />
            )}
          </li>
        );
      })}
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
