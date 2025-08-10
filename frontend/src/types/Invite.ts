export interface Invite {
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
}