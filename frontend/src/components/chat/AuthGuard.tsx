import { css } from "@emotion/react";
import { Link, useParams } from "react-router";
import Modal from "../Modal";
import useToggle from "../../hooks/useToggle";
import useAuthContext from "../../hooks/useAuthContext";
import { ArrowLeftIcon } from "lucide-react";
import type { UserAuth } from "../../types/REST-types/User";
import React, { useEffect, useRef, useState } from "react";
import useWebSocketContext from "../../hooks/useWebSocketContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ChatroomPrivacy } from "../../types/REST-types/Chatroom";
import { nonVerifiedQuery } from "../../hooks/useCustomQuery";
import {
  nonVerifiedMutation,
  type MutationArgs,
} from "../../hooks/useCustomMutation";

const styles = css({
  position: "relative",

  ".subpageContainer": {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "orange",
    width: "100%",
    padding: "30px",
    gap: "8px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  ".backBtn": {
    position: "absolute",
    top: "5px",
    left: "5px",
    width: "fit-content",
  },
});

const modalStyles = css({
  borderRadius: "10px",
  border: "2px solid black",
});

interface privacyDataType {
  privacy: ChatroomPrivacy;
}

const AuthGuard = () => {
  const [toggleContinueAsGuest, setToggleContinueAsGuest] = useToggle(false);
  const { isLoggedIn, handleSignIn } = useAuthContext();
  const { handleWSAuth } = useWebSocketContext();
  const { chatroomId } = useParams();
  const guestNameRef = useRef<HTMLInputElement>(null);
  const [chatroomJoinable, setChatroomJoinable] = useState<boolean>(false);

  const { data: privacyData } = useQuery<privacyDataType>({
    queryKey: ["active-chatroom", chatroomId],
    queryFn: () =>
      nonVerifiedQuery({
        fetchUrl: "http://localhost:3000/api/chatroomsPublic/" + chatroomId,
      }),
    enabled: !!chatroomId,
    staleTime: Infinity,
  });

  const { mutate } = useMutation<UserAuth, Error, MutationArgs>({
    mutationFn: nonVerifiedMutation<UserAuth>,
    onSuccess: (guestAuthData) => {
      if (!guestAuthData) return;
      handleSignIn(guestAuthData);
      handleWSAuth(guestAuthData.token);
    },
  });

  useEffect(() => {
    if (privacyData?.privacy === "PUBLIC") {
      setChatroomJoinable(true);
    } else {
      setChatroomJoinable(false);
    }
  }, [privacyData]);

  const handleGuestCreation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (privacyData?.privacy !== "PUBLIC") return;

    const username = guestNameRef.current?.value;
    if (!username) return;
    mutate({
      fetchUrl: "http://localhost:3000/api/auth/create-guest",
      method: "POST",
      reqBody: { username, chatroomId },
    });
  };

  return (
    <Modal
      open={!isLoggedIn}
      modalStyles={modalStyles}
      variant="requiredInteraction"
    >
      <div css={styles}>
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
              <div>
                <label htmlFor="usernameInput">Username: </label>
                <input
                  id="usernameInput"
                  placeholder="Bob..."
                  ref={guestNameRef}
                ></input>
              </div>
              <button type="submit">Join as Guest</button>
            </form>
          </div>
        ) : (
          <div className="subpageContainer">
            <h3>You are currently not logged in</h3>
            <Link to="/login">Sign in to chat</Link>
            {chatroomJoinable && (
              <>
                <p>or</p>
                <a onClick={() => setToggleContinueAsGuest(true)}>
                  Join chatroom as Guest
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AuthGuard;
