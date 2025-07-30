import { css } from "@emotion/react";
import useToggle from "../hooks/useToggle";

const buttonStyles = css({

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
    }
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
            <button onClick={() => setToggle(true)} css={buttonStyles}>
                New Chat
            </button>
            {/* typescript did not support closedby yet */}
            {/* @ts-ignore */}
            <dialog css={dialogStyles} open={isToggled} closedBy="any" onClose={() => setToggle(false)}>
                <h2>Create a Chatroom</h2>
                <form id="new-chat-form" onSubmit={handleSubmit}>
                    <input type="text" placeholder="Chat Name" required />
                    <div>
                        <input type="checkbox" id="private" />
                        <label htmlFor="private">Private Chat</label>
                    </div>
                    <button type="submit">Create</button>
                </form>
                <button className="close-btn" onClick={() => setToggle(false)}>X</button>
            </dialog>
        </>
    );
}

export default NewChatButton;