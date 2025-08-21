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
    status: "PENDING" | "ACCEPTED";
}

export interface InviteResponse {
    chatroomId: string;
    joinedAt: Date;
    memberId: string;
}