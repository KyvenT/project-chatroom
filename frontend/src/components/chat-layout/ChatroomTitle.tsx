import { useParams } from "react-router";
import { useChatroomTitle } from "../../hooks/chat-layout/useChatroomTitle";
import Button from "../Button";
import useToggle from "../../hooks/useToggle";
import { useAuthStore } from "../../hooks/useStores";
import { ChatroomDetailsModal } from "./ChatroomDetailsModal";

export const ChatroomTitle = () => {
  const chatroomTitle = useChatroomTitle();
  const { chatroomId } = useParams();
  const [openChatroomDetails, setOpenChatroomDetails] = useToggle(false);
  const user = useAuthStore((state) => state.user);

  return (
    <>
      {chatroomTitle && chatroomId ? (
        <>
          <Button
            onClick={() => setOpenChatroomDetails(true)}
            variant="icon"
            className="title chatroom-details-btn"
            aria-label="Open chatroom details"
          >
            {chatroomTitle}
          </Button>
          {openChatroomDetails && (
            <ChatroomDetailsModal
              open={openChatroomDetails}
              onClose={() => setOpenChatroomDetails(false)}
              chatroomId={chatroomId}
              user={user}
              key={chatroomId}
            />
          )}
        </>
      ) : (
        <h1 className="title">Home</h1>
      )}
    </>
  );
};
