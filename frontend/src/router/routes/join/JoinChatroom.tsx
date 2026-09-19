import { useTheme } from "@emotion/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Loader } from "../../../components/Loader";
import { API_URL } from "../../../env";
import { isLoggedInSelector, useAuthStore } from "../../../hooks/useStores";
import type { JoinInfo } from "../../../types/REST-types/Chatroom";
import type { UserAuth } from "../../../types/REST-types/User";
import {
  customMutation,
  type MutationArgs,
} from "../../../utils/customMutation";
import { customQuery } from "../../../utils/customQuery";
import { authPageStyles } from "../auth/Login";

const JoinChatroom = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { joinKey } = useParams();
  const isLoggedIn = useAuthStore(isLoggedInSelector);
  const isGuest = useAuthStore((state) => state.user.isGuest);
  const handleSignIn = useAuthStore((state) => state.handleSignIn);
  const guestNameRef = useRef<HTMLInputElement>(null);

  const {
    data: joinInfo,
    isLoading,
    error: lookupError,
  } = useQuery<JoinInfo>({
    queryKey: ["join-info", joinKey],
    queryFn: () =>
      customQuery({
        fetchUrl: `${API_URL}/api/chatroomsPublic/join/${joinKey}`,
      }),
    enabled: !!joinKey,
    retry: false,
  });

  const joinMutation = useMutation<{ chatroomId: string }, Error, MutationArgs>(
    {
      mutationFn: customMutation<{ chatroomId: string }>,
      onSuccess: ({ chatroomId }) => navigate(`/chat/${chatroomId}`),
    },
  );

  const guestMutation = useMutation<UserAuth, Error, MutationArgs>({
    mutationFn: customMutation<UserAuth>,
    onSuccess: (guestAuth) => {
      handleSignIn(guestAuth);
      if (joinInfo) navigate(`/chat/${joinInfo.chatroomId}`);
    },
  });

  const handleJoin = () => {
    joinMutation.mutate({
      fetchUrl: `${API_URL}/api/members/join`,
      method: "POST",
      reqBody: { joinKey },
    });
  };

  const handleGuestJoin = (event: React.FormEvent) => {
    event.preventDefault();
    const username = guestNameRef.current?.value;
    if (!username) return;
    guestMutation.mutate({
      fetchUrl: `${API_URL}/api/auth/create-guest`,
      method: "POST",
      reqBody: { username, joinKey },
    });
  };

  if (isLoading) {
    return (
      <div css={authPageStyles(theme)}>
        <Loader />
      </div>
    );
  }

  if (lookupError || !joinInfo) {
    return (
      <div css={authPageStyles(theme)}>
        <h1>Link not valid</h1>
        <p>This join link is invalid or has been replaced by the owner.</p>
        <Link to="/chat">Go to your chats</Link>
      </div>
    );
  }

  const openToUsers =
    joinInfo.privacy === "JOINABLE" || joinInfo.privacy === "PUBLIC";
  const openToGuests = joinInfo.privacy === "PUBLIC";

  return (
    <div css={authPageStyles(theme)}>
      <h1>Join "{joinInfo.title}"</h1>

      {isLoggedIn && (isGuest ? openToGuests : openToUsers) && (
        <div className="authForm">
          <button className="submitBtn" onClick={handleJoin}>
            Join chatroom
          </button>
          {joinMutation.error && <p>Error: {joinMutation.error.message}</p>}
        </div>
      )}

      {isLoggedIn && !(isGuest ? openToGuests : openToUsers) && (
        <p>This chatroom can only be joined with an invite.</p>
      )}

      {!isLoggedIn && !openToUsers && (
        <p>This chatroom can only be joined with an invite.</p>
      )}

      {!isLoggedIn && openToUsers && (
        <form className="authForm" onSubmit={handleGuestJoin}>
          <Link to="/login">Sign in to join</Link>
          {openToGuests && (
            <>
              <p>or continue as a guest</p>
              <input
                className="textInput usernameInput"
                ref={guestNameRef}
                placeholder="Guest username..."
                minLength={3}
                maxLength={20}
                required
              />
              {guestMutation.isPending && <Loader />}
              {guestMutation.error && (
                <p>Error: {guestMutation.error.message}</p>
              )}
              <button className="submitBtn" type="submit">
                Join as guest
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
};

export default JoinChatroom;
