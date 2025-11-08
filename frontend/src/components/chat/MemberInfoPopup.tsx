import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  ChatroomMember,
  ChatroomMemberDetails,
} from "../../types/REST-types/ChatroomMember";
import { verifiedQuery } from "../../hooks/useCustomQuery";
import useAuthContext from "../../hooks/useAuthContext";
import { useParams } from "react-router";
import { css, useTheme } from "@emotion/react";
import { mq } from "../../styles/breakpoints";
import type { Theme } from "@emotion/react";
import { useMembersStore } from "../../hooks/useStores";
import Button from "../Button";
import type { ConfirmationResponse } from "../../types/REST-types/Invite";
import {
  verifiedMutation,
  type MutationArgs,
} from "../../hooks/useCustomMutation";
import { useOutsideClick } from "../../hooks/useHandleOutsideClick";
import { useRef } from "react";
import { createPortal } from "react-dom";

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
  position: PopupPosition
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
        fontSize: "1rem",
      },

      ".joinedAt": {
        fontSize: "1rem",
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
    })
  );

export const MemberInfo = ({
  clickedMember: { member, button },
  onClose,
  position = "LEFT",
}: MemberInfoProps) => {
  const { chatroomId } = useParams();
  const theme = useTheme();
  const members = useMembersStore((state) => state.members);
  const { user } = useAuthContext();
  const popupRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation<ConfirmationResponse, Error, MutationArgs>({
    mutationFn: verifiedMutation,
  });

  const { data } = useQuery<ChatroomMemberDetails>({
    queryKey: [member.memberId],
    queryFn: () =>
      verifiedQuery({
        fetchUrl: `http://localhost:3000/api/members/${chatroomId}/${member.memberId}`,
        user,
      }),
  });

  useOutsideClick(onClose, popupRef);

  const userRole = members.find((mem) => mem.memberId === user.userId)?.role;
  const canKick = userRole !== "MEMBER" && userRole !== member.role;

  const handleKick = () => {
    mutation.mutate({
      fetchUrl: `http://localhost:3000/api/members/${chatroomId}`,
      method: "DELETE",
      user,
      reqBody: {
        memberId: member.memberId,
      },
    });
    onClose();
  };

  return createPortal(
    <div css={styles(theme, button, position)} ref={popupRef}>
      <h3 className="username">{member.member.username}</h3>
      <p className="status">{member.member.status}</p>
      <p className="joinedAt">
        joined {data && new Date(data.joinedAt).toLocaleDateString()}
      </p>
      {canKick && (
        <Button onClick={handleKick} disabled={!canKick} className="kickBtn">
          Kick
        </Button>
      )}
    </div>,
    document.body
  );
};
