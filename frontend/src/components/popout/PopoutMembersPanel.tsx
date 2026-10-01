import { css, useTheme, type Theme } from "@emotion/react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { API_URL } from "../../env";
import { useAuthStore } from "../../hooks/useStores";
import type { ChatroomMember } from "../../types/REST-types/ChatroomMember";
import { customQuery } from "../../utils/customQuery";
import { membersQueryKey } from "../../utils/membersCache";
import { Avatar } from "../Avatar";
import Button from "../Button";
import { Loader } from "../Loader";
import { MemberInfo } from "../chat/MemberInfoPopup";

// below this window width (px), the panel covers the chat instead of sitting
// beside it
export const NARROW_WINDOW = 480;

const styles = (theme: Theme) =>
  css({
    flex: "0 0 200px",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    backgroundColor: theme.colors.dark_grey,
    borderLeft: `1px solid ${theme.colors.border}`,

    [`@media (max-width: ${NARROW_WINDOW}px)`]: {
      position: "absolute",
      inset: 0,
      zIndex: 5,
      borderLeft: 0,
    },

    ".panelHeader": {
      flex: "0 0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 6px 4px 12px",
      fontSize: "0.8rem",
      fontWeight: 600,
      color: theme.colors.light_grey,
    },

    ".panelClose": {
      width: "1.5rem",
      height: "1.5rem",
      padding: 0,
      svg: { width: "0.9rem", height: "0.9rem" },
    },

    ".panelBody": {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: "0 6px 8px",
    },

    ".statusTitle": {
      margin: 0,
      padding: "10px 6px 4px",
      fontSize: "0.68rem",
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: theme.colors.light_grey,
    },

    ul: { listStyle: "none", margin: 0, padding: 0 },

    ".memberBtn": {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "4px 6px",
      border: 0,
      borderRadius: theme.radius.sm,
      font: "inherit",
      fontSize: "0.85rem",
      textAlign: "left",
      color: theme.colors.white,
      backgroundColor: "transparent",
      cursor: "pointer",

      "&:hover": { backgroundColor: theme.colors.grey },
      "&:focus-visible": {
        outline: `2px solid ${theme.colors.accent}`,
        outlineOffset: "-2px",
      },
    },

    ".offline .memberBtn": { opacity: 0.55 },

    ".memberName": {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    ".role": {
      flex: "0 0 auto",
      fontSize: "0.65rem",
      color: theme.colors.light_grey,
    },

    ".panelStatus": {
      display: "flex",
      justifyContent: "center",
      padding: "16px",
      fontSize: "0.8rem",
      color: theme.colors.light_grey,
    },
  });

const STATUSES = [
  { status: "ONLINE", title: "Online" },
  { status: "AWAY", title: "Away" },
  { status: "OFFLINE", title: "Offline" },
] as const;

const ROLE_LABELS: Partial<Record<ChatroomMember["role"], string>> = {
  OWNER: "Owner",
  ADMIN: "Admin",
};

// A pop-out chat's members, by status. Kept up to date over the socket.
export const PopoutMembersPanel = ({
  chatroomId,
  onClose,
}: {
  chatroomId: string;
  onClose: () => void;
}) => {
  const theme = useTheme();
  const token = useAuthStore((state) => state.user.token);
  const { data: members, isError } = useQuery<ChatroomMember[]>({
    queryKey: membersQueryKey(chatroomId),
    queryFn: () =>
      customQuery<ChatroomMember[]>({
        fetchUrl: `${API_URL}/api/members/${chatroomId}`,
      }),
    enabled: !!token,
    refetchOnWindowFocus: false,
  });
  // whose profile is open, and the button it opened from
  const [clicked, setClicked] = useState<{
    memberId: string;
    button: HTMLButtonElement;
  } | null>(null);
  // the latest of them, so their status stays current (or gone if they leave)
  const clickedMember =
    clicked && members?.find((m) => m.memberId === clicked.memberId);

  return (
    <aside css={styles(theme)} aria-label="Members">
      <div className="panelHeader">
        <span>Members{members && ` — ${members.length}`}</span>
        <Button
          variant="icon"
          className="panelClose"
          aria-label="Close members list"
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
      <div className="panelBody">
        {!members ? (
          <div className="panelStatus">
            {isError ? "Couldn't load members" : <Loader />}
          </div>
        ) : (
          STATUSES.map(({ status, title }) => {
            const list = members
              .filter((m) => m.member.status === status)
              .sort((a, b) =>
                a.member.username.localeCompare(b.member.username),
              );
            if (list.length === 0) return null;
            return (
              <section key={status} aria-label={title}>
                <h3 className="statusTitle">
                  {title} — {list.length}
                </h3>
                <ul>
                  {list.map((m) => (
                    <li
                      key={m.memberId}
                      className={status === "OFFLINE" ? "offline" : undefined}
                    >
                      <button
                        type="button"
                        className="memberBtn"
                        aria-haspopup="dialog"
                        onClick={(event) =>
                          setClicked({
                            memberId: m.memberId,
                            button: event.currentTarget,
                          })
                        }
                      >
                        <Avatar
                          userId={m.memberId}
                          username={m.member.username}
                          avatarUpdatedAt={m.member.avatarUpdatedAt}
                          size={24}
                        />
                        <span className="memberName">{m.member.username}</span>
                        {ROLE_LABELS[m.role] && (
                          <span className="role">{ROLE_LABELS[m.role]}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
      {clicked && clickedMember && (
        <MemberInfo
          clickedMember={{ member: clickedMember, button: clicked.button }}
          onClose={() => setClicked(null)}
          // the panel is on the right, so the profile opens beside it
          position="LEFT"
          chatroomId={chatroomId}
          members={members}
        />
      )}
    </aside>
  );
};
