import type { PinnedGroup } from "../../types/REST-types/Chatroom";
import { useFetchMessagesMultiple } from "../../hooks/useFetchMessages";
import ChatMessage from "../chat/ChatMessage";

interface pinnedChatroomsListProps {
  pinnedGroup: PinnedGroup;
}

export const PinnedChatroomsList = ({
  pinnedGroup,
}: pinnedChatroomsListProps) => {
  const getBefore = new Date();
  const results = useFetchMessagesMultiple(
    pinnedGroup.pinnedChatrooms.map((chatroom) => chatroom.chatroomId),
    getBefore,
    5,
  );
  /*
  const [pinnedChatroomsAndMessages, setPinnedChatroomsAndMessages] = useState<
    PinnedChatroom[]
  >([]);


  useEffect(() => {
    const data: PinnedChatroom[] = [];
    for (let i = 0; i < pinnedGroup.pinnedChatrooms.length; i++) {
      data[i] = {
        chatroomId: pinnedGroup.pinnedChatrooms[i].chatroomId,
        chatroom: {
          title: pinnedGroup.pinnedChatrooms[i].chatroom.title,
          messages: results[i].data ?? [],
        },
      };
    }
    setPinnedChatroomsAndMessages(data);
  }, [pinnedGroup]);
  */

  return (
    <ul>
      {pinnedGroup.pinnedChatrooms.map((chatroom, i) => (
        <li className="pinned-chatroom" key={chatroom.chatroomId}>
          <div>
            <h4>{chatroom.chatroom.title}</h4>
            <ul>
              {results[i].data?.map((message) => (
                <ChatMessage
                  key={message.id}
                  id={message.id}
                  content={message.content}
                  sender={message.senderUser.username || "Unnamed User"}
                  timestamp={new Date(message.createdAt)}
                />
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ul>
  );
};
