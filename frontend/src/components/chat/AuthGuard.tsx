import { css, useTheme } from "@emotion/react";
import { Link, useParams } from "react-router";
import Modal from "../Modal";
import useToggle from "../../hooks/useToggle";
import { isLoggedInSelector, useAuthStore } from "../../hooks/useStores";
import { ArrowLeftIcon } from "lucide-react";
import type { UserAuth } from "../../types/REST-types/User";
import React, { useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ChatroomPrivacy } from "../../types/REST-types/Chatroom";
import { customQuery } from "../../hooks/useCustomQuery";
import {
  customMutation,
  type MutationArgs,
} from "../../hooks/useCustomMutation";
import type { Theme } from "@emotion/react";
import { handleWSAuth } from "../../ws-router/out-going-ws-messages/auth";
import { API_URL } from "../../env";

const styles = (theme: Theme) =>
  css({
    position: "relative",

    ".subpageContainer": {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      backgroundColor: theme.colors.dark_grey,
      color: theme.colors.white,
      width: "100%",
      padding: "20px",
      gap: "8px",
    },

    h3: {
      cursor: "default",
      fontWeight: 400,
      fontSize: "1.2rem",
      textAlign: "center",
    },

    form: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontSize: "1rem",

      input: {
        fontSize: "1rem",
        background: theme.colors.grey,
        border: `1px solid ${theme.colors.white}`,
        borderRadius: "2px",
        padding: "2px",
        color: theme.colors.white,
      },
    },

    ".backBtn": {
      position: "absolute",
      top: "5px",
      left: "5px",
      width: "fit-content",
    },

    ".toggleCreateGuestBtn, a": {
      textDecoration: "none",
      fontSize: "1rem",
      cursor: "pointer",
      color: theme.colors.light_grey,
      backgroundColor: "transparent",
      border: 0,
    },

    ".toggleCreateGuestBtn:hover, a:hover": {
      color: theme.colors.white,
    },

    p: {
      fontSize: ".9rem",
      color: theme.colors.white,
    },

    ".guestSubmitBtn": {
      backgroundColor: "transparent",
      border: `1px solid ${theme.colors.white}`,
      color: theme.colors.white,
      padding: "8px",
      borderRadius: "4px",
    },

    ".guestSubmitBtn:hover": {
      backgroundColor: theme.colors.grey,
    },

    ".errorMessage": {
      color: "#ff4d4d",
      fontSize: "0.9rem",
    },
  });

const modalStyles = (theme: Theme) =>
  css({
    borderRadius: "10px",
    border: `1px solid ${theme.colors.white}`,
  });

interface privacyDataType {
  privacy: ChatroomPrivacy;
}

const AuthGuard = () => {
  const [toggleContinueAsGuest, setToggleContinueAsGuest] = useToggle(false);
  const handleSignIn = useAuthStore((state) => state.handleSignIn);
  const { chatroomId } = useParams();
  const guestNameRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isLoggedIn = useAuthStore(isLoggedInSelector);

  const { data: privacyData } = useQuery<privacyDataType>({
    queryKey: ["chatroom-privacy", chatroomId],
    queryFn: () =>
      customQuery({
        fetchUrl: `${API_URL}/api/chatroomsPublic/${chatroomId}`,
      }),
    enabled: !!chatroomId,
    staleTime: Infinity,
  });

  const { mutate, error } = useMutation<UserAuth, Error, MutationArgs>({
    mutationFn: customMutation<UserAuth>,
    onSuccess: (guestAuthData) => {
      if (!guestAuthData) return;
      handleSignIn(guestAuthData);
      handleWSAuth(guestAuthData.token);
    },
  });

  const handleGuestCreation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (privacyData?.privacy !== "PUBLIC") return;

    const username = guestNameRef.current?.value;
    if (!username) return;
    mutate({
      fetchUrl: `${API_URL}/api/auth/create-guest`,
      method: "POST",
      reqBody: { username, chatroomId },
    });
  };

  const chatroomJoinable: boolean = privacyData?.privacy === "PUBLIC";
  const errorMessage: string = error?.message || "";

  return (
    <Modal
      open={!isLoggedIn}
      modalStyles={modalStyles(theme)}
      variant="requiredInteraction"
    >
      <div css={styles(theme)}>
        {toggleContinueAsGuest ? (
          <div className="subpageContainer">
            <a
              className="backBtn"
              onClick={() => setToggleContinueAsGuest(false)}
            >
              <ArrowLeftIcon />
            </a>
            <h3>Create a Guest User</h3>
            <form id="createGuest" onSubmit={handleGuestCreation}>
              <div className="guestNameInputSection">
                <label htmlFor="usernameInput">Username: </label>
                <input
                  id="usernameInput"
                  placeholder="Bob..."
                  ref={guestNameRef}
                ></input>
              </div>
            </form>
            <span className="errorMessage">{errorMessage}</span>
            <button className="guestSubmitBtn" type="submit" form="createGuest">
              Join as Guest
            </button>
          </div>
        ) : (
          <div className="subpageContainer">
            <h3>You are currently not logged in</h3>
            <Link to="/login">Sign in to chat</Link>
            {chatroomJoinable && (
              <>
                <p>or</p>
                <button
                  className="toggleCreateGuestBtn"
                  onClick={() => setToggleContinueAsGuest(true)}
                >
                  Join chatroom as Guest
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AuthGuard;
