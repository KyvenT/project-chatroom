import { css } from "@emotion/react";
import useToggle from "../hooks/useToggle";
import Button from "./Button";

const buttonStyles = css({
  fontSize: "1.5rem",
  width: "fit-content",
  aspectRatio: "1",
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

const NewChatButton = () => {
  const [isToggled, setToggle] = useToggle(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Handle form submission logic here
    setToggle(false);
  };

  return (
    <>
      <Button
        onClick={() => setToggle(true)}
        variant="icon"
        css={buttonStyles}
      >
        +
      </Button>
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
