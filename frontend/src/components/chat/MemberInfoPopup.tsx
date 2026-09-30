import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  ChatroomMember,
  ChatroomMemberDetails,
} from "../../types/REST-types/ChatroomMember";
import { customQuery } from "../../utils/customQuery";
import { useAuthStore } from "../../hooks/useStores";
import { useParams } from "react-router";
import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import { useMembersStore } from "../../hooks/useStores";
import type { ConfirmationResponse } from "../../types/REST-types/Invite";
import { customMutation, type MutationArgs } from "../../utils/customMutation";
import { useOutsideClick } from "../../hooks/useHandleOutsideClick";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { API_URL } from "../../env";
import { Avatar } from "../Avatar";
import { UserMinus } from "lucide-react";
import { statusColor, STATUS_LABELS } from "../../utils/status";

type PopupPosition = "LEFT" | "RIGHT";

export type MemberInfoProps = {
  clickedMember: {
    member: ChatroomMember;
    button: HTMLButtonElement;
  };
  onClose: () => void;
  position?: PopupPosition;
};

// how wide (px) the popup is, and how far it keeps from the window's edges
const POPUP_WIDTH = 280;
const EDGE_GAP = 8;

// Next to the clicked name or picture, kept inside the window
const placePopup = (
  anchor: DOMRect,
  position: PopupPosition,
  height: number,
) => {
  const left =
    position === "LEFT"
      ? anchor.left - POPUP_WIDTH - EDGE_GAP
      : anchor.right + EDGE_GAP;
  const maxLeft = window.innerWidth - POPUP_WIDTH - EDGE_GAP;
  const maxTop = window.innerHeight - height - EDGE_GAP;
  return {
    left: Math.max(EDGE_GAP, Math.min(left, maxLeft)),
    top: Math.max(EDGE_GAP, Math.min(anchor.top, maxTop)),
  };
};

