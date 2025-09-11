export interface Invite {
  receiver: {
    username: string;
  };
  sender: {
    username: string;
  };
  chatroom: {
    title: string;
  };
  id: string;
  senderId: string;
  receiverId: string;
  chatroomId: string;
  sentAt: Date;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
}

export interface InviteResponse {
  chatroomId: string;
  joinedAt: Date;
  memberId: string;
}
