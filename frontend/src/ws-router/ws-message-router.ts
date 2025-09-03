import type { JoinChatroom } from "../types/Chatroom";
import type { Invite } from "../types/Invite";
import type { Message } from "../types/Message";
import { useMessagesStore } from "../hooks/useStores";

export const wsMessageRouter = (message: any) => {
  switch (message.type) {
    case "auth":
      console.log("Authentication message received");
      break;
    case "chat-message":
      useMessagesStore.getState().addNewMessage(message as Message);
      break;
    case "invite":
      /*
      const newInvite: Invite = {
        id: message.invite.id,
        chatroomId: message.invite.chatroomId,
        senderId: message.invite.senderUserId,
        receiverId: message.invite.recipientUserId,
        sentAt: message.invite.createdAt,
        sender: {
          username: message.invite.senderUser.username,
        },
        chatroom: {
          title: message.invite.chatroom.title,
        },
        status: message.invite.status,
      };
      setEventQueues((prevEventQueues) => ({
        ...prevEventQueues,
        inviteQueue: [...prevEventQueues.inviteQueue, newInvite],
      }));
      */
      break;
    default:
      console.log("Unknown message type: " + message.type);
  }
};
