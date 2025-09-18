import type { Theme } from "@emotion/react";
import { css, useTheme } from "@emotion/react";
import { useChatroomsStore } from "../../../hooks/useStores";
import Button from "../../../components/Button";
import { Pin } from "lucide-react";

const styles = css({
  ".pinned-chatroom": {
    padding: "4px 8px",
    borderRadius: "4px",
  },

  ul: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },

  ".pinned-chatrooms": {
    display: "flex",
    gap: "10px",
    overflowX: "auto",
  },

  h6: {
    fontSize: "1rem",
    fontWeight: "300",
  },

  p: {
    fontSize: "0.9rem",
  },
});

const colors = (theme: Theme) =>
  css({
    h2: {
      color: theme.colors.white,
      fontWeight: "400",
    },

    h4: {},

    ".pinned-chatroom": {
      color: theme.colors.light_grey,
      border: `1px solid ${theme.colors.dark_grey}`,
    },
  });

const ChatHome = () => {
  const theme = useTheme();
  const chatrooms = useChatroomsStore((state) => state.chatrooms);
  // TODO: add pinned/favourite chatrooms in backend,
  // add table with userId and chatroomIds
  // also add special case value for active chatroom when at ChatHome
  // to receive messages for all pinned chatrooms

  return (
    <>
      <div css={[styles, colors(theme)]}>
        <h2>Pinned Chatrooms</h2>
        <ul className="pinned-chatrooms">
          <li className="pinned-chatroom">
            <h4>Sample Chatroom</h4>
            <ul>
              <li>
                <p>Message 1</p>
                <p>Message 2</p>
                <p>Message 3</p>
                <p>Message 4</p>
                <p>Message 5</p>
              </li>
            </ul>
          </li>
          <Button className="pinned-chatroom" variant="icon">
            <Pin />
            <p>Add a chatroom</p>
          </Button>
        </ul>
      </div>
    </>
  );
};

export default ChatHome;
