import type {
  PinnedChatroom,
  PinnedGroup,
} from "../../types/REST-types/Chatroom";
import { useFetchMessageHistory } from "../../hooks/useFetchMessages";
import { useCallback, useEffect, useRef } from "react";
import { Loader } from "../Loader";
import { useWheelScrollsHorizontally } from "../../hooks/useWheelScrollsHorizontally";
import { useDragReorder } from "../../hooks/useDragReorder";
import { css, useTheme, type Theme } from "@emotion/react";
import { Link, useNavigate } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { useChatroomsStore } from "../../hooks/useStores";

interface pinnedChatroomsListProps {
  pinnedGroup: PinnedGroup;
  id?: string;
  // called with the chatroom ids in their new order after a card is dragged
  onReorder: (chatroomIds: string[]) => void;
  // shown after the carousel in the same row, e.g. the group's edit button
  children?: React.ReactNode;
}

const styles = (theme: Theme) =>
  css({
    listStyle: "none",
    margin: 0,
    flex: "0 1 auto",
    minWidth: 0,
    display: "flex",
    gap: "12px",
    // room below for the scrollbar and around for focus rings
    padding: "4px 2px 12px",
    overflowX: "auto",
    scrollbarColor: "transparent transparent",

    "&:hover": {
      scrollbarColor: `${theme.colors.borderStrong} transparent`,
    },

    ".pinned-chatroom": {
      flex: "0 0 auto",
      width: "clamp(240px, 24vw, 320px)",
      height: "280px",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      cursor: "pointer",
      color: theme.colors.white,
      backgroundColor: theme.colors.dark_grey,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.lg,
      transition: "border-color 0.15s ease, box-shadow 0.15s ease",

      "&:hover, &:focus-within": {
        borderColor: theme.colors.borderStrong,
        boxShadow: theme.shadow.popup,
      },

      "&:hover .openIcon": {
        color: theme.colors.white,
      },

      "&.dragging": {
        opacity: 0.4,
      },

      // a bar in the gap where the dragged card will land
      "&.dropBefore": {
        boxShadow: `-8px 0 0 -5px ${theme.colors.accent}`,
      },

      "&.dropAfter": {
        boxShadow: `8px 0 0 -5px ${theme.colors.accent}`,
      },
    },

    ".cardHeader": {
      flex: "0 0 auto",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 12px",
      borderBottom: `1px solid ${theme.colors.border}`,
    },

    ".cardTitle": {
      flex: 1,
      minWidth: 0,
      fontSize: "0.95rem",
      fontWeight: 600,
      color: theme.colors.white,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",

      "&:hover": { textDecoration: "none" },
      "&:focus-visible": {
        outline: "none",
      },
    },

    ".unreadBadge": {
      flex: "0 0 auto",
      minWidth: "1.25rem",
      height: "1.25rem",
      padding: "0 6px",
      borderRadius: "999px",
      fontSize: "0.7rem",
      fontWeight: 600,
      lineHeight: "1.25rem",
      textAlign: "center",
      color: theme.colors.onAccent,
      backgroundColor: theme.colors.accent,
    },

    ".openIcon": {
      flex: "0 0 auto",
      color: theme.colors.light_grey,
      transition: "color 0.15s ease",
    },

    ".messages": {
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
    },

    ".pinned-chatroom:hover .messages": {
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
      // long messages are cut to a few lines in the preview
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

// how close to the top (px) the preview is scrolled before older messages load
const LOAD_THRESHOLD = 24;

const PinnedChatroomCard = ({
  chatroom,
  dragProps,
  dragState,
}: {
  chatroom: PinnedChatroom;
  dragProps: ReturnType<ReturnType<typeof useDragReorder>["itemProps"]>;
  dragState: string;
}) => {
  const navigate = useNavigate();
  const messagesRef = useRef<HTMLUListElement>(null);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFetchMessageHistory(chatroom.chatroomId, 5, 15);

  const messages = data?.pages.flat() ?? [];
  const unread = useChatroomsStore(
    (state) =>
      state.chatrooms.find((c) => c.chatroomId === chatroom.chatroomId)
        ?.unreadMessages ?? 0,
  );

  const loadOlderIfAtTop = useCallback(() => {
    const list = messagesRef.current;
    if (!list || !hasNextPage || isFetchingNextPage) return;

    // the list is column-reverse, so scrollTop is 0 at the bottom and grows
    // negative towards the oldest message
    const distanceFromTop =
      list.scrollHeight - list.clientHeight + list.scrollTop;
    if (distanceFromTop <= LOAD_THRESHOLD) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // if the loaded messages don't fill the preview there's nothing to scroll,
  // so keep loading until it overflows or history runs out
  useEffect(() => {
    loadOlderIfAtTop();
  }, [data, loadOlderIfAtTop]);

  const chatroomPath = `/chat/${chatroom.chatroomId}`;

  return (
    <li
      className={`pinned-chatroom ${dragState}`}
      onClick={() => navigate(chatroomPath)}
      {...dragProps}
    >
      <div className="cardHeader">
        <Link
          to={chatroomPath}
          // dragging the title moves the card, not the link
          draggable={false}
          className="cardTitle"
          // the whole card navigates; don't do it twice
          onClick={(e) => e.stopPropagation()}
        >
          {chatroom.chatroom.title}
        </Link>
        {unread > 0 && (
          <span className="unreadBadge" aria-label={`${unread} unread`}>
            {unread}
          </span>
        )}
        <ArrowUpRight className="openIcon" size="1rem" aria-hidden="true" />
      </div>
      <ul className="messages" ref={messagesRef} onScroll={loadOlderIfAtTop}>
        {messages.map((message) => {
          const sentAt = new Date(message.createdAt);
          return (
            <li key={message.id} className="previewMessage">
              <div className="previewMeta">
                <span className="previewSender">
                  {message.senderUser?.username ?? "Unnamed User"}
                </span>
                <time className="previewTime" dateTime={sentAt.toISOString()}>
                  {formatPreviewTime(sentAt)}
                </time>
              </div>
              <p className="previewContent">{message.content}</p>
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
    </li>
  );
};

// how close to a carousel edge (px) a dragged card scrolls it, and how fast
const DRAG_SCROLL_EDGE = 60;
const DRAG_SCROLL_STEP = 16;

export const PinnedChatroomsList = ({
  pinnedGroup,
  id,
  onReorder,
  children,
}: pinnedChatroomsListProps) => {
  const theme = useTheme();
  const rowRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLUListElement>(null);
  // the wheel anywhere in the row scrolls the carousel sideways, or a card's
  // messages when the cursor is over them
  useWheelScrollsHorizontally(carouselRef, rowRef);

  const { itemProps, containerProps, itemState, draggingId } = useDragReorder({
    ids: pinnedGroup.chatrooms.map((c) => c.chatroomId),
    axis: "x",
    onReorder,
  });

  return (
    <div className="pinned-group-carousel" id={id} ref={rowRef}>
      <ul
        css={styles(theme)}
        ref={carouselRef}
        {...containerProps}
        onDragOver={(e) => {
          containerProps.onDragOver(e);
          // scroll while a card is dragged near either edge
          const list = carouselRef.current;
          if (!draggingId || !list) return;
          const box = list.getBoundingClientRect();
          if (e.clientX < box.left + DRAG_SCROLL_EDGE) {
            list.scrollLeft -= DRAG_SCROLL_STEP;
          } else if (e.clientX > box.right - DRAG_SCROLL_EDGE) {
            list.scrollLeft += DRAG_SCROLL_STEP;
          }
        }}
      >
        {pinnedGroup.chatrooms.map((chatroom) => (
          <PinnedChatroomCard
            key={chatroom.chatroomId}
            chatroom={chatroom}
            dragProps={itemProps(chatroom.chatroomId)}
            dragState={itemState(chatroom.chatroomId)}
          />
        ))}
      </ul>
      {children}
    </div>
  );
};
