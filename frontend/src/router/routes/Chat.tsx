import { css } from "@emotion/react";
import Sidebar from "../../components/Sidebar";
import Chatroom from "../../components/Chatroom";

const styles = css({
  minHeight: "100dvh",
  width: "100%",
  display: "flex",
})

function Chat() {
  return (
    <div css={styles}>
      <Sidebar />
      <Chatroom />
    </div>
  )
}

export default Chat;
