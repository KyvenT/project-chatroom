import { css } from "@emotion/react";
import { useEffect, useState } from "react";
import { usePopoutStore } from "../../hooks/usePopoutStore";
import { useAuthStore, useChatroomsStore } from "../../hooks/useStores";
import { sendWSMessage } from "../../ws-router/ws";
import { PopoutChat } from "./PopoutChat";

const POPOUT_WIDTH = 320;
const GAP = 12;
const EDGE = 16;

const styles = css({
  position: "fixed",
  right: `${EDGE}px`,
  bottom: 0,
  zIndex: 1,
  display: "flex",
  alignItems: "flex-end",
  gap: `${GAP}px`,
  // clicks between the pop-outs reach the page underneath
  pointerEvents: "none",
  "& > *": { pointerEvents: "auto" },
});

// how many pop-outs fit side by side
const fitCount = () =>
  Math.max(
    1,
    Math.floor((window.innerWidth - 2 * EDGE + GAP) / (POPOUT_WIDTH + GAP)),
  );

// The docked chat pop-outs, newest on the right
export const PopoutDock = () => {
  const popouts = usePopoutStore((state) => state.popouts);
  const activeWindowTab = usePopoutStore((state) => state.activeWindowTab);
  const chatrooms = useChatroomsStore((state) => state.chatrooms);
  const token = useAuthStore((state) => state.user.token);
  const [maxVisible, setMaxVisible] = useState(fitCount);

  useEffect(() => {
    const onResize = () => setMaxVisible(fitCount());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // pop-outs of chatrooms the user has left aren't shown
  const memberOf = new Set(chatrooms.map((c) => c.chatroomId));
  const shown = popouts
    .filter((p) => memberOf.has(p.chatroomId))
    .slice(-maxVisible);

  // the server only sends live messages for chatrooms being watched
  // (expanded pop-outs, and the chat showing in the chat window)
  const watched = [
    ...shown.filter((p) => !p.minimized).map((p) => p.chatroomId),
    ...(activeWindowTab ? [activeWindowTab] : []),
  ]
    .sort()
    .join(",");
  useEffect(() => {
    if (!token) return;
    sendWSMessage({
      type: "update-watched-chatrooms",
      chatroomIds: watched ? watched.split(",") : [],
    });
  }, [watched, token]);

  // stop watching when the dock goes away (e.g. signing out)
  useEffect(
    () => () =>
      sendWSMessage({ type: "update-watched-chatrooms", chatroomIds: [] }),
    [],
  );

  if (shown.length === 0) return null;

  return (
    <div css={styles} aria-label="Chat pop-outs" role="region">
      {shown.map((popout) => (
        <PopoutChat key={popout.chatroomId} popout={popout} />
      ))}
    </div>
  );
};
