import { css, useTheme } from "@emotion/react";
import useToggle from "../hooks/useToggle";
import type { Theme } from "@emotion/react";

const buttonStyles = css({
  fontSize: "1.5rem",
  borderRadius: "5px",
  width: "fit-content",
  aspectRatio: "1",
  border: 0,
  backgroundColor: "inherit",
});

const dialogStyles = css({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  gap: "10px",
  backgroundColor: "white",
  borderRadius: "10px",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
  padding: "30px",

  ".close-btn": {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
  },
});

const buttonColors = (theme: Theme) =>
  css({
    color: theme.colors.white,

    "&:hover": {
      color: theme.colors.black,
      backgroundColor: theme.colors.light_grey,
    },
  });

const NewChatButton = () => {
  const [isToggled, setToggle] = useToggle(false);
  const theme = useTheme();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Handle form submission logic here
    setToggle(false);
  };

  return (
    <>
      <button
        onClick={() => setToggle(true)}
        css={[buttonStyles, buttonColors(theme)]}
      >
        +
      </button>
      <dialog
        css={dialogStyles}
        open={isToggled}
        onClose={() => setToggle(false)}
      >
        <h2>Create a Chatroom</h2>
        <form id="new-chat-form" onSubmit={handleSubmit}>
          <label htmlFor="chatroomName">Chatroom name: </label>
          <input
            id="chatroomName"
            type="text"
            placeholder="Title..."
            required
          />
          <div>
            <input type="checkbox" id="linkPrivacy" />
            <label htmlFor="linkPrivacy">Shareable link</label>
          </div>
          <div>
            <input type="checkbox" id="guestPrivacy" />
            <label htmlFor="guestPrivacy">Guests can join</label>
          </div>
          <button type="submit">Create</button>
        </form>
        <button className="close-btn" onClick={() => setToggle(false)}>
          X
        </button>
      </dialog>
    </>
  );
};

export default NewChatButton;
