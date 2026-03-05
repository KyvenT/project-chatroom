import React, { useEffect } from "react";
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

const styles = (theme: Theme) =>
  css(
    mq({
      width: "fit-content",
      display: "flex",
      flexDirection: "column",
      backgroundColor: theme.colors.grey,
      padding: "12px",
      borderRadius: "4px",
      border: `1px solid ${theme.colors.light_grey}`,
      minHeight: "70px",
      justifyContent: "center",

      ul: {
        listStyle: "none",
        padding: 0,
      },

      ".emptyInboxMsg": { textWrap: "nowrap" },

      ".invite": {
        width: "fit-content",
        textWrap: "nowrap",
      },

      ".invite-chatroom-title": {
        fontSize: "1.3rem",
        fontWeight: "400",
        cursor: "default",
      },

      ".invite-sender": {
        fontSize: "1rem",
        cursor: "default",
      },

      ".invite-response-btn": {
        backgroundColor: "transparent",
        color: theme.colors.white,
        fontSize: "1rem",
        border: `1px solid ${theme.colors.white}`,
        borderRadius: "4px",
        padding: "4px",
        cursor: "pointer",
      },

      ".invite-response-btn:hover": {
        backgroundColor: theme.colors.light_grey,
        color: theme.colors.black,
        borderColor: theme.colors.black,
      },

      ".invite-response-btns": {
        display: "flex",
        gap: "8px",
        padding: "4px",
      },

      ".invites": {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "8px",
      },
    }),
  );

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

  const handleInviteResponse = (
    event: React.FormEvent,
    userAccepted: boolean,
  ) => {
    event.preventDefault();
    const inviteId = (event.target as HTMLButtonElement).form?.id;

    let status;
    if (userAccepted) {
      status = "ACCEPTED";
    } else {
      status = "REJECTED";
    }

    mutation.mutate({
      fetchUrl: `${API_URL}/api/invites/`,
      method: "PATCH",
      reqBody: { inviteId, status },
    });
    const responseData = mutation.data;
    console.log(responseData);
  };

  return (
    <DropdownButton
      aria-label="Open invite inbox"
      buttonText={<Mail size="2.5rem" />}
      buttonVariant="icon"
      dropdownStyles={styles(theme)}
    >
      {invites.length === 0 && <p className="emptyInboxMsg">All caught up!</p>}
      <ul className="invites">
        {invites.map((invite) => {
          return (
            <li key={invite.id} className="invite">
              <h5 className="invite-chatroom-title">{invite.chatroom.title}</h5>
              <p className="invite-sender">Sent by: {invite.sender.username}</p>
              <form id={invite.id} className="invite-response-btns">
                <button
                  id="accept"
                  className="invite-response-btn"
                  onClick={(event) => handleInviteResponse(event, true)}
                >
                  Accept
                </button>
                <button
                  id="reject"
                  className="invite-response-btn"
                  onClick={(event) => handleInviteResponse(event, false)}
                >
                  Reject
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </DropdownButton>
  );
};

export default InboxButton;
