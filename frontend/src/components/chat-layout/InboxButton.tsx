import { useEffect } from "react";
import { useAuthStore } from "../../hooks/useStores";
import { customQuery } from "../../utils/customQuery";
import type { Invite, InviteResponse } from "../../types/REST-types/Invite";
import DropdownButton from "../DropdownButton";
import { customMutation, type MutationArgs } from "../../utils/customMutation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { css, useTheme, type Theme } from "@emotion/react";
import { useInvitesStore } from "../../hooks/useStores";
import { mq } from "../../styles/breakpoints";
import { API_URL } from "../../env";
import { modalButtonStyles } from "../../styles/modalForm";

const styles = (theme: Theme) =>
  css(
    modalButtonStyles(theme),
    mq({
      width: ["min(320px, calc(100vw - 32px))", "320px"],

      ".invites": {
        listStyle: "none",
        margin: 0,
        padding: 0,
        maxHeight: "360px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
      },

      ".invite": {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "10px",
        borderRadius: theme.radius.sm,

        "&:hover": {
          backgroundColor: theme.colors.black,
        },
      },

      ".inviteText": {
        fontSize: "0.9rem",
        lineHeight: 1.4,
        color: theme.colors.light_grey,
        overflowWrap: "anywhere",

        strong: {
          fontWeight: 600,
          color: theme.colors.white,
        },
      },

      ".inviteActions": {
        display: "flex",
        gap: "6px",

        ".btn": {
          padding: "5px 12px",
          fontSize: "0.8rem",
        },
      },
    }),
  );

const iconStyles = (theme: Theme) =>
  css({
    position: "relative",
    display: "grid",

    ".unreadDot": {
      position: "absolute",
      top: "6px",
      right: "6px",
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      backgroundColor: theme.colors.accent,
      boxShadow: `0 0 0 2px ${theme.colors.black}`,
    },
  });

const InboxButton = () => {
  const user = useAuthStore((state) => state.user);
  const invites = useInvitesStore((state) => state.invites);
  const setInvites = useInvitesStore((state) => state.setInvites);
  const theme = useTheme();

  const { data: invitesData } = useQuery<Invite[]>({
    queryKey: ["inbox", user.token],
    queryFn: () =>
      customQuery<Invite[]>({
        fetchUrl: `${API_URL}/api/invites/me`,
      }),
    staleTime: Infinity,
  });

  const mutation = useMutation<InviteResponse, Error, MutationArgs>({
    mutationFn: customMutation<InviteResponse>,
  });

  useEffect(() => {
    if (!invitesData) return;
    setInvites(invitesData);
  }, [invitesData]);

  const handleInviteResponse = (inviteId: string, userAccepted: boolean) => {
    mutation.mutate({
      fetchUrl: `${API_URL}/api/invites/`,
      method: "PATCH",
      reqBody: { inviteId, status: userAccepted ? "ACCEPTED" : "REJECTED" },
    });
  };

  return (
    <DropdownButton
      aria-label={
        invites.length > 0
          ? `Open invite inbox, ${invites.length} pending`
          : "Open invite inbox"
      }
      buttonText={
        <span css={iconStyles(theme)}>
          <Mail className="headerIconBtn" />
          {invites.length > 0 && <span className="unreadDot" />}
        </span>
      }
      buttonVariant="icon"
      dropdownStyles={styles(theme)}
    >
      <div className="menuHeader">
        <p className="menuTitle">
          Invites{invites.length > 0 && ` · ${invites.length}`}
        </p>
      </div>
      {invites.length === 0 ? (
        <p className="menuEmpty">You're all caught up.</p>
      ) : (
        <ul className="invites">
          {invites.map((invite) => (
            <li key={invite.id} className="invite">
              <p className="inviteText">
                <strong>{invite.sender.username}</strong> invited you to{" "}
                <strong>{invite.chatroom.title}</strong>
              </p>
              <div className="inviteActions">
                <button
                  type="button"
                  className="btn btnPrimary"
                  onClick={() => handleInviteResponse(invite.id, true)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="btn btnSecondary"
                  onClick={() => handleInviteResponse(invite.id, false)}
                >
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DropdownButton>
  );
};

export default InboxButton;
