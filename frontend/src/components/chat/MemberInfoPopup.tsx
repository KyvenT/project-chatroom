import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  ChatroomMember,
  ChatroomMemberDetails,
} from "../../types/REST-types/ChatroomMember";
import { customQuery } from "../../hooks/useCustomQuery";
import { useAuthStore } from "../../hooks/useStores";
import { useParams } from "react-router";
import { css, useTheme } from "@emotion/react";
import { mq } from "../../styles/breakpoints";
import type { Theme } from "@emotion/react";
import { useMembersStore } from "../../hooks/useStores";
import Button from "../Button";
import type { ConfirmationResponse } from "../../types/REST-types/Invite";
import {
  customMutation,
  type MutationArgs,
} from "../../hooks/useCustomMutation";
import { useOutsideClick } from "../../hooks/useHandleOutsideClick";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { API_URL } from "../../env";

type PopupPosition = "LEFT" | "RIGHT";

export type MemberInfoProps = {
  clickedMember: {
    member: ChatroomMember;
    button: HTMLButtonElement;
  };
  onClose: () => void;
  position?: PopupPosition;
};

const styles = (
  theme: Theme,
  button: HTMLButtonElement,
  position: PopupPosition,
) =>
  css(
    mq({
      position: "absolute",
      top: button.getBoundingClientRect().top,
      ...(position === "LEFT"
        ? {
            left: button.getBoundingClientRect().left,
            transform: "translateX(-100%)",
          }
        : {
            left: button.getBoundingClientRect().right,
          }),

      border: `1px solid ${theme.colors.white}`,
      borderRadius: "4px",
      padding: "8px",
      color: theme.colors.white,
      backgroundColor: theme.colors.dark_grey,

      ".username": {
        fontSize: "1.3rem",
        fontWeight: "500",
      },

      ".status": {
        fontSize: ".8rem",
        color: theme.colors.light_grey,
        cursor: "default",
      },

      ".joinedAt": {
        fontSize: "1rem",
        cursor: "default",
      },

      ".kickBtn": {
        backgroundColor: "transparent",
        border: `1px solid ${theme.colors.white}`,
        color: theme.colors.white,
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "1.05rem",
        cursor: "pointer",
      },

      ".kickBtn:hover": {
        backgroundColor: theme.colors.grey,
      },

      ".you-tag": {
        color: theme.colors.grey,
        padding: "0 4px",
        fontSize: "1rem",
        cursor: "default",
      },

      ".isGuest": {
        color: theme.colors.light_grey,
        fontSize: ".9rem",
        cursor: "default",
      },

      ".username-container": {
        display: "flex",
        alignItems: "center",
      },

      ".buttons-container": {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 0 0",
      },
    }),
  );

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

  useOutsideClick({ callbackFn: onClose, elementRef: popupRef });

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

  const userRole = members.find((mem) => mem.memberId === user.userId)?.role;
  const canKick = userRole !== "MEMBER" && userRole !== member.role;

  return createPortal(
    <div css={styles(theme, button, position)} ref={popupRef}>
      <div className="username-container">
        <h3 className="username">{member.member.username}</h3>
        {member.memberId === user.userId && (
          <span className="you-tag">(YOU)</span>
        )}
      </div>
      <p className="status">{member.member.status}</p>
      {data?.member.isGuest && <p className="isGuest">(Guest)</p>}
      <p className="joinedAt">
        joined {data && new Date(data.joinedAt).toLocaleDateString()}
      </p>
      <div className="buttons-container">
        {canKick && (
          <Button onClick={handleKick} disabled={!canKick} className="kickBtn">
            Kick
          </Button>
        )}
      </div>
    </div>,
    document.body,
  );
};