const styles = (theme: Theme) =>
  css({
    position: "fixed",
    zIndex: 20,
    width: `${POPUP_WIDTH}px`,
    maxWidth: `calc(100vw - ${EDGE_GAP * 2}px)`,
    overflow: "hidden",
    color: theme.colors.white,
    backgroundColor: theme.colors.dark_grey,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.popup,
    outline: "none",
    // the status dot's ring matches the card
    "--avatar-ring": theme.colors.dark_grey,

    ".banner": {
      height: "56px",
      background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentSoft})`,
    },

    ".identity": {
      padding: "0 16px",
      marginTop: "-32px",
    },

    ".identity > span": {
      borderRadius: "50%",
      boxShadow: `0 0 0 4px ${theme.colors.dark_grey}`,
    },

    ".nameRow": {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "6px",
      marginTop: "8px",
    },

    ".username": {
      minWidth: 0,
      fontSize: "1.15rem",
      fontWeight: 700,
      overflowWrap: "anywhere",
    },

    ".badge": {
      padding: "1px 7px",
      fontSize: "0.68rem",
      fontWeight: 600,
      letterSpacing: "0.03em",
      textTransform: "uppercase",
      borderRadius: "999px",
      color: theme.colors.light_grey,
      backgroundColor: theme.colors.grey,
    },

    ".badge.accent": {
      color: theme.colors.accent,
      backgroundColor: theme.colors.accentSoft,
    },

    ".details": {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      margin: "14px 16px 0",
      padding: "12px 0 0",
      borderTop: `1px solid ${theme.colors.border}`,
    },

    ".detail": {
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      fontSize: "0.82rem",

      dt: { color: theme.colors.light_grey },
      dd: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        textAlign: "right",
      },
    },

    ".statusDot": {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
    },

    ".actions": {
      padding: "14px 16px 16px",
    },

    ".kickBtn": {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      padding: "8px 12px",
      fontSize: "0.85rem",
      fontWeight: 500,
      color: theme.colors.danger,
      backgroundColor: "transparent",
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.radius.sm,
      cursor: "pointer",
      transition: "background-color 0.15s ease, border-color 0.15s ease",

      "&:hover": {
        backgroundColor: theme.colors.dangerSoft,
        borderColor: theme.colors.danger,
      },
      "&:focus-visible": {
        outline: `2px solid ${theme.colors.accent}`,
        outlineOffset: "2px",
      },
    },

    // with nothing to act on, the details end the card
    "&.noActions .details": { paddingBottom: "16px" },
  });

const ROLE_LABELS: Partial<Record<ChatroomMember["role"], string>> = {
  OWNER: "Owner",
  ADMIN: "Admin",
};

const formatDate = (date: string | Date | undefined) =>
  date
    ? new Date(date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "…";

export const MemberInfo = ({
  clickedMember: { member, button },
  onClose,
  position = "LEFT",
}: MemberInfoProps) => {
  const { chatroomId } = useParams();
  const theme = useTheme();
  const members = useMembersStore((state) => state.members);
  const user = useAuthStore((state) => state.user);

  const popupRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation<ConfirmationResponse, Error, MutationArgs>({
    mutationFn: customMutation,
  });

  const { data } = useQuery<ChatroomMemberDetails>({
    queryKey: [member.memberId],
    queryFn: () =>
      customQuery({
        fetchUrl: `${API_URL}/api/members/${chatroomId}/${member.memberId}`,
      }),
  });

  const userRole = members.find((mem) => mem.memberId === user.userId)?.role;
  const canKick = userRole !== "MEMBER" && userRole !== member.role;

  useOutsideClick({ callbackFn: onClose, elementRef: popupRef });

  // focus moves into the popup so Escape closes it, and back to what opened
  // it afterwards
  useEffect(() => {
    popupRef.current?.focus({ preventScroll: true });
    return () => button.focus({ preventScroll: true });
  }, [button]);

  // placed once its height is known, and again when its contents load
  const [place, setPlace] = useState<{ top: number; left: number }>();
  useLayoutEffect(() => {
    const popup = popupRef.current;
    if (!popup) return;
    setPlace(
      placePopup(button.getBoundingClientRect(), position, popup.offsetHeight),
    );
  }, [button, position, data, canKick]);

  const handleKick = () => {
    mutation.mutate({
      fetchUrl: `${API_URL}/api/members/${chatroomId}`,
      method: "DELETE",
      reqBody: {
        memberId: member.memberId,
      },
    });
    onClose();
  };

  const isYou = member.memberId === user.userId;
  const roleLabel = ROLE_LABELS[member.role];

  return createPortal(
    <div
      css={styles(theme)}
      className={canKick ? undefined : "noActions"}
      ref={popupRef}
      role="dialog"
      tabIndex={-1}
      aria-label={`${member.member.username}'s profile`}
      style={place ?? { visibility: "hidden" }}
      onKeyDown={(event) => event.key === "Escape" && onClose()}
    >
      <div className="banner" />
      <div className="identity">
        <Avatar
          userId={member.memberId}
          username={member.member.username}
          avatarUpdatedAt={member.member.avatarUpdatedAt}
          size={64}
          status={member.member.status}
        />
        <div className="nameRow">
          <h3 className="username">{member.member.username}</h3>
          {isYou && <span className="badge accent">You</span>}
          {roleLabel && <span className="badge accent">{roleLabel}</span>}
          {data?.member.isGuest && <span className="badge">Guest</span>}
        </div>
      </div>
      <dl className="details">
        <div className="detail">
          <dt>Status</dt>
          <dd>
            <span
              className="statusDot"
              style={{
                backgroundColor: statusColor(theme, member.member.status),
              }}
            />
            {STATUS_LABELS[member.member.status]}
          </dd>
        </div>
        <div className="detail">
          <dt>Joined this chatroom</dt>
          <dd>{formatDate(data?.joinedAt)}</dd>
        </div>
        <div className="detail">
          <dt>Member since</dt>
          <dd>{formatDate(data?.member.createdAt)}</dd>
        </div>
      </dl>
      {canKick && (
        <div className="actions">
          <button type="button" onClick={handleKick} className="kickBtn">
            <UserMinus size="1rem" />
            Kick from chatroom
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
};
