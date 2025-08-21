export interface Message {
    id: string;
    createdAt: string;
    chatroomId: string;
    content: string;
    senderUserId: string;
    senderUser: {
        username: string;
    };
    editedAt: Date | null;
}